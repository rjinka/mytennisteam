// backend/routes/authRoutes.js

import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/userModel.js';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
}

// This route now receives the POST directly from Google
router.post('/google', async (req, res) => {
    try {
        // Google sends the credential in the body of a form-urlencoded request
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ msg: 'Missing Google credential.' });
        }

        // Verify the JWT from Google to get user info securely
        const googleUser = await verifyGoogleToken(credential);

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

// @desc    Authenticate user from a mobile app using Google ID Token
// @route   POST /api/auth/google/mobile
router.post('/google/mobile', async (req, res) => {
    try {
        const { token: idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ msg: 'Missing Google ID token.' });
        }

        // Verify the ID token with Google
        const googleUser = await verifyGoogleToken(idToken);

        let user = await User.findOne({ googleId: googleUser.sub });

        if (!user) {
            user = new User({
                googleId: googleUser.sub,
                id: uuidv4(),
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
            });
        }

        // Update last login timestamp for both new and existing users
        user.lastLoginAt = new Date();
        await user.save();

        // Create and sign your application's JWT
        const payload = { id: user.id, name: user.name, isSuperAdmin: user.isSuperAdmin };
        const appToken = jwt.sign(payload, config.jwt_secret, { expiresIn: '1d' });

        // Return your app's token in the response body
        res.status(200).json({ token: appToken });
    } catch (error) {
        console.error('Error in Google mobile auth:', error);
        res.status(401).json({ msg: 'Authentication failed. Invalid token.' });
    }
});

export default router;
