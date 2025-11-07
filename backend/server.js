import express from 'express';
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

console.log(`Running in ${process.env.NODE_ENV || 'development'} mode.`);

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies, which is what Google's redirect uses
app.use(express.urlencoded({ extended: true }));

// --- Public Routes (before CORS) ---
// The Google Auth route must be before the strict CORS policy to accept POSTs from Google's servers.
app.use('/api/auth', authRoutes);

// --- CORS Configuration ---
// Define the list of allowed origins (domains)
const allowedOrigins = [
    'http://localhost:5000', // Vite dev server
    'http://127.0.0.1:5000', // Default for live-server
    'https://mytennisteam.com', // Production frontend domain
    'https://mytennisteam-fe.web.app', // backup
    process.env.FRONTEND_URL   // Your deployed frontend URL from Firebase Hosting
].filter(Boolean); // Filter out any falsy values (e.g., undefined from process.env)

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);


        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed custom headers
};
app.use(cors(corsOptions));

// --- Root Route for Health Check ---
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Tennis Rotating Tool API!', status: 'ok' });
});

// --- Protected API Routes (after CORS) ---
app.use('/api/groups', groupRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/stats', playerStatRoutes);

const startServer = async () => {
    try {
        // Use the module-level mongo_uri constant. Declare a mutable variable to handle path modification.
        let finalMongoUri = config.mongo_uri;

        // For Atlas URIs, ensure the database name is correctly set in the path.
        // If the URI path is missing or is just '/', it will be replaced with the correct dbName.
        if (finalMongoUri.startsWith('mongodb+srv://')) {
            const uri = new URL(finalMongoUri);
            if (!uri.pathname || uri.pathname === '/') {
                uri.pathname = `/${config.dbName}`; // Use the dbName from config
                finalMongoUri = uri.toString();
            }
        }

        const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

        // --- Database Connection ---
        await mongoose.connect(finalMongoUri, clientOptions);

        console.log('MongoDB connected successfully.');

        // --- Start Server ---
        const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit process with failure
    }
};

// Start the server only if this file is run directly (not when imported for tests)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app, startServer };
