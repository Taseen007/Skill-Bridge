import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Star, Edit3, Trash2, ArrowLeft, Calendar, User, BookOpen, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const RatingsReviews = () => {
  const [ratings, setRatings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRating, setEditingRating] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editRatingValue, setEditRatingValue] = useState(0);
  const [editReviewText, setEditReviewText] = useState('');
  const [activeTab, setActiveTab] = useState('ratings');
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (user.role !== 'learner') {
      toast.error('Only learners can view ratings and reviews');
      navigate('/profile');
      return;
    }
    fetchUserRatingsAndReviews();
  }, [user, navigate]);

  const fetchUserRatingsAndReviews = async () => {
    try {
      setLoading(true);
      
      // Fetch user's ratings
      const ratingsResponse = await fetch('http://localhost:3000/api/v1/ratings/user/my-ratings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      // Fetch user's reviews
      const reviewsResponse = await fetch('http://localhost:3000/api/v1/reviews/user/my-reviews', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (ratingsResponse.ok) {
        const ratingsData = await ratingsResponse.json();
        setRatings(ratingsData.ratings || []);
      } else {
        console.error('Failed to fetch ratings');
      }

      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.reviews || []);
      } else {
        console.error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching ratings and reviews:', error);
      toast.error('Failed to load your ratings and reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/ratings/delete/${ratingId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setRatings(ratings.filter(rating => rating._id !== ratingId));
        toast.success('Rating deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete rating');
      }
    } catch (error) {
      console.error('Error deleting rating:', error);
      toast.error('Failed to delete rating');
    }
  };

  const handleUpdateRating = async (ratingId) => {
    if (editRatingValue === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/v1/ratings/update/${ratingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ rating: editRatingValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setRatings(ratings.map(rating => 
          rating._id === ratingId ? { ...rating, rating: editRatingValue } : rating
        ));
        setEditingRating(null);
        setEditRatingValue(0);
        toast.success('Rating updated successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update rating');
      }
    } catch (error) {
      console.error('Error updating rating:', error);
      toast.error('Failed to update rating');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`http://localhost:3000/api/v1/reviews/delete/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setReviews(reviews.filter(review => review._id !== reviewId));
        toast.success('Review deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete review');
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const handleUpdateReview = async (reviewId) => {
    if (editReviewText.trim().length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/v1/reviews/update/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reviewText: editReviewText }),
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(reviews.map(review => 
          review._id === reviewId ? { ...review, reviewText: editReviewText } : review
        ));
        setEditingReview(null);
        setEditReviewText('');
        toast.success('Review updated successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update review');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error('Failed to update review');
    }
  };

  const startEditRating = (rating) => {
    setEditingRating(rating._id);
    setEditRatingValue(rating.rating);
  };

  const startEditReview = (review) => {
    setEditingReview(review._id);
    setEditReviewText(review.reviewText);
  };

  const cancelEdit = () => {
    setEditingRating(null);
    setEditingReview(null);
    setEditRatingValue(0);
    setEditReviewText('');
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onStarClick && onStarClick(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              size={20}
              className={`${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your ratings and reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Profile
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Ratings & Reviews</h1>
          <p className="text-gray-600">Manage all the ratings and reviews you've given</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('ratings')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'ratings'
                    ? 'border-yellow-500 text-yellow-600 bg-yellow-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Star size={20} />
                  <span>Ratings ({ratings.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-4 px-6 text-center font-medium border-b-2 transition-colors ${
                  activeTab === 'reviews'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <BookOpen size={20} />
                  <span>Reviews ({reviews.length})</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'ratings' ? (
          <div className="space-y-4">
            {ratings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <Star size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Ratings Yet</h3>
                <p className="text-gray-500">You haven't rated any sessions yet. Complete some sessions and rate your experience!</p>
              </div>
            ) : (
              ratings.map((rating) => (
                <div key={rating._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {rating.listingID?.title || 'Unknown Course'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500" />
                          <span className="text-gray-600">
                            {rating.teacherID?.fullname || 'Unknown Teacher'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        {editingRating === rating._id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rating:</span>
                            {renderStars(editRatingValue, true, setEditRatingValue)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rating:</span>
                            {renderStars(rating.rating)}
                            <span className="text-gray-600">({rating.rating}/5)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>Rated on {new Date(rating.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingRating === rating._id ? (
                        <>
                          <button
                            onClick={() => handleUpdateRating(rating._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditRating(rating)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            <Edit3 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRating(rating._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Reviews Yet</h3>
                <p className="text-gray-500">You haven't written any reviews yet. Share your learning experience with others!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {review.listingID?.title || 'Unknown Course'}
                        </h3>
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-gray-500" />
                          <span className="text-gray-600">
                            {review.teacherID?.fullname || 'Unknown Teacher'}
                          </span>
                        </div>
                      </div>

                      {editingReview === review._id ? (
                        <div className="mb-3">
                          <textarea
                            value={editReviewText}
                            onChange={(e) => setEditReviewText(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="Write your review..."
                          />
                          <div className="flex justify-between mt-2">
                            <span className="text-sm text-gray-500">
                              {editReviewText.length}/1000 characters
                            </span>
                            {editReviewText.length > 0 && editReviewText.length < 10 && (
                              <span className="text-sm text-red-500">Minimum 10 characters required</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>Reviewed on {new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {editingReview === review._id ? (
                        <>
                          <button
                            onClick={() => handleUpdateReview(review._id)}
                            disabled={editReviewText.trim().length < 10}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            <Save size={16} />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                          >
                            <X size={16} />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditReview(review)}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          >
                            <Edit3 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review._id)}
                            className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingsReviews;
