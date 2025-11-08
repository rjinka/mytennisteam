import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { config } from '../config.js';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            // Verify token
            const decoded = jwt.verify(token, config.jwt_secret);
            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ msg: 'Not authorized' });

            next();
        } catch (error) {
            res.status(401).json({ msg: 'Not authorized, token is invalid' });
        }
    }
    if (!token) {
        res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

export { protect };