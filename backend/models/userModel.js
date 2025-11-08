import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    picture: {
        type: String,
    },
    lastLoginAt: {
        type: Date,
    },
    isSuperAdmin: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    // Enable virtuals to be included in toJSON and toObject outputs
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

userSchema.virtual('id').get(function() { return this._id.toHexString(); });

const User = mongoose.model('User', userSchema);

export default User;
