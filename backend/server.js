import express from 'express';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config.js';
import groupRoutes from './routes/groupRoutes.js';
import authRoutes from './routes/authRoutes.js';
import courtRoutes from './routes/courtRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import playerStatRoutes from './routes/playerStatRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import supportRoutes from './routes/supportRoutes.js';


import http from 'http';
import { initSocket } from './socket.js';

console.log(`Running in ${process.env.NODE_ENV || 'development'} mode.`);

const app = express();
const server = http.createServer(app);

app.use(cookieParser());
// ... (rest of the middleware)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'https://mytennisteam.com',
    'https://mytennisteam-fe.web.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// Initialize Socket.io
initSocket(server, allowedOrigins);

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Tennis Rotating Tool API!', status: 'ok' });
});

// --- Protected API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/version', versionRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/stats', playerStatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);

const startServer = async () => {
    try {
        let finalMongoUri = config.mongo_uri;
        if (finalMongoUri.startsWith('mongodb+srv://')) {
            const uri = new URL(finalMongoUri);
            if (!uri.pathname || uri.pathname === '/') {
                uri.pathname = `/${config.dbName}`;
                finalMongoUri = uri.toString();
            }
        }

        const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };
        await mongoose.connect(finalMongoUri, clientOptions);
        console.log('MongoDB connected successfully.');

        const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

export { app, server, startServer };
