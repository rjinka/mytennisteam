import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    // Reference to the User document for this player.
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // The group this player profile belongs to.
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    // An array defining the player's availability for different schedules.
    availability: [{
        _id: false, // Don't create a separate _id for subdocuments
        scheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Schedule',
            required: true
        },
        type: { type: String, enum: ['Permanent', 'Rotation', 'Backup'], default: 'Rotation', required: true }
    }],
    // Deprecated. Stats are now stored in the PlayerStat collection.
    scheduleStats: {
        type: Map,
        of: [mongoose.Schema.Types.Mixed],
        default: {},
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Create a virtual property 'user' that links to the User model
playerSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});

playerSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Player = mongoose.model('Player', playerSchema);

export default Player;
