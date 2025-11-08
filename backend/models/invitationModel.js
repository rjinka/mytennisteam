import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
    join_token: {
        type: String,
        required: true,
        unique: true,
        default: () => crypto.randomBytes(20).toString('hex'),
    },
    expires: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

invitationSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;