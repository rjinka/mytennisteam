import mongoose from 'mongoose';

const playerStatSchema = new mongoose.Schema({
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Player',
    },
    scheduleId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Schedule',
    },
    stats: {
        type: [{ occurrenceNumber: Number, status: String, date: String }],
        default: [],
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

playerStatSchema.virtual('id').get(function() { return this._id.toHexString(); });

const PlayerStat = mongoose.model('PlayerStat', playerStatSchema);

export default PlayerStat;
