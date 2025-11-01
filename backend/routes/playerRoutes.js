import express from 'express';
import Player from '../models/playerModel.js';
import User from '../models/userModel.js';
import Group from '../models/groupModel.js';
import Schedule from '../models/scheduleModel.js'; // Import Schedule model
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/players
// @desc    Get all players
// @access  Public
router.get('/', protect, async (req, res) => {
    try {
        const players = await Player.find().populate('user');
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/players/:id
// @desc    Update a player
// @access  Public
router.put('/:id', protect, async (req, res) => { // Note: `availability` is now in the body
    const { name, availability, scheduleStats } = req.body;

    try {
        // Find the player document and populate the associated user details
        const playerToUpdate = await Player.findOne({ id: req.params.id }).populate('user');

        if (!playerToUpdate) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        // Authorization check: User can edit themselves, or a group admin can edit them.
        const group = await Group.findOne({ id: playerToUpdate.groupid });
        const isSelf = playerToUpdate.userId === req.user.id;
        const isAdmin = group && group.admins.includes(req.user.id);

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ msg: 'User not authorized to edit this player' });
        }

        // If the name has changed, update the corresponding User document as well
        if (name && name !== playerToUpdate.user.name) {
            await User.findOneAndUpdate({ id: playerToUpdate.userId }, { $set: { name: name } });
        }

        // --- Handle selectedScheduleList changes and update affected schedules ---
        const oldAvailability = playerToUpdate.availability || [];
        const newAvailability = availability || [];

        const addedSchedules = newAvailability.filter(nav => !oldAvailability.some(oav => oav.scheduleId === nav.scheduleId)).map(a => a.scheduleId);
        const removedSchedules = oldAvailability.filter(oav => !newAvailability.some(nav => nav.scheduleId === oav.scheduleId)).map(a => a.scheduleId);

        for (const scheduleId of addedSchedules) {
            let schedule = await Schedule.findOne({ id: scheduleId });
            if (schedule) {
                const isLineupFull = (schedule.playingPlayersIds?.length || 0) >= (schedule.maxPlayersCount || 0);
                if (isLineupFull) {
                    // Add to bench if lineup is full
                    schedule.benchPlayersIds = [...new Set([...(schedule.benchPlayersIds || []), playerToUpdate.id])];
                } else {
                    // Add to playing if space is available
                    schedule.playingPlayersIds = [...new Set([...(schedule.playingPlayersIds || []), playerToUpdate.id])];
                }
                await schedule.save();
            }
        }

        for (const scheduleId of removedSchedules) {
            let schedule = await Schedule.findOne({ id: scheduleId });
            if (schedule) {
                schedule.playingPlayersIds = (schedule.playingPlayersIds || []).filter(id => id !== playerToUpdate.id);
                schedule.benchPlayersIds = (schedule.benchPlayersIds || []).filter(id => id !== playerToUpdate.id);

                // If a spot opened up, move a player from the bench to playing
                if (schedule.benchPlayersIds.length > 0 && schedule.playingPlayersIds.length < schedule.maxPlayersCount) {
                    const playerToMove = schedule.benchPlayersIds.shift(); // Take first from bench
                    schedule.playingPlayersIds.push(playerToMove);
                }
                await schedule.save();
            }
        }

        const player = await Player.findOneAndUpdate({ id: req.params.id }, { $set: { availability, scheduleStats } }, { new: true });

        res.json(player);
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/players/:id
// @desc    Delete a player
// @access  Public
router.delete('/:id', protect, async (req, res) => {
    try {
        let player = await Player.findOne({id: req.params.id});
        // Assuming player.id is the unique identifier, not MongoDB's _id. If player.id is used in frontend, this should be Player.findOne({ id: req.params.id })
        if (!player) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        // Authorization check: Only group admins can delete
        const group = await Group.findOne({ id: player.groupid });
        if (!group || !group.admins.includes(req.user.id)) {
            return res.status(403).json({ msg: 'User not authorized to delete this player' });
        }

        await player.deleteOne();
        res.json({ msg: 'Player removed' });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;
