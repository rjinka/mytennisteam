import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Unique identifier from Google Sign-In.
    googleId: {
        type: String,
        required: true,
        unique: true,
    },
    // User's email address, must be unique.
    email: {
        type: String,
        required: true,
        unique: true,
    },
    // User's full name.
    name: {
        type: String,
        required: true,
    },
    // URL to the user's profile picture.
    picture: {
        type: String,
    },
    // Timestamp of the last login.
    lastLoginAt: {
        type: Date,
    },
    // Flag to indicate if the user has super administrator privileges.
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
