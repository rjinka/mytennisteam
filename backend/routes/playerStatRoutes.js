import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import PlayerStat from '../models/playerStatModel.js';
import Player from '../models/playerModel.js';

const router = express.Router();

// @route   GET /api/stats/player/:playerId
// @desc    Get all stats for a specific player
// @access  Private
router.get('/player/:playerId', protect, async (req, res) => {
    try {
        const player = await Player.findById(req.params.playerId);
        if (!player) {
            return res.status(404).json({ msg: 'Player not found' });
        }

        const stats = await PlayerStat.find({ playerId: req.params.playerId }).populate('scheduleId', 'name');
        if (!stats) {
            return res.json({ playerId: req.params.playerId, stats: [] });
        }
        res.json(stats);
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   GET /api/stats/schedule/:scheduleId
// @desc    Get all stats for a specific schedule
// @access  Private
router.get('/schedule/:scheduleId', protect, async (req, res) => {
    try {
        const stats = await PlayerStat.find({ scheduleId: req.params.scheduleId })
            .populate({
                path: 'playerId',
                populate: { path: 'user', select: 'name picture' }
            });
         if (!stats) {
            // no stats exist for a schedule
            return res.json({ stats: [] });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error fetching schedule stats:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;