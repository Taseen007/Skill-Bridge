// models/skills.js

import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema(
{
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to the User model
        required: true,    
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        default: '',
    },
    tags: [{
        type: String,
    },],
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner',
    },
    experience: {
        type: Number,
        default: 0, // years of experience
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // optional: if an admin or teacher created it
    },
},
{ timestamps: true }
);

const Skill = mongoose.model('Skill', skillSchema);

export default Skill;
