import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Group'
    },
    courts: [{
        _id: false, // prevent mongoose from creating an _id for each court object
        courtId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Court', required: true
        },
        gameType: { type: String, required: true }
    }],
    day: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    recurring: { type: Boolean, default: false },
    frequency: { type: Number, default: 0 },
    recurrenceCount: { type: Number, default: 1 },
    maxPlayersCount: { type: Number, required: true }, // Max players for a single game
    occurrenceNumber: { type: Number, default: 1 }, // Tracks the current occurrence/iteration number
    lastGeneratedOccurrenceNumber: { type: Number, default: 0 },
    isRotationGenerated: { type: Boolean, default: false },
    lastRotationGeneratedDate: { type: Date },
    playingPlayersIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    benchPlayersIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    status: {
        type: String,
        enum: ['PLANNING', 'ACTIVE', 'COMPLETED'],
        default: 'PLANNING'
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

scheduleSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;