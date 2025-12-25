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

router.post('/logout', (req, res) => {
    res.cookie('token', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/google', async (req, res) => {
    try {
        const { token, credential } = req.body;
        const idToken = token || credential;

        if (!idToken) {
            return res.status(400).json({ msg: 'Missing Google credential.' });
        }

        let googlePayload;
        try {
            googlePayload = await verifyGoogleToken(idToken);
        } catch (e) {
            try {
                const userRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${idToken}`);
                googlePayload = await userRes.json();
            } catch (e2) {
                console.error('Token verification failed:', e2);
                return res.status(401).json({ msg: 'Invalid Google token.' });
            }
        }

        const user = await findOrCreateUserFromGoogle(googlePayload);
        const payload = { id: user._id, name: user.name, isSuperAdmin: user.isSuperAdmin };
        const appToken = jwt.sign(payload, config.jwt_secret, { expiresIn: '30d' });

        res.cookie('token', appToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        // If this was a form POST from Google (login_uri), redirect back to frontend
        if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
            return res.redirect(process.env.FRONTEND_URL);
        }

        res.status(200).json(user);

    } catch (error) {
        console.error('Error in Google auth callback:', error);
        res.status(500).json({ msg: 'Server error during authentication.' });
    }
});

router.post('/google/mobile', async (req, res) => {
    try {
        const { token: idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ msg: 'Missing Google ID token.' });
        }

        const googlePayload = await verifyGoogleToken(idToken);
        const user = await findOrCreateUserFromGoogle(googlePayload);
        const payload = { id: user._id, name: user.name, isSuperAdmin: user.isSuperAdmin };
        const appToken = jwt.sign(payload, config.jwt_secret, { expiresIn: '30d' });

        res.status(200).json({ token: appToken, user: { id: user.id, name: user.name, isSuperAdmin: user.isSuperAdmin } });
    } catch (error) {
        console.error('Error in Google mobile auth:', error);
        res.status(401).json({ msg: 'Authentication failed. Invalid token.' });
    }
});

export default router;
