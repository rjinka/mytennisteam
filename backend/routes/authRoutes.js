import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/userModel.js';
import { config } from '../config.js';

const router = express.Router();
const client = new OAuth2Client(config.google_client_id);

async function verifyGoogleToken(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.google_client_id,
    });
    return ticket.getPayload();
}

/**
 * Finds an existing user or creates a new one based on the Google profile.
 * Also updates the last login timestamp.
 * @param {object} googleUser - The payload from the verified Google ID token.
 * @returns {Promise<User>} The user document from the database.
 */
async function findOrCreateUserFromGoogle(googleUser) {
    let user = await User.findOne({ googleId: googleUser.sub });

    if (!user) {
        user = new User({
            googleId: googleUser.sub,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
        });
    }
    user.lastLoginAt = new Date();
    return await user.save();
}

// @desc    Logout user and clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0), // Expire the cookie immediately
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// This route now receives the POST from the frontend client
router.post('/google', async (req, res) => {
    try {
        // Frontend sends { token }
        const { token, credential } = req.body;
        const idToken = token || credential;

        if (!idToken) {
            return res.status(400).json({ msg: 'Missing Google credential.' });
        }

        // Verify the JWT from Google to get user info securely
        const googlePayload = await verifyGoogleToken(idToken);
        const user = await findOrCreateUserFromGoogle(googlePayload);
        // Create your application's JWT
        const payload = { id: user._id, name: user.name, isSuperAdmin: user.isSuperAdmin };
        const appToken = jwt.sign(payload, config.jwt_secret, { expiresIn: '30d' });

        // Set the token in an httpOnly cookie
        res.cookie('token', appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
            sameSite: 'strict', // Mitigate CSRF attacks
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Return user data as JSON
        res.status(200).json(user);

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
        const googlePayload = await verifyGoogleToken(idToken);
        const user = await findOrCreateUserFromGoogle(googlePayload);
        // Create and sign your application's JWT
        const payload = { id: user._id, name: user.name, isSuperAdmin: user.isSuperAdmin };
        const appToken = jwt.sign(payload, config.jwt_secret, { expiresIn: '30d' });

        // Return your app's token in the response body
        res.status(200).json({ token: appToken, user: { id: user.id, name: user.name, isSuperAdmin: user.isSuperAdmin } });
    } catch (error) {
        console.error('Error in Google mobile auth:', error);
        res.status(401).json({ msg: 'Authentication failed. Invalid token.' });
    }
});

export default router;
