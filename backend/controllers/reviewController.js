import { User } from "../models/user.model.js";
import Review from "../models/review.js";
import SkillListing from "../models/skillListing.js";
import Session from "../models/session.js";
import Notification from "../models/notificationModel.js";
import { emitToUser } from "../utils/realtime.js";

// Create Review Function
export const createReview = async (req, res) => {
    try {
    const { learnerID, listingID, reviewText, rating } = req.body;

        // Validate required fields
        if (!learnerID || !listingID || !reviewText || !rating) {
            return res.status(400).json({
                message: "All fields are required",
                success: false
            });
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
                success: false
            });
        }

        // Validate review text length
        if (reviewText.length < 10 || reviewText.length > 1000) {
            return res.status(400).json({
                message: "Review text must be between 10 and 1000 characters",
                success: false
            });
        }

        // Check if learner exists
        const learner = await User.findById(learnerID);
        if (!learner) {
            return res.status(404).json({
                message: "Learner not found",
                success: false
            });
        }

    // Removed teacher check

        // Check if listing exists
        const listing = await SkillListing.findById(listingID);
        if (!listing) {
            return res.status(404).json({
                message: "Skill listing not found",
                success: false
            });
        }

        // Only allow review if learner has at least one completed session for this listing
        const completedSession = await Session.findOne({
            learnerID,
            skillListingID: listingID,
            status: "completed"
        });

        if (!completedSession) {
            return res.status(403).json({
                message: "You can only review a skill after completing at least one session",
                success: false
            });
        }

        // Check if learner has already reviewed this listing
        const existingReview = await Review.findOne({
            learnerID,
            listingID
        });

        if (existingReview) {
            return res.status(400).json({
                message: "You have already written a review for this listing. You can update your existing review instead.",
                success: false,
                existingReviewId: existingReview._id
            });
        }

        // Create new review
        const newReview = new Review({
            learnerID,
            listingID,
            reviewText,
            rating
        });

        await newReview.save();

        // Populate the review with related data
        const populatedReview = await Review.findById(newReview._id)
            .populate('learnerID', 'fullname email')
            .populate('listingID', 'title');

        return res.status(201).json({
            message: "Review created successfully",
            success: true,
            review: populatedReview
        });

    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Update Review Function
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewText, rating } = req.body;
        const userId = req.user.userId; // From middleware

        // Validate review ID
        if (!id) {
            return res.status(400).json({
                message: "Review ID is required",
                success: false
            });
        }

        // Validate required fields
        if (!reviewText && !rating) {
            return res.status(400).json({
                message: "At least one field (reviewText or rating) is required for update",
                success: false
            });
        }

        // Validate rating value if provided
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
                success: false
            });
        }

        // Validate review text length if provided
        if (reviewText && (reviewText.length < 10 || reviewText.length > 1000)) {
            return res.status(400).json({
                message: "Review text must be between 10 and 1000 characters",
                success: false
            });
        }

        // Find the existing review
        const existingReview = await Review.findById(id);
        if (!existingReview) {
            return res.status(404).json({
                message: "Review not found",
                success: false
            });
        }

        // Check if the current user owns this review (only the learner who created it can update it)
        if (existingReview.learnerID.toString() !== userId) {
            return res.status(403).json({
                message: "You can only update your own reviews",
                success: false
            });
        }

        // Update the review fields
        if (reviewText) existingReview.reviewText = reviewText;
        if (rating) existingReview.rating = rating;

        await existingReview.save();

        // Populate the updated review with related data
        const populatedReview = await Review.findById(existingReview._id)
            .populate('learnerID', 'fullname email')
            .populate('listingID', 'title');

        return res.status(200).json({
            message: "Review updated successfully",
            success: true,
            review: populatedReview
        });

    } catch (error) {
        console.error("Error updating review:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Delete Review Function
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // From middleware

        // Validate review ID
        if (!id) {
            return res.status(400).json({
                message: "Review ID is required",
                success: false
            });
        }

        // Validate ID format (MongoDB ObjectId should be 24 characters)
        if (id.length !== 24) {
            return res.status(400).json({
                message: "Invalid review ID format",
                success: false
            });
        }

        // First find the review to check ownership
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({
                message: "Review not found",
                success: false
            });
        }

        // Check if the current user owns this review (only the learner who created it can delete it)
        if (review.learnerID.toString() !== userId) {
            return res.status(403).json({
                message: "You can only delete your own reviews",
                success: false
            });
        }

        // Delete the review
        await Review.findByIdAndDelete(id);

        return res.status(200).json({
            message: "Review deleted successfully",
            success: true,
            deletedReview: {
                _id: review._id,
                learnerID: review.learnerID,
                listingID: review.listingID,
                reviewText: review.reviewText,
                rating: review.rating,
                deletedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Error deleting review:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get Review by ID Function
export const getReviewById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate review ID
        if (!id) {
            return res.status(400).json({
                message: "Review ID is required",
                success: false
            });
        }

        // Find the review and populate related data
        const review = await Review.findById(id)
            .populate('learnerID', 'fullname email')
            .populate('listingID', 'title');

        if (!review) {
            return res.status(404).json({
                message: "Review not found",
                success: false
            });
        }

        return res.status(200).json({
            message: "Review retrieved successfully",
            success: true,
            review: review
        });

    } catch (error) {
        console.error("Error getting review:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get All Reviews for a Listing Function
export const getReviewsByListing = async (req, res) => {
    try {
        const { listingId } = req.params;

        // Validate listing ID
        if (!listingId) {
            return res.status(400).json({
                message: "Listing ID is required",
                success: false
            });
        }

        // Find all reviews for the listing
        const reviews = await Review.find({ listingID: listingId })
            .populate('learnerID', 'fullname email profile')
            .populate('listingID', 'title')
            .sort({ createdAt: -1 }); // Sort by newest first

        // Calculate average rating only if there are at least 5 reviews
        let averageRating = null;
        if (reviews.length >= 5) {
            averageRating = parseFloat((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1));
        }

        return res.status(200).json({
            message: "Reviews retrieved successfully",
            success: true,
            reviews: reviews,
            totalReviews: reviews.length,
            averageRating: averageRating,
            minimumRequired: 5,
            note: reviews.length < 5 ? "At least 5 reviews are required to show average rating" : null
        });

    } catch (error) {
        console.error("Error getting reviews by listing:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get Average Rating from Reviews for a Listing
export const getAverageRatingFromReviews = async (req, res) => {
    try {
        const { listingId } = req.params;

        // Validate listing ID
        if (!listingId) {
            return res.status(400).json({
                message: "Listing ID is required",
                success: false
            });
        }

        // Find all reviews for the listing
        const reviews = await Review.find({ listingID: listingId });

        // Check if there are at least 5 reviews
        if (reviews.length < 5) {
            return res.status(200).json({
                message: "Average rating not available yet",
                success: true,
                averageRating: null,
                totalReviews: reviews.length,
                minimumRequired: 5,
                note: "At least 5 reviews are required to show average rating"
            });
        }

        // Calculate average rating
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

        return res.status(200).json({
            message: "Average rating retrieved successfully",
            success: true,
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: reviews.length
        });

    } catch (error) {
        console.error("Error getting average rating from reviews:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get user's own reviews
export const getMyReviews = async (req, res) => {
    try {
        const userId = req.user.userId; // From middleware

        // Get all reviews by this user
        const reviews = await Review.find({ learnerID: userId })
            .populate('listingID', 'title description fee')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "User reviews retrieved successfully",
            success: true,
            reviews
        });

    } catch (error) {
        console.error("Error getting user reviews:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get reviews received by current user (when they were a teacher)
export const getMyReceivedReviews = async (req, res) => {
    try {
        const userId = req.user.userId; // From middleware

        console.log("=== getMyReceivedReviews Debug Info ===");
        console.log("User ID:", userId);

        // This function is now deprecated since teacherID is removed
        return res.status(410).json({
            message: "Reviews by teacher are no longer tracked.",
            success: false,
            reviews: [],
            count: 0
        });

    } catch (error) {
        console.error("Error getting teacher received reviews:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get reviews by specific user ID (for viewing other user's reviews)
export const getReviewsByUserId = async (req, res) => {
    try {
        console.log("=== getReviewsByUserId Debug Info ===");
        console.log("Request URL:", req.originalUrl);
        console.log("Request params:", req.params);
        
        const { userId } = req.params;
        console.log("Extracted userId:", userId);

        // Validate user ID
        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                success: false
            });
        }

        // Validate user ID format (MongoDB ObjectId should be 24 characters)
        if (userId.length !== 24) {
            return res.status(400).json({
                message: "Invalid user ID format",
                success: false
            });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found in database");
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        console.log("User found:", user.fullname);

        // Get all reviews by this specific user
        const reviews = await Review.find({ learnerID: userId })
            .populate('listingID', 'title description fee')
            .sort({ createdAt: -1 });

        console.log("Found reviews count:", reviews.length);

        return res.status(200).json({
            message: "User reviews retrieved successfully",
            success: true,
            reviews,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error getting reviews by user ID:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};
