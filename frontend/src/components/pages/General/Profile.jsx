import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../../../redux/authSlice';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, Edit3, Star, MessageSquare, Plus } from 'lucide-react';
import { buildApiUrl, API_ENDPOINTS } from '../../../config/api';
import { canTeach } from '../../../utils/roles';
import { toast } from 'sonner';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phoneNumber: '',
    bio: '',
    location: '',
    skills: '',
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [averageRating, setAverageRating] = useState(null);
  const [loadingRating, setLoadingRating] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber ? user.phoneNumber.toString() : '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        skills: user.profile?.skills ? user.profile.skills.join(', ') : '',
      });
      
      // Fetch detailed skills for teachers and dual-role users
      if (canTeach(user.role)) {
        fetchUserSkills();
      }
      
      // Fetch average rating for teaching roles
      if (canTeach(user.role)) {
        fetchAverageRating();
      }
    }
  }, [user]);
  
  // Fetch detailed skills from the skills collection
  const fetchUserSkills = async () => {
    if (!user) return;
    
    setLoadingSkills(true);
    try {
      const response = await fetch(buildApiUrl(`/skills/user/${user._id}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setUserSkills(data.skills);
      }
    } catch (error) {
      console.error('Error fetching user skills:', error);
    } finally {
      setLoadingSkills(false);
    }
  };

  const fetchAverageRating = async () => {
    if (!user || !canTeach(user.role)) return;
    setLoadingRating(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch all listings by this teacher then average their avgRating
      const response = await fetch(buildApiUrl(`/listings/teacher/${user._id}`), {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.listings?.length > 0) {
          const rated = data.listings.filter(l => l.avgRating > 0);
          if (rated.length > 0) {
            const avg = rated.reduce((sum, l) => sum + l.avgRating, 0) / rated.length;
            const totalRatings = rated.length;
            setAverageRating({ averageRating: parseFloat(avg.toFixed(1)), totalRatings });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching average rating:', error);
    } finally {
      setLoadingRating(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
      setProfilePhoto(file);
    } else {
      toast.error('Invalid image file (max 5MB)');
    }
  };

  const handleSave = async () => {
    if (!formData.fullname.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      toast.error('Please fill out all required fields');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('fullname', formData.fullname);
      data.append('email', formData.email);
      data.append('phoneNumber', formData.phoneNumber);
      data.append('bio', formData.bio);
      data.append('location', formData.location);
      
      // Process skills from comma-separated string to array
      if (formData.skills) {
        const skillsArray = formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        data.append('skills', JSON.stringify(skillsArray));
      }
      
      if (profilePhoto) data.append('profilePhoto', profilePhoto);

      const token = localStorage.getItem("token");
      const res = await fetch(buildApiUrl(API_ENDPOINTS.USER.UPDATE), {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server did not return JSON response');
      }

      const result = await res.json();

      if (result.success) {
        dispatch(setUser(result.user));
        localStorage.setItem('user', JSON.stringify(result.user));
        toast.success('Profile updated successfully');
        setIsEditing(false);
        setProfilePhoto(null);
      } else {
        toast.error(result.message || 'Update failed');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.message.includes('404')) {
        toast.error('API endpoint not found. Please check your server setup.');
      } else if (err.message.includes('Failed to fetch')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Something went wrong! Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullname: user?.fullname || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber ? user.phoneNumber.toString() : '',
      bio: user?.profile?.bio || '',
      location: user?.profile?.location || '',
      skills: user?.profile?.skills ? user.profile.skills.join(', ') : '',
    });
    setProfilePhoto(null);
    setIsEditing(false);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'N/A';
      return parsedDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  if (!user) {
    return <div className="text-center mt-10 text-gray-500">Please log in to view your profile.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">My Profile</h2>
          <div className="flex items-center gap-3">
            {/* Ratings & Reviews Button for Learners */}
            {user.role === "learner" && (
              <button
                onClick={() => navigate('/profile/ratings-reviews')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                <Star size={16} />
                <MessageSquare size={16} />
                Ratings & Reviews
              </button>
            )}
            
            {/* Reviews Button for Teachers */}
            {canTeach(user.role) && (
              <button
                onClick={() => navigate('/profile/reviews')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <MessageSquare size={16} />
                My Reviews
              </button>
            )}
            

            
            {/* Edit Profile Button */}
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:underline flex items-center">
                <Edit3 size={16} className="mr-1" /> Edit
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                >
                  <Save size={16} className="inline mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3 text-center">
            <div className="w-32 h-32 rounded-full mx-auto overflow-hidden bg-gray-200 relative">
              {profilePhoto ? (
                <img src={URL.createObjectURL(profilePhoto)} alt="Preview" className="w-full h-full object-cover" />
              ) : user.profile?.profilePhoto ? (
                <img src={user.profile.profilePhoto} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="mx-auto text-gray-400 mt-8" />
              )}
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded mt-1"
                />
              ) : (
                <p className="mt-1 font-medium">{formData.fullname}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded mt-1"
                />
              ) : (
                <p className="mt-1 font-medium">{formData.email}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Phone Number</label>
              {isEditing ? (
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded mt-1"
                />
              ) : (
                <p className="mt-1 font-medium">{formData.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Account Type</label>
              <p className="mt-1 font-medium capitalize">{user.role}</p>
            </div>

            <div>
              <label className="text-sm text-gray-600">Location</label>
              {isEditing ? (
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full border px-3 py-2 rounded mt-1" placeholder="City or area" />
              ) : (
                <p className="mt-1 font-medium">{formData.location || 'Not provided'}</p>
              )}
            </div>

            {/* Average Rating Display for Teachers */}
            {canTeach(user.role) && (
              <div>
                <label className="text-sm text-gray-600">Average Rating</label>
                {loadingRating ? (
                  <p className="mt-1 text-gray-500">Loading...</p>
                ) : averageRating ? (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-lg">
                        {averageRating.averageRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-600">
                      ({averageRating.totalRatings} {averageRating.totalRatings === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-gray-500">No ratings yet</p>
                )}
              </div>
            )}

            <div className="col-span-2 mt-4">
              <label className="text-sm text-gray-600">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded mt-1"
                ></textarea>
              ) : (
                <p className="mt-1 font-medium text-gray-700">{formData.bio || 'No bio yet.'}</p>
              )}
            </div>

            <div className="col-span-2 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-2" size={16} />
                  <span>Member since: {formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills section: detailed records for teachers; basic tags for learners */}
      {user && (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-800">
                {canTeach(user.role) ? 'Skills & Expertise' : 'Skills'}
              </h3>
              {canTeach(user.role) && userSkills.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                  {userSkills.length} {userSkills.length === 1 ? 'Skill' : 'Skills'}
                </span>
              )}
            </div>
            {canTeach(user.role) && (
              <button
                onClick={() => navigate('/skills/add')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                <Plus size={18} />
                Add New Skill
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
              <label className="block text-lg font-semibold text-gray-700 mb-3">Update Skills</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                className="w-full border-2 border-gray-300 px-4 py-3 rounded-lg mt-1 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition-all duration-200"
                placeholder="React, Node.js, MongoDB (comma-separated)"
              />
              <p className="text-sm text-gray-600 mt-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                Enter skills separated by commas for quick updates
              </p>
            </div>
          ) : canTeach(user.role) ? (
            <div>
              {loadingSkills ? (
                <div className="flex justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Loading your skills...</p>
                  </div>
                </div>
              ) : userSkills.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {userSkills.map((skill) => (
                    <div key={skill._id} className="group bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-indigo-700 text-xl group-hover:text-indigo-800 transition-colors">
                          {skill.name}
                        </h4>
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                          {skill.level}
                        </span>
                      </div>
                      
                      {skill.category && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium border border-blue-200">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            {skill.category}
                          </span>
                        </div>
                      )}
                      
                      {skill.description && (
                        <p className="text-gray-700 leading-relaxed mb-4 text-sm bg-gray-50 p-3 rounded-lg border-l-4 border-indigo-300">
                          {skill.description}
                        </p>
                      )}
                      
                      {skill.experience > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar size={14} className="text-green-600" />
                            <span className="font-semibold text-green-700">
                              {skill.experience} {skill.experience === 1 ? 'Year' : 'Years'} Experience
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {skill.tags && skill.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-auto">
                          {skill.tags.map((tag, i) => (
                            <span key={i} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium transition-colors border border-gray-200">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : user.profile?.skills?.length > 0 ? (
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50 p-8 rounded-xl border-2 border-dashed border-indigo-200">
                  <h4 className="text-lg font-semibold text-gray-700 mb-6 text-center">Basic Skills Overview</h4>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {user.profile.skills.map((skill, i) => (
                      <span key={i} className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                  <div className="text-center mt-8">
                    <p className="text-gray-600 mb-4">Want to showcase your skills better?</p>
                    <button
                      onClick={() => navigate('/skills/add')}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md"
                    >
                      Create Detailed Skill Profiles
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Plus size={32} className="text-indigo-500" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-700 mb-3">No Skills Added Yet</h4>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      Start building your profile by adding your skills and expertise. This helps others understand what you can offer.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => navigate('/skills/add')}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Add Your First Skill
                      </button>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-white text-indigo-600 border-2 border-indigo-200 px-6 py-3 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
                      >
                        Quick Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {user.profile?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {user.profile.skills.map((skill, i) => (
                    <span key={i} className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No skills added yet. Use Edit Profile to add skills you are learning.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
