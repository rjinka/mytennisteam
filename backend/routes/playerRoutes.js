import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Player from '../models/playerModel.js';
import Group from '../models/groupModel.js';
import Schedule from '../models/scheduleModel.js';
import PlayerStat from '../models/playerStatModel.js';
import User from '../models/userModel.js';
import { isGroupAdmin, isOwner, isOwner } from '../utils/util.js';


const router = express.Router();

// @route   GET /api/players/:groupId
// @desc    Get all players for a specific group
// @access  Private
router.get('/:groupId', protect, async (req, res) => {
    try {
        const players = await Player.find({ groupId: req.params.groupId }).populate('user', 'name picture id');
        res.json(players);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/players/:id
// @desc    Update a player's availability for schedules
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { availability, name } = req.body; // Expecting an array like [{ scheduleId, type }, ...]

    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        // Authorization: User must be an admin of the group the player is in.
        const group = await Group.findById(player.groupId);
        const isOwner = isOwner(req.user, player);
        const isAdmin = isGroupAdmin(req.user, group);


        if (!isOwner && !isAdmin) {
            return res.status(403).json({ msg: 'User not authorized to edit this player' });
        }

        // Check if any availability change is for an active or completed schedule
        const oldAvailabilityMap = new Map(player.availability.map(a => [a.scheduleId.toString(), a.type]));
        const newAvailabilityMap = new Map(availability.map(a => [a.scheduleId.toString(), a.type]));

        const allScheduleIds = new Set([...oldAvailabilityMap.keys(), ...newAvailabilityMap.keys()]);

        for (const scheduleId of allScheduleIds) {
            const oldType = oldAvailabilityMap.get(scheduleId);
            const newType = newAvailabilityMap.get(scheduleId);

            if (oldType !== newType) { // Covers additions, removals, and type changes
                const schedule = await Schedule.findById(scheduleId);
                if (schedule && (schedule.status === 'ACTIVE' || schedule.status === 'COMPLETED')) {
                    return res.status(400).json({ msg: `Cannot change availability for schedule "${schedule.name}" because it is active or completed.` });
                }
            }
        }

        // --- Logic to update schedules based on new availability ---
        const oldAvailability = player.availability || [];

        // Process removals first
        for (const oldAvail of oldAvailability) {
            const newAvail = availability.find(a => a.scheduleId.toString() === oldAvail.scheduleId.toString());
            if (!newAvail) { // If schedule is no longer in availability, remove player
                await Schedule.findByIdAndUpdate(oldAvail.scheduleId, {
                    $pull: { playingPlayersIds: player._id, benchPlayersIds: player._id }
                });
            }
        }

        // Process additions/updates
        for (const newAvail of availability) {
            const schedule = await Schedule.findById(newAvail.scheduleId);
            if (!schedule) continue;

            // Remove player from both lists to prevent duplicates before re-adding
            // Do not add player to lineup if schedule is in planning
            if (schedule.status !== 'PLANNING') {
                schedule.playingPlayersIds.pull(player._id);
                schedule.benchPlayersIds.pull(player._id);

                if (newAvail.type === 'Permanent' || newAvail.type === 'Rotation') {
                    if (schedule.playingPlayersIds.length < schedule.maxPlayersCount) {
                        schedule.playingPlayersIds.push(player._id);
                    } else {
                        schedule.benchPlayersIds.push(player._id);
                    }
                }
            }
            // If type is 'Backup', they are not added to playing/bench initially

            await schedule.save();
        }

        // --- Update the player document ---
        player.availability = availability;
        await player.save();

        const user = await User.findById(player.userId);

        // -- if name is changes, update the name in users document
        if (name && name !== user.name) {
            user.name = name;
            await user.save();
        }
        const updatedPlayer = await Player.findById(player._id).populate('user', 'name picture id');
        res.json(updatedPlayer);

    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/players/:id
// @desc    Delete a player from a group
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        // Authorization: User must be an admin of the group.
        const group = await Group.findById(player.groupId);
        if (!group) {
            // If group doesn't exist, player is orphaned, allow deletion.
            // This is a cleanup case.
        } else if (!isGroupAdmin(req.user, group)) {
            return res.status(403).json({ msg: 'User not authorized to remove this player' });
        }

        // Perform cascading cleanup
        // 1. Remove player from all schedules in their group
        await Schedule.updateMany(
            { groupId: player.groupId },
            { $pull: { playingPlayersIds: player._id, benchPlayersIds: player._id } }
        );

        // 2. Delete all stats associated with this player
        await PlayerStat.deleteMany({ playerId: player._id });

        // 3. Delete the player document itself
        await player.deleteOne();

        res.json({ msg: 'Player removed successfully' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;