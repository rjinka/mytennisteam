import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    // The name of the schedule (e.g., "Morning Match").
    name: { type: String, required: true, trim: true },
    // The group this schedule belongs to.
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Group'
    },
    // An array of courts and their game types (Singles/Doubles) for this schedule.
    courts: [{
        _id: false, // prevent mongoose from creating an _id for each court object
        courtId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Court', required: true
        },
        gameType: { type: String, required: true }
    }],
    // The day of the week for the schedule (0=Sunday, 6=Saturday).
    day: { type: String, required: true },
    // The start time of the schedule (e.g., "09:00").
    time: { type: String, required: true },
    // The duration of the schedule in minutes.
    duration: { type: Number, required: true },
    // Flag indicating if the schedule is recurring.
    recurring: { type: Boolean, default: false },
    // The frequency of recurrence (0=None, 1=Daily, 2=Weekly, etc.).
    frequency: { type: Number, default: 0 },
    // The total number of times the recurring schedule will occur.
    recurrenceCount: { type: Number, default: 1 },
    // The maximum number of players that can play in a single rotation.
    maxPlayersCount: { type: Number, required: true }, // Max players for a single game
    // Tracks the current occurrence number for recurring schedules.
    occurrenceNumber: { type: Number, default: 1 }, // Tracks the current occurrence/iteration number
    // The last occurrence number for which a rotation was generated.
    lastGeneratedOccurrenceNumber: { type: Number, default: 0 },
    // Flag indicating if a rotation has been generated for the current occurrence.
    isRotationGenerated: { type: Boolean, default: false },
    // The date when the last rotation was generated.
    lastRotationGeneratedDate: { type: Date },
    // An array of Player IDs who are currently set to play.
    playingPlayersIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    // An array of Player IDs who are currently on the bench.
    benchPlayersIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player'
    }],
    // The current status of the schedule.
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