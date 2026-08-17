import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    learnerID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // reference to the User model
        required: true
    },
    listingID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SkillListing', // reference to the SkillListing model
        required: true
    },
    reviewText: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 1000
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
