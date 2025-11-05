import express from 'express';
import Court from '../models/courtModel.js';
import Player from '../models/playerModel.js';
import { protect } from '../middleware/authMiddleware.js';
import Group from '../models/groupModel.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// @route   GET /api/courts
// @desc    Get all courts
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ msg: 'Not authorized' });

        // 1. Find all groups the user is a player in.
        const playerEntries = await Player.find({ userId: req.user.id });
        const groupIds = playerEntries.map(p => p.groupid);

        // 2. Find all courts that belong to those groups.
        const courts = await Court.find({ groupid: { $in: groupIds } });

        res.json(courts);
    } catch (error) {
        console.error('Error fetching courts:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route GET /api/courts/:groupid
// @desc Get all courts for a group
// @access private
router.get('/:groupid', protect, async( req, res) => {
    try {
        const { groupid } = req.params;

        // check if group exists
        const group = await Group.findOne({ id: groupid });
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }
        
        // Get all courts for a group
        const courts = await Court.find({ groupid: groupid });
        res.json(courts);
        } catch (error) {
        console.error(`Error fetching courts for group ${req.params.groupid}:`, error);
        res.status(500).json({ msg: 'Server Error' });
    }
});


// @route   POST /api/courts
// @desc    Create a new court
router.post('/', protect, async (req, res) => {
    const { name, groupid } = req.body;

    try {
        // Authorization check: Only group admins can create courts
        const Group = (await import('../models/groupModel.js')).default;
        const group = await Group.findOne({ id: groupid });
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (!req.user.isSuperAdmin && !group.admins.includes(req.user.id)) {
            return res.status(403).json({ msg: 'User not authorized to add courts to this group' });
        }

        const newCourt = new Court({
            id: uuidv4(),
            name,
            groupid
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
    const { name, groupid } = req.body;

    try {
        const court = await Court.findOneAndUpdate({ id: req.params.id }, { $set: { name, groupid } }, { new: true });
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
        const court = await Court.findOne({ id: req.params.id });

        if (!court) {
            return res.status(404).json({ msg: 'Court not found' });
        }

        // Authorization check: Only group admins can delete courts
        const group = await Group.findOne({ id: court.groupid });
        if (!group) {
            return res.status(404).json({ msg: 'Group not found' });
        }

        if (!req.user.isSuperAdmin && (!group || !group.admins.includes(req.user.id))) {
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
