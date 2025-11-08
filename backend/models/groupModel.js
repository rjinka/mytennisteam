import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    admins: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        required: true,
        default: [],
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

groupSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Group = mongoose.model('Group', groupSchema);

export default Group;