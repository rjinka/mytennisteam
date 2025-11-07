import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    groupid: { type: String, required: true },
    courts: [{
        _id: false, // prevent mongoose from creating an _id for each court object
        courtId: { type: String, required: true },
        gameType: { type: String, required: true }
    }],
    day: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    recurring: { type: Boolean, default: false },
    frequency: { type: Number, default: 0 },
    recurrenceCount: { type: Number, default: 1 },
    maxPlayersCount: { type: Number, required: true },
    week: { type: Number, default: 1 },
    lastGeneratedWeek: { type: Number, default: 0 },
    isRotationGenerated: { type: Boolean, default: false },
    lastRotationGeneratedDate: { type: Date },
    playingPlayersIds: [{ type: String }],
    benchPlayersIds: [{ type: String }],
    isCompleted: { type: Boolean, default: false },
}, {
    timestamps: true,
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;