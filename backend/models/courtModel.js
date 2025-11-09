import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Group',
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

courtSchema.virtual('id').get(function() { return this._id.toHexString(); });

const Court = mongoose.model('Court', courtSchema);

export default Court;
