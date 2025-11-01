import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const playerStatSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuidv4,
        unique: true,
    },
    playerId: {
        type: String,
        required: true,
    },
    scheduleId: {
        type: String,
        required: true,
    },
    stats: {
        type: [{ week: Number, status: String, date: String }],
        default: [],
    },
}, {
    timestamps: true,
});

const PlayerStat = mongoose.model('PlayerStat', playerStatSchema);

export default PlayerStat;
