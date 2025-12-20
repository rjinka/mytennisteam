import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import Group from '../models/groupModel.js';
import Player from '../models/playerModel.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
router.get('/me', protect, async (req, res) => {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user.id).select('-password'); // Exclude password
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ msg: 'User not found' });
    }
});

// @desc DELETE current user profile
// @route DELETE /api/users/me
// @access Private
router.delete('/me', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        // Conditions:
        // 1. User must not be in any groups or an admin of any groups.
        const groupCount = await Group.countDocuments({ admins: { $in: [userId] } })

        if (groupCount > 0) {
            res.status(400);
            throw new Error('You cannot delete your account while you are a member or an administrator of any groups. Please leave all groups and/or transfer admin rights before deleting your account.');
        }

        // 2. User must not be a players in any groups
        const playerCount = await Player.countDocuments({ userId: userId });
        if (playerCount > 0) {
            res.status(400);
            throw new Error('You cannot delete your account while you are player for an active group. Please contact your group admins to remove you from the group.');
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }

        await User.findByIdAndDelete(userId);

        // Clear auth cookie
        res.cookie('token', '', {
            httpOnly: true,
            expires: new Date(0),
        });

        // Send an email to inform user account has been deleted
        try {
            await sendEmail({
                email: user.email,
                subject: `Your account has been deleted`,
                message: `Sorry to see you go. Your account has been permanently deleted.`
            });
        } catch (emailError) {
            console.error('Failed to send deletion email:', emailError);
            // Don't fail the whole request if just the email fails
        }

        res.json({ msg: 'Your account has been successfully deleted.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode).json({ msg: error.message || 'Server Error' });
    }
});

// @desc    Logout user and clear cookie
// @route   POST /api/users/logout
// @access  Private
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0), // Expire the cookie immediately
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

export default router;