import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js'; // Assuming you have a User model

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

export default router;