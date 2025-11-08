import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Player from '../models/playerModel.js';
import Group from '../models/groupModel.js';
import Schedule from '../models/scheduleModel.js';
import PlayerStat from '../models/playerStatModel.js';

const router = express.Router();

// @route   GET /api/players/:groupId
// @desc    Get all players for a specific group
// @access  Private
router.get('/:groupId', protect, async (req, res) => {
    try {
        const players = await Player.find({ groupId: req.params.groupId }).populate('user');
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
    const { availability } = req.body; // Expecting an array like [{ scheduleId, type }, ...]

    try {
        const player = await Player.findById(req.params.id);
        if (!player) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        // Authorization: User must be an admin of the group the player is in.
        const group = await Group.findById(player.groupId);
        if (!req.user.isSuperAdmin && !group.admins.some(adminId => adminId.equals(req.user._id))) {
            return res.status(403).json({ msg: 'User not authorized to edit this player' });
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
            schedule.playingPlayersIds.pull(player._id);
            schedule.benchPlayersIds.pull(player._id);

            if (newAvail.type === 'Permanent' || newAvail.type === 'Rotation') {
                if (schedule.playingPlayersIds.length < schedule.maxPlayersCount) {
                    schedule.playingPlayersIds.push(player._id);
                } else {
                    schedule.benchPlayersIds.push(player._id);
                }
            }
            // If type is 'Backup', they are not added to playing/bench initially

            await schedule.save();
        }

        // --- Update the player document ---
        player.availability = availability;
        await player.save();

        const updatedPlayer = await Player.findById(player._id).populate('user');
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
        } else if (!req.user.isSuperAdmin && !group.admins.some(adminId => adminId.equals(req.user._id))) {
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