import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    groupId: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(20).toString('hex'),
    },
    expires: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    },
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;