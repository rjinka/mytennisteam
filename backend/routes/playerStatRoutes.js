import express from 'express';
import PlayerStat from '../models/playerStatModel.js';
import { protect } from '../middleware/authMiddleware.js';
import Schedule from '../models/scheduleModel.js';
import Group from '../models/groupModel.js';

const router = express.Router();

// @route   GET /api/playerstats/:playerId/:scheduleId
// @desc    Get player stats for a schedule
// @access  Private
router.get('/:playerId/:scheduleId', protect, async (req, res) => {
    try {
        const playerStat = await PlayerStat.findOne({ playerId: req.params.playerId, scheduleId: req.params.scheduleId });
        if (!playerStat) {
            // It's common for stats not to exist yet, so return an empty object instead of 404.
            return res.json({ playerId: req.params.playerId, scheduleId: req.params.scheduleId, stats: [] });
        }
        res.json(playerStat);
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/playerstats
// @desc    Create or update a player stat entry
// @access  Private (Admin only)
router.post('/', protect, async (req, res) => {
    const { playerId, scheduleId, stats } = req.body;

    try {
        // Authorization check: Only group admins can create/update stats
        const schedule = await Schedule.findOne({ id: scheduleId });
        if (!schedule) {
            return res.status(404).json({ msg: 'Schedule not found' });
        }
        const group = await Group.findOne({ id: schedule.groupid });
        if (!req.user.isSuperAdmin && (!group || !group.admins.includes(req.user.id))) {
            return res.status(403).json({ msg: 'User not authorized to modify stats for this schedule' });
        }

        // Use findOneAndUpdate with upsert:true to create if not exists, or update if it does.
        const updatedPlayerStat = await PlayerStat.findOneAndUpdate(
            { playerId, scheduleId },
            { $set: { stats } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json(updatedPlayerStat);
    } catch (error) {
        console.error('Error creating/updating player stat:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/playerstats/:id
// @desc    Update a player stat
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res) => {
    const { stats } = req.body;

    try {
        const playerStat = await PlayerStat.findOne({ id: req.params.id });
        if (!playerStat) {
            return res.status(404).json({ msg: 'Player stats not found' });
        }

        // Authorization check
        const schedule = await Schedule.findOne({ id: playerStat.scheduleId });
        if (!schedule) {
            return res.status(404).json({ msg: 'Associated schedule not found' });
        }
        const group = await Group.findOne({ id: schedule.groupid });
        if (!req.user.isSuperAdmin && (!group || !group.admins.includes(req.user.id))) {
            return res.status(403).json({ msg: 'User not authorized to modify stats for this schedule' });
        }

        const updatedPlayerStat = await PlayerStat.findOneAndUpdate(
            { id: req.params.id },
            { $set: { stats: stats } },
            { new: true }
        );

        res.json(updatedPlayerStat);
    } catch (error) {
        console.error('Error updating player stat:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;
