import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Calendar, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const UserRatingsReviews = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [ratings, setRatings] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ratings');

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }
    fetchUserRatings();
  }, [userId, navigate]);

  const fetchUserRatings = async () => {
    try {
      setLoading(true);
      
      // Fetch ratings given by this specific learner
      const response = await fetch(`http://localhost:3000/api/v1/ratings/learner/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setUserInfo(data.learner || null);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch ratings:', errorData);
        toast.error(errorData.message || 'Failed to load ratings');
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
      toast.error('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ratings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Ratings by {userInfo?.fullname || 'User'}
                </h1>
                <p className="text-gray-600 mt-1">
                  View all ratings this learner has given to teachers
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600">{ratings.length}</div>
              <div className="text-sm text-gray-500">Total Ratings</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="px-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('ratings')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'ratings'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star size={16} />
                    Ratings ({ratings.length})
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Ratings Content */}
          <div className="p-6">
            {ratings.length === 0 ? (
              <div className="text-center py-12">
                <Star size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Ratings Yet</h3>
                <p className="text-gray-500">
                  {userInfo?.fullname || 'This user'} hasn't given any ratings yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {ratings.map((rating) => (
                  <div key={rating._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            {renderStars(rating.rating)}
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            {rating.rating}/5
                          </span>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>Teacher: <strong>{rating.teacherID?.fullname || 'Unknown'}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} />
                            <span>Skill: <strong>{rating.listingID?.title || 'Unknown'}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{formatDate(rating.createdAt)}</span>
                          </div>
                          {rating.listingID?.fee && (
                            <div className="flex items-center gap-2">
                              <span>Fee: <strong>${rating.listingID.fee}</strong></span>
                            </div>
                          )}
                        </div>

                        {rating.listingID?.description && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <strong>About the skill:</strong> {rating.listingID.description}
                            </p>
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

        {/* Summary Stats */}
        {ratings.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              {[1, 2, 3, 4, 5].map((stars) => {
                const count = ratings.filter(r => r.rating === stars).length;
                const percentage = ratings.length > 0 ? ((count / ratings.length) * 100).toFixed(0) : 0;
                return (
                  <div key={stars} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="font-medium">{stars}</span>
                      <Star size={16} className="text-yellow-400 fill-current" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{count}</div>
                    <div className="text-xs text-gray-500">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRatingsReviews;
