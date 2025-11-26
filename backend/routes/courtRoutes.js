import express from 'express';
import Court from '../models/courtModel.js';
import Player from '../models/playerModel.js';
import Group from '../models/groupModel.js';
import { protect } from '../middleware/authMiddleware.js';
import { isGroupAdmin } from '../utils/util.js';


const router = express.Router();

// @route   GET /api/courts
// @desc    Get all courts
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ msg: 'Not authorized' });

        // 1. Find all groups the user is a player in.
        const playerEntries = await Player.find({ userId: req.user._id });
        const groupIds = playerEntries.map(p => p.groupId);

        // 2. Find all courts that belong to those groups.
        const courts = await Court.find({ groupId: { $in: groupIds } });

        res.json(courts);
    } catch (error) {
        console.error('Error fetching courts:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route GET /api/courts/:groupId
// @desc Get all courts for a group
// @access private
router.get('/:groupId', protect, async( req, res) => {
    try {
        const { groupId } = req.params;

        // check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }
        
        // Get all courts for a group
        const courts = await Court.find({ groupId: groupId });
        res.json(courts);
        } catch (error) {
        console.error(`Error fetching courts for group ${req.params.groupId}:`, error);
        res.status(500).json({ msg: 'Server Error' });
    }
});


// @route   POST /api/courts
// @desc    Create a new court
router.post('/', protect, async (req, res) => {
    const { name, groupId } = req.body;

    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (!isGroupAdmin(req.user, group)) {
            return res.status(403).json({ msg: 'User not authorized to add courts to this group' });
        }

        const newCourt = new Court({
            name,
            groupId
        });

        const court = await newCourt.save();
        res.status(201).json(court);
    } catch (error) {
        console.error('Error creating court:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/courts/:id
// @desc    Update a court
router.put('/:id', protect, async (req, res) => {
    const { name } = req.body;

    try {
        const court = await Court.findByIdAndUpdate(req.params.id, { $set: { name } }, { new: true });
        if (!court) {
            return res.status(404).json({ msg: 'Court not found' });
        }
        res.json(court);
    } catch (error) {
        console.error('Error updating court:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/courts/:id
// @desc    Delete a court
router.delete('/:id', protect, async (req, res) => {
    try {
        const court = await Court.findById(req.params.id);

        if (!court) {
            return res.status(404).json({ msg: 'Court not found' });
        }

        // Authorization check: Only group admins can delete courts
        const group = await Group.findById(court.groupId);
        if (!group) {
            // If group doesn't exist, player is orphaned, allow deletion.
            // This is a cleanup case.
        } else if (!isGroupAdmin(req.user, group)) {
            return res.status(403).json({ msg: 'User not authorized to delete this court' });
        }

        await court.deleteOne();
        res.json({ msg: 'Court removed' });
    } catch (error) {
        console.error('Error deleting court:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;
