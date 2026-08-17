import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Create a new review
router.post('/create', isAuthenticated, reviewController.createReview);

// Update an existing review
router.put('/update/:id', isAuthenticated, reviewController.updateReview);

// Delete a review
router.delete('/delete/:id', isAuthenticated, reviewController.deleteReview);

// Get user's own reviews (must come before /:id route)
router.get('/user/my-reviews', isAuthenticated, reviewController.getMyReviews);

// Get reviews received by current user (when they were a teacher)
router.get('/user/my-received-reviews', isAuthenticated, reviewController.getMyReceivedReviews);

// Get all reviews by user id
router.get('/user/:userId', isAuthenticated, reviewController.getReviewsByUserId);

// Get all reviews for a listing
router.get('/listing/:listingId', isAuthenticated, reviewController.getReviewsByListing);

// Get average rating from reviews for a listing
router.get('/average/:listingId', isAuthenticated, reviewController.getAverageRatingFromReviews);

// Get a specific review by ID (must come after specific routes)
router.get('/:id', isAuthenticated, reviewController.getReviewById);

export default router;
