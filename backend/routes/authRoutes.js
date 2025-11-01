// backend/routes/authRoutes.js

import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// This route now receives the POST directly from Google
router.post('/google', async (req, res) => {
    try {
        // Google sends the credential in the body of a form-urlencoded request
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ msg: 'Missing Google credential.' });
        }

        // Decode the JWT from Google to get user info
        const googleUser = jwt.decode(credential);

        let user = await User.findOne({ googleId: googleUser.sub });

        if (!user) {
            user = new User({
                googleId: googleUser.sub,
                id: uuidv4(),
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
            });
            await user.save();
        }

        // Update last login timestamp for both new and existing users
        user.lastLoginAt = new Date();
        await user.save();

        // Create your application's JWT
        const payload = { id: user.id, name: user.name, isSuperAdmin: user.isSuperAdmin };
        const token = jwt.sign(payload, config.jwt_secret, { expiresIn: '1d' });

        // Redirect back to the frontend, passing the token as a query parameter
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
        res.redirect(`${frontendUrl}?token=${token}`);

    } catch (error) {
        console.error('Error in Google auth callback:', error);
        res.status(500).json({ msg: 'Server error during authentication.' });
    }
});

export default router;
