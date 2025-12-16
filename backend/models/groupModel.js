import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
    // The name of the group.
    name: {
        type: String,
        required: true,
        trim: true,
    },
    // The user who originally created the group.
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // An array of user IDs who have administrative privileges for this group.
    admins: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        required: true,
        default: [],
    },
    // A unique 6-digit code for joining the group.
    joinCode: {
        type: String,
        unique: true,
        sparse: true,
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

groupSchema.virtual('id').get(function () { return this._id.toHexString(); });

const Group = mongoose.model('Group', groupSchema);

export default Group;