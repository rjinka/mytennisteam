import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { config } from '../config.js';

const protect = async (req, res, next) => {
    let token;

     // 1. Check for token in httpOnly cookie (for web client)
    if (req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
        } catch (error) {
            res.status(401).json({ msg: 'Not authorized, token is invalid' });
        }
    }
    if (!token) {
       return  res.status(401).json({ msg: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(token, config.jwt_secret);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ msg: 'Not authorized, user not found' });
        }

        next();
    } catch (error) {
        console.error(error);
        return  res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

export { protect };