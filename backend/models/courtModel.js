import mongoose from 'mongoose';

const courtSchema = new mongoose.Schema({
    // The name of the court (e.g., "Court 1", "Center Court").
    name: {
        type: String,
        required: true,
    },
    // Reference to the Group this court belongs to.
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

courtSchema.virtual('id').get(function () { return this._id.toHexString(); });

const Court = mongoose.model('Court', courtSchema);

export default Court;