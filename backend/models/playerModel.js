import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true,
    },
    availability: [{
        _id: false, // Don't create a separate _id for subdocuments
        scheduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Schedule',
            required: true
        },
        type: { type: String, enum: ['Permanent', 'Rotation', 'Backup'], default: 'Rotation', required: true }
    }],
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
