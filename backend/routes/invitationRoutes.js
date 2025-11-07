import express from 'express';
import Invitation from '../models/invitationModel.js';
import Player from '../models/playerModel.js';
import Group from '../models/groupModel.js';
import { protect } from '../middleware/authMiddleware.js';
import { v4 as uuidv4 } from 'uuid';


const router = express.Router();

// @desc    Verify an invitation token
// @route   GET /api/invitations/verify/:join_token
router.get('/verify/:join_token', protect, async (req, res) => {
    try {
        const invitation = await Invitation.findOne({ join_token: req.params.join_token, expires: { $gt: Date.now() } });
        if (!invitation) {
            return res.status(400).json({ msg: 'Invitation is invalid or has expired.' });
        }
        const group = await Group.findOne({ id: invitation.groupId });
        if (!group) {
            return res.status(404).json({ msg: 'Associated group not found.' });
        }
        res.json({ email: invitation.email, groupName: group.name });
    } catch (error) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @desc    Accept an invitation
// @route   POST /api/invitations/accept/:token
router.post('/accept/:token', protect, async (req, res) => {
    try {
        const invitation = await Invitation.findOne({ join_token: req.params.token, expires: { $gt: Date.now() } });

        if (!invitation) {
            return res.status(400).json({ msg: 'Invitation is invalid or has expired.' });
        }

        // Check if the logged-in user's email matches the invitation email
        if (req.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
            return res.status(403).json({ msg: 'This invitation is for a different user.' });
        }

        const group = await Group.findOne({ id: invitation.groupId });
        if (!group) {
            return res.status(404).json({ msg: 'Associated group not found.' });
        }

        // Check if player already exists in the group
        const playerExists = await Player.findOne({ groupid: group.id, userId: req.user.id });
        if (playerExists) {
            await invitation.deleteOne();
            return res.status(400).json({ msg: 'You are already a player in this group.' });
        }

        // Create a new player
        const newPlayer = new Player({
            id: uuidv4(),
            userId: req.user.id,
            groupid: group.id,
        });
        await newPlayer.save();
        await invitation.deleteOne();

        res.status(200).json({ msg: 'Invitation accepted! You are now a player in the group.' });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;