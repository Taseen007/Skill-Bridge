import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    learnerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to the User model
        required: true
    },
    listingID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillListing', // reference to the SkillListing model
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    }
}, { timestamps: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
