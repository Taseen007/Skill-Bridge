import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        enum: ['teacher', 'learner', 'both'],
        default: 'learner',
        required: true
    },
    authProvider: { type: String, enum: ["local", "google", "github"], default: "local" },
    providerId: { type: String },
    profile: {
        type: {
            bio: { type: String, default: "" },
            skills: { type: [String], default: [] },
            location: { type: String, default: "" },
            profilePhoto: { type: String, default: "" }
        },
        default: {}
    },
    savedListings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillListing',
        default: []
    }]

}, { timestamps: true });
export const User = mongoose.model('User', userSchema);
