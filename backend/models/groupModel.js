import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: String,
        ref: 'User',
        required: true,
    },
    admins: {
        type: [String],
        required: true,
        default: [],
    },
}, {
    timestamps: true,
});

const Group = mongoose.model('Group', groupSchema);

export default Group;