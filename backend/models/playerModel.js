import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    groupid: {
        type: String,
        required: true,
    },
    availability: [{
        _id: false, // Don't create a separate _id for subdocuments
        scheduleId: { type: String, required: true },
        type: { type: String, enum: ['Permanent', 'Rotation', 'Backup'], default: 'Rotation', required: true }
    }],
    scheduleStats: {
        type: Map,
        of: [mongoose.Schema.Types.Mixed],
        default: {},
    },
}, {
    timestamps: true,
});

// Create a virtual property 'user' that links to the User model
playerSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: 'id',
    justOne: true
});

// Ensure virtual fields are included when converting to JSON
playerSchema.set('toJSON', { virtuals: true });
playerSchema.set('toObject', { virtuals: true });

const Player = mongoose.model('Player', playerSchema);

export default Player;
