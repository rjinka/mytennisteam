import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    groupid: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

const Court = mongoose.model('Court', courtSchema);

export default Court;
