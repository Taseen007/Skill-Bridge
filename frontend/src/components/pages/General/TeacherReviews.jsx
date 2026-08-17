import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Star, Calendar, User, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../../config/api';

const TeacherReviews = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  useEffect(() => {
    if (user && user.role === 'teacher') {
      fetchMyReceivedReviews();
    }
  }, [user]);

  const fetchMyReceivedReviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token') || user?.token;
      const response = await fetch(buildApiUrl('/reviews/user/my-received-reviews'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        calculateStats(data.reviews);
      } else {
        setError(data.message || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching received reviews:', err);
      setError('Failed to load reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) {
      setStats({
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
      return;
    }

    const totalRatings = reviewsData.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRatings / reviewsData.length;
    
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      distribution[review.rating]++;
    });

    setStats({
      totalReviews: reviewsData.length,
      averageRating: averageRating,
      ratingDistribution: distribution
    });
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getPercentage = (count, total) => {
    return total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  };

  if (!user || user.role !== 'teacher') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only teachers can view received reviews.</p>
          <button
            onClick={() => navigate('/profile')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMyReceivedReviews}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
          >
            Retry
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </button>
        <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
        <p className="text-gray-600 mt-2">Reviews you've received from students</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReviews > 0 ? stats.averageRating.toFixed(1) : '0.0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${getPercentage(stats.ratingDistribution[rating], stats.totalReviews)}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12">
                  {stats.ratingDistribution[rating]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Reviews</h2>
        </div>
        
        {reviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
            <p className="text-gray-600">
              You haven't received any reviews yet. Keep teaching to start getting feedback from your students!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review._id} className="p-6">
                <div className="flex gap-4">
                  {/* Anonymous Student Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Anonymous Student
                        </h4>
                        <p className="text-sm text-gray-600">
                          For: {review.listingID?.title || 'Unknown Listing'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {review.rating}/5
                      </span>
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-700 leading-relaxed">
                      {review.reviewText}
                    </p>

                    {/* Listing Details */}
                    {review.listingID && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Listing:</span> {review.listingID.title}
                        </p>
                        {review.listingID.fee && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Fee:</span> ${review.listingID.fee}/session
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherReviews;
