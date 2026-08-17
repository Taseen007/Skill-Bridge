import { User } from "../models/user.model.js";
import Rating from "../models/rating.js";
import SkillListing from "../models/skillListing.js";
import Session from "../models/session.js";
import Notification from "../models/notificationModel.js";
import { emitToUser } from "../utils/realtime.js";

// Recompute a listing's avgRating from its ratings, matching the "5 ratings
// minimum" rule used everywhere else the average is shown.
const recalculateAvgRating = async (listingID) => {
    const ratings = await Rating.find({ listingID });
    const avgRating = ratings.length >= 5
        ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1))
        : 0;
    await SkillListing.findByIdAndUpdate(listingID, { avgRating });
    return { totalRatings: ratings.length, avgRating };
};

export const createRating = async (req, res) => {
    try {
    const { learnerID, listingID, rating } = req.body;

        // Validate required fields
        if (!learnerID || !listingID || !rating) {
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

        // Only allow rating if learner has at least one completed session for this listing
        const completedSession = await Session.findOne({
            learnerID,
            skillListingID: listingID,
            status: "completed"
        });

        if (!completedSession) {
            return res.status(403).json({
                message: "You can only rate a skill after completing at least one session",
                success: false
            });
        }

        // Check if learner has already rated this listing
        const existingRating = await Rating.findOne({
            learnerID,
            listingID
        });

        if (existingRating) {
            return res.status(400).json({
                message: "You have already rated this listing",
                success: false
            });
        }

        // Create new rating
        const newRating = new Rating({
            learnerID,
            listingID,
            rating
        });

        await newRating.save();

        // Calculate and update the average rating for the listing
        const { totalRatings, avgRating: newAvgRating } = await recalculateAvgRating(listingID);

        // Populate the rating with related data
        const populatedRating = await Rating.findById(newRating._id)
            .populate('learnerID', 'fullname email')
            .populate('listingID', 'title');

        // Notify the teacher that they received a new rating
        try {
            const ratingNotif = new Notification({
                sender: learnerID,
                recipient: listing.teacherID,
                message: `${learner.fullname} gave your listing "${listing.title}" a ${rating}-star rating.`,
                type: "session_status",
            });
            await ratingNotif.save();
            await ratingNotif.populate("sender", "fullname profile.profilePhoto");
            emitToUser(listing.teacherID, "notification:new", ratingNotif);
        } catch (notifErr) {
            console.error("Rating notification error:", notifErr);
        }

        return res.status(201).json({
            message: "Rating created successfully",
            success: true,
            rating: populatedRating,
            listingStats: {
                totalRatings,
                avgRating: newAvgRating
            }
        });

    } catch (error) {
        console.error("Error creating rating:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Update Rating Function
export const updateRating = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating } = req.body;
        const userId = req.user.userId; // From middleware

        // Validate rating ID
        if (!id) {
            return res.status(400).json({
                message: "Rating ID is required",
                success: false
            });
        }

        // Validate rating value
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: "Rating must be between 1 and 5",
                success: false
            });
        }

        // Find the existing rating
        const existingRating = await Rating.findById(id);
        if (!existingRating) {
            return res.status(404).json({
                message: "Rating not found",
                success: false
            });
        }

        // Check if the current user owns this rating (only the learner who created it can update it)
        if (existingRating.learnerID.toString() !== userId) {
            return res.status(403).json({
                message: "You can only update your own ratings",
                success: false
            });
        }

        // Update the rating
        existingRating.rating = rating;
        await existingRating.save();

        // Keep the listing's avgRating in sync
        await recalculateAvgRating(existingRating.listingID);

        return res.status(200).json({
            message: "Rating updated successfully",
            success: true,
            rating: {
                _id: existingRating._id,
                rating: existingRating.rating
            }
        });

    } catch (error) {
        console.error("Error updating rating:", error);
        console.error("Error stack:", error.stack);
        console.error("Request params:", req.params);
        console.error("Request body:", req.body);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Delete Rating Function
export const deleteRating = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId; // From middleware

        // Validate rating ID
        if (!id) {
            return res.status(400).json({
                message: "Rating ID is required",
                success: false
            });
        }

        // Validate ID format (MongoDB ObjectId should be 24 characters)
        if (id.length !== 24) {
            return res.status(400).json({
                message: "Invalid rating ID format",
                success: false
            });
        }

        // First find the rating to check ownership
        const rating = await Rating.findById(id);
        if (!rating) {
            return res.status(404).json({
                message: "Rating not found",
                success: false
            });
        }

        // Check if the current user owns this rating (only the learner who created it can delete it)
        if (rating.learnerID.toString() !== userId) {
            return res.status(403).json({
                message: "You can only delete your own ratings",
                success: false
            });
        }

        // Delete the rating
        await Rating.findByIdAndDelete(id);

        // Keep the listing's avgRating in sync
        await recalculateAvgRating(rating.listingID);

        return res.status(200).json({
            message: "Rating deleted successfully",
            success: true,
            deletedRating: {
                _id: rating._id,
                learnerID: rating.learnerID,
                teacherID: rating.teacherID,
                listingID: rating.listingID,
                rating: rating.rating,
                deletedAt: new Date()
            }
        });

    } catch (error) {
        console.error("Error deleting rating:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get All Ratings for a Listing Function
export const getRatingsByListing = async (req, res) => {
    try {
        const { listingId } = req.params;

        // Validate listing ID
        if (!listingId) {
            return res.status(400).json({
                message: "Listing ID is required",
                success: false
            });
        }

        // Find all ratings for the listing
        const ratings = await Rating.find({ listingID: listingId })
            .populate('learnerID', 'fullname email')
            .populate('listingID', 'title')
            .sort({ createdAt: -1 }); // Sort by newest first

        // Calculate average rating only if there are at least 5 ratings
        let averageRating = null;
        if (ratings.length >= 5) {
            averageRating = parseFloat((ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length).toFixed(1));
        }

        return res.status(200).json({
            message: "Ratings retrieved successfully",
            success: true,
            ratings: ratings,
            totalRatings: ratings.length,
            averageRating: averageRating,
            minimumRequired: 5,
            note: ratings.length < 5 ? "At least 5 ratings are required to show average rating" : null
        });

    } catch (error) {
        console.error("Error getting ratings by listing:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
// Get average rating of a listing

export const getAverageRating = async (req, res) => {
    try {
        const { listingId } = req.params;

        // Validate listing ID
        if (!listingId) {
            return res.status(400).json({
                message: "Listing ID is required",
                success: false
            });
        }

        // Find all ratings for the listing
        const ratings = await Rating.find({ listingID: listingId });

        // Check if there are at least 5 ratings
        if (ratings.length < 5) {
            return res.status(200).json({
                message: "Average rating not available yet",
                success: true,
                averageRating: null,
                totalRatings: ratings.length,
                minimumRequired: 5,
                note: "At least 5 ratings are required to show average rating"
            });
        }

        // Calculate average rating
        const averageRating = ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length;

        return res.status(200).json({
            message: "Average rating retrieved successfully",
            success: true,
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalRatings: ratings.length
        });

    } catch (error) {
        console.error("Error getting average rating:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get user's own ratings
export const getMyRatings = async (req, res) => {
    try {
        const userId = req.user.userId; // From middleware

        // Get all ratings by this user
        const ratings = await Rating.find({ learnerID: userId })
            .populate('listingID', 'title description fee')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "User ratings retrieved successfully",
            success: true,
            ratings
        });

    } catch (error) {
        console.error("Error getting user ratings:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Get ratings by specific user ID (for viewing other user's ratings)
export const getRatingsByUserId = async (req, res) => {
    try {
        console.log("=== getRatingsByUserId Debug Info ===");
        console.log("Request URL:", req.originalUrl);
        console.log("Request params:", req.params);
        console.log("Request method:", req.method);
        
        const { userId } = req.params;
        console.log("Extracted userId:", userId);

        // Validate user ID format (MongoDB ObjectId should be 24 characters)
        if (!userId) {
            return res.status(400).json({
                message: "User ID is required",
                success: false
            });
        }

        if (userId.length !== 24) {
            return res.status(400).json({
                message: "Invalid user ID format",
                success: false
            });
        }

        // Check if user exists
        console.log("Looking for user with ID:", userId);
        const user = await User.findById(userId);
        if (!user) {
            console.log("User not found in database");
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        console.log("User found:", user.fullname);

        // Get all ratings by this specific user
        const ratings = await Rating.find({ learnerID: userId })
            .populate('listingID', 'title description fee')
            .sort({ createdAt: -1 });

        console.log("Found ratings count:", ratings.length);

        return res.status(200).json({
            message: "User ratings retrieved successfully",
            success: true,
            ratings,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error getting ratings by user ID:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get all ratings given by a specific learner (ratings BY learner ID)
export const getRatingsByLearnerId = async (req, res) => {
    try {
        console.log("=== getRatingsByLearnerId Debug Info ===");
        console.log("Request URL:", req.originalUrl);
        console.log("Request params:", req.params);
        
        const { learnerId } = req.params;
        console.log("Extracted learnerId:", learnerId);

        // Validate learner ID format (MongoDB ObjectId should be 24 characters)
        if (!learnerId) {
            return res.status(400).json({
                message: "Learner ID is required",
                success: false
            });
        }

        // if (learnerId.length !== 2) {
        //     return res.status(400).json({
        //         message: "Invalid learner ID format",
        //         success: false
        //     });
        // }

        const learner = await User.findOne({ _id: learnerId });

        // Check if learner exists
        console.log("Looking for learner with ID:", learnerId);
        if (!learner) {
            console.log("Learner not found in database");
            return res.status(404).json({
                message: "Learner not found",
                success: false
            });
        }

        console.log("Learner found:", learner.fullname);

        // Get all ratings given BY this specific learner
        const ratings = await Rating.find({ learnerID: learnerId })
            .populate('listingID', 'title description fee category')
            .sort({ createdAt: -1 });

        console.log("Found ratings given by learner:", ratings.length);

        return res.status(200).json({
            message: `Ratings given by ${learner.fullname} retrieved successfully`,
            success: true,
            ratings,
            learner: {
                id: learner._id,
                fullname: learner.fullname,
                email: learner.email
            },
            totalRatings: ratings.length
        });

    } catch (error) {
        console.error("Error getting ratings by learner ID:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get all ratings received by the current logged-in user (when they were a teacher)
export const getMyReceivedRatings = async (req, res) => {
    try {
        const userId = req.user.userId; // From middleware

        console.log("Getting ratings received by current user as teacher:", userId);

        // This function is now deprecated since teacherID is removed
        return res.status(410).json({
            message: "Ratings by teacher are no longer tracked.",
            success: false,
            ratings: [],
            totalRatings: 0
        });

    } catch (error) {
        console.error("Error getting user's received ratings:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};

// Get average ratings for a specific teacher
export const getAverageRatingsByTeacherId = async (req, res) => {
    try {
        console.log("=== getAverageRatingsByTeacherId Debug Info ===");
        console.log("Request URL:", req.originalUrl);
        console.log("Request params:", req.params);
        
        const { teacherId } = req.params;
        console.log("Extracted teacherId:", teacherId);

        // Validate teacher ID format (MongoDB ObjectId should be 24 characters)
        if (!teacherId) {
            return res.status(400).json({
                message: "Teacher ID is required",
                success: false
            });
        }

        if (teacherId.length !== 24) {
            return res.status(400).json({
                message: "Invalid teacher ID format",
                success: false
            });
        }

        // This function is now deprecated since teacherID is removed
        return res.status(410).json({
            message: "Average ratings by teacher are no longer tracked.",
            success: false,
            averageRating: null,
            totalRatings: 0,
            ratings: [],
            note: "Teacher-based ratings are deprecated. Use listing-based ratings."
        });

    } catch (error) {
        console.error("Error getting average ratings by teacher ID:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message
        });
    }
};
