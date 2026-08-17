// models/skillListing.js
import mongoose from 'mongoose';

const skillListingSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },
    teacherID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to the User model
        required: true
    },
    skillID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill', // reference to the Skill model
        required: true
    },
    description: { 
        type: String, 
        required: true 
    },    
    fee:{
        type: Number, 
        required: true, 
        min: 0 // fee cannot be negative
    },
    totalSessions: {
        type: Number,
        required: true
    },
    proficiency:{
        type: String, 
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner' 
    },
    avgRating: { 
        type: Number, 
        default: 0 // average rating
    },
    listingImgURL:{
        type: String, // URL or path to the image
        default: '' // default to empty string if no image is provided
    },
    availableSlots: {
        type: [String], // Array of available slot strings (e.g., ISO date strings or time ranges)
        default: []
    }
});

const SkillListing = mongoose.model('SkillListing', skillListingSchema);

export default SkillListing;
