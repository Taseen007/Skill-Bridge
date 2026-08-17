"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import { Star, ArrowLeft, CheckCircle, SkipForward, AlertCircle } from "lucide-react"
import { toast } from "sonner"

const RatingReviewPage = () => {
  const { skillListingID } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)

  // Get session data from location state
  const sessionData = location.state?.sessionData
  const [resolvedTeacherID, setResolvedTeacherID] = useState(
    location.state?.teacherID || sessionData?.teacherID?._id || sessionData?.teacherID || null
  )
  const learnerID = location.state?.learnerID || sessionData?.learnerID?._id || sessionData?.learnerID || user?._id

  const [currentStep, setCurrentStep] = useState(2) // Start at rating step
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedRating, setSubmittedRating] = useState(null)

  // Check authentication on mount — any logged-in user can rate
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to rate sessions")
      navigate("/signin")
      return
    }
    if (!skillListingID) {
      toast.error("Invalid skill listing")
      navigate("/skills")
    }
  }, [user, skillListingID, navigate])

  // If teacherID wasn't passed in state, fetch it from the listing
  useEffect(() => {
    if (!skillListingID || resolvedTeacherID) return
    fetch(`http://localhost:3000/api/v1/listings/single/${skillListingID}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      credentials: "include",
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.listing?.teacherID) {
          const tid = d.listing.teacherID._id || d.listing.teacherID
          setResolvedTeacherID(String(tid))
        }
      })
      .catch(() => {})
  }, [skillListingID, resolvedTeacherID])

  const checkCourseCompletion = async () => {}  // kept for compatibility

  // A learner can only rate a listing once — check on load so someone
  // revisiting this page sees their existing rating instead of a blank
  // star picker that would just get rejected on submit.
  useEffect(() => {
    if (!user || !skillListingID) return
    checkExistingRating()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, skillListingID])

  const checkExistingRating = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/ratings/listing/${skillListingID}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      
      const data = await response.json()
      
      if (data.success && data.ratings && data.ratings.length > 0) {
        // Check if current user already has a rating
        const userRating = data.ratings.find(rating => 
          rating.learnerID._id === user._id || rating.learnerID === user._id
        )
        
        if (userRating) {
          // User already has a rating, show it and move to review step
          setSubmittedRating(userRating)
          setRating(userRating.rating)
          toast.info("You have already rated this listing. You can optionally add a review.")
          checkExistingReview() // Check if they have a review too
          return
        }
      }
      
      // No existing rating, proceed to rating step
      setCurrentStep(2);
    } catch (error) {
      console.error("Error checking existing rating:", error)
      // Continue normally if there's an error
      setCurrentStep(2);
    }
  }

  const getRatingText = (rating) => {
    const texts = {
      1: "Poor - Not satisfied",
      2: "Fair - Below expectations",
      3: "Good - Met expectations",
      4: "Very Good - Above expectations",
      5: "Excellent - Outstanding experience",
    }
    return texts[rating] || ""
  }

  const checkExistingReview = async () => {
    try {
      // Try to fetch existing reviews for this listing
      const response = await fetch(`http://localhost:3000/api/v1/reviews/listing/${skillListingID}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      
      const data = await response.json()
      
      if (data.success && data.reviews) {
        // Check if current user already has a review
        const userReview = data.reviews.find(review => 
          review.learnerID._id === learnerID || review.learnerID === learnerID
        )
        
        if (userReview) {
          // User already has a review, show completion message with option to go back
          toast.success("Rating submitted! You have already reviewed this listing.")
          setCurrentStep(4) // Move to completion step
        } else {
          // No existing review, proceed to review step (optional)
          setCurrentStep(3)
        }
      } else {
        // Error fetching reviews, but proceed to review step anyway
        setCurrentStep(3)
      }
    } catch (error) {
      console.error("Error checking existing review:", error)
      // On error, proceed to review step
      setCurrentStep(3)
    }
  }

  const submitRating = async () => {
    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!learnerID) {
      toast.error("Missing required information")
      return
    }

    // If user already has a submitted rating, don't allow new submission
    if (submittedRating) {
      toast.info("You have already rated this listing. You can modify your review below.")
      setCurrentStep(3)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("http://localhost:3000/api/v1/ratings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          learnerID: learnerID,
          listingID: skillListingID,
          rating: rating,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSubmittedRating(data.rating)
        toast.success("Rating submitted successfully!")
        
        // Always proceed to review step after rating submission
        setCurrentStep(3)
      } else {
        // Handle specific error cases
        if (data.message && data.message.includes("already rated")) {
          toast.info("You have already rated this listing. Checking your existing rating...")
          // Refresh the existing rating
          checkExistingRating()
        } else {
          throw new Error(data.message || "Failed to submit rating")
        }
      }
    } catch (error) {
      console.error("Rating submission error:", error)
      if (error.message && error.message.includes("already rated")) {
        toast.info("You have already rated this listing. Checking your existing rating...")
        checkExistingRating()
      } else {
        toast.error(error.message || "Failed to submit rating")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitReview = async () => {
    if (reviewText.trim().length < 10) {
      toast.error("Review must be at least 10 characters long")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("http://localhost:3000/api/v1/reviews/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          learnerID: learnerID,
          teacherID: resolvedTeacherID,
          listingID: skillListingID,
          reviewText: reviewText.trim(),
          rating: submittedRating?.rating || rating, // Keep the rating for the review
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Review submitted successfully!")
        navigate("/sessions/learner")
      } else {
        throw new Error(data.message || "Failed to submit review")
      }
    } catch (error) {
      console.error("Review submission error:", error)
      toast.error(error.message || "Failed to submit review")
    } finally {
      setIsSubmitting(false)
    }
  }

  const skipReview = () => {
    // Move to completion step without submitting a review
    setCurrentStep(4);
  };

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/sessions/learner")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Sessions
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Rate & Review Your Course
            </h1>
            <p className="text-gray-600">
              Share your experience and help other learners
            </p>
          </div>
        </div>

        {/* Rating Step */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              {submittedRating ? (
                <>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Rating</h2>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={40}
                        className={`${
                          star <= submittedRating.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-lg text-gray-600 mb-6">{getRatingText(submittedRating.rating)}</p>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Continue to Review
                  </button>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Rate Your Experience</h2>

                  {/* Star Rating */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          size={40}
                          className={`${
                            star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Rating Text */}
                  {(hoveredRating || rating) > 0 && (
                    <p className="text-lg text-gray-600 mb-6">{getRatingText(hoveredRating || rating)}</p>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={submitRating}
                    disabled={rating === 0 || isSubmitting}
                    className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Rating"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Write a Review</h2>
              <p className="text-gray-600">
                Share your detailed experience with this course
              </p>
            </div>

            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience with this teacher and skill. What did you learn? How was the teaching style? Would you recommend this to others?"
              className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              maxLength={500}
            />

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-500">
                {reviewText.length}/500 characters
                {reviewText.length > 0 && reviewText.length < 10 && (
                  <span className="text-red-500 ml-2">(Minimum 10 characters)</span>
                )}
              </span>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={submitReview}
                disabled={reviewText.trim().length < 10 || isSubmitting}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>

              <button
                onClick={skipReview}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                <SkipForward size={18} />
                Skip Review
              </button>
            </div>
          </div>
        )}

        {/* Completion Step */}
        {currentStep === 4 && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Thank You!
            </h2>
            <p className="text-gray-600 mb-6">
              Your rating and review have been submitted successfully. 
              Your feedback helps other learners make informed decisions.
            </p>
            <button
              onClick={() => navigate("/sessions/learner")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Sessions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingReviewPage;
