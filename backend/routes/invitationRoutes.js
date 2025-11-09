import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Invitation from '../models/invitationModel.js';
import Player from '../models/playerModel.js';
import Group from '../models/groupModel.js';

const router = express.Router();

// @route   GET /api/invitations/verify/:join_token
// @desc    Verify an invitation token and get group info
// @access  Public
router.get('/verify/:join_token', async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            join_token: req.params.join_token,
            expires: { $gt: Date.now() }
        });

        if (!invitation) {
            return res.status(400).json({ msg: 'Invitation is invalid or has expired.' });
        }

        const group = await Group.findById(invitation.groupId);
        if (!group) {
            return res.status(404).json({ msg: 'The associated group no longer exists.' });
        }

        res.json({
            email: invitation.email,
            groupName: group.name,
            groupId: group._id
        });
    } catch (error) {
        console.error('Error verifying invitation:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   POST /api/invitations/accept/:join_token
// @desc    Accept an invitation and become a player in the group
// @access  Private
router.post('/accept/:join_token', protect, async (req, res) => {
    try {
        const invitation = await Invitation.findOne({
            join_token: req.params.join_token,
            expires: { $gt: Date.now() }
        });

        if (!invitation) {
            return res.status(400).json({ msg: 'Invitation is invalid or has expired.' });
        }

        // Security check: Ensure the logged-in user is the one who was invited
        if (invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ msg: 'You are not authorized to accept this invitation.' });
        }

        // Check if user is already a player in this group
        const existingPlayer = await Player.findOne({ userId: req.user._id, groupId: invitation.groupId });
        if (existingPlayer) {
            await invitation.deleteOne(); // Clean up the used invitation
            return res.status(400).json({ msg: 'You are already a member of this group.' });
        }

        // Create the new player record
        const newPlayer = new Player({
            userId: req.user._id,
            groupId: invitation.groupId,
        });
        await newPlayer.save();

        await invitation.deleteOne(); // The invitation is now used, delete it

        res.status(200).json({ msg: 'Invitation accepted successfully! You are now a member of the group.' });
    } catch (error) {
        console.error('Error accepting invitation:', error);
        res.status(500).json({ msg: 'Server Error' });
    }
});

export default router;