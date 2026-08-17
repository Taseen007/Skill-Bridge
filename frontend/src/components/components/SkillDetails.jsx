"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Star,
  BookOpen,
  MessageCircle,
  Calendar,
  Award,
  Edit,
  Heart,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import axios from "axios";
import ChatBox from "../pages/Chat/ChatBox";
import { toast } from "sonner";

const SkillDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
  });
  const [sessionStatus, setSessionStatus] = useState(null);
  const [checkingSessionStatus, setCheckingSessionStatus] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // Fetch review stats for a listing
  const fetchReviewStats = async (listingId) => {
    try {
      const token = getCookie("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const apiUrl = buildApiUrl(API_ENDPOINTS.REVIEW.STATS(listingId));
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviewStats({
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
      // Set default values if fetch fails
      setReviewStats({
        averageRating: 0,
        totalReviews: 0,
      });
    }
  };

  // Fetch reviews for a listing
  const fetchReviews = async (listingId) => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      
      const token = getCookie("token");
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:3000/api/v1/reviews/listing/${listingId}`, {
        method: "GET",
        headers: headers,
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReviews(data.reviews || []);
          // Update review stats with more accurate data from reviews endpoint
          setReviewStats({
            averageRating: data.averageRating || 0,
            totalReviews: data.totalReviews || 0,
          });
        } else {
          setReviewsError(data.message || "Failed to fetch reviews");
        }
      } else {
        setReviewsError("Failed to load reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviewsError("Error loading reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  // Check session status
  const checkSessionStatus = async (sessionId) => {
    if (!user || !sessionId) {
      setSessionStatus(null);
      return;
    }
    try {
      setCheckingSessionStatus(true);
      const token = getCookie("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const apiUrl = buildApiUrl(`/sessions/${sessionId}/status`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data.status || null);
      } else {
        setSessionStatus(null);
      }
    } catch {
      setSessionStatus(null);
    } finally {
      setCheckingSessionStatus(false);
    }
  };

  // Check session status for skillListingID
  const checkSkillListingStatus = async (skillListingID) => {
    if (!user || !skillListingID) {
      setSessionStatus(null);
      return;
    }
    try {
      setCheckingSessionStatus(true);
      const token = getCookie("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const apiUrl = buildApiUrl(`/sessions/${skillListingID}/status`);
      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSessionStatus(data.status || null);
      } else {
        setSessionStatus(null);
      }
    } catch (err) {
      console.error('Error fetching session status:', err);
      setSessionStatus(null);
    } finally {
      setCheckingSessionStatus(false);
    }
  };

  // Fetch skill details from API
  useEffect(() => {
    const fetchSkillDetails = async () => {
      try {
        setLoading(true);
        // ...existing code...
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(";").shift();
          return null;
        };
        const token = getCookie("token");
        const headers = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const apiUrl = buildApiUrl(API_ENDPOINTS.LISTINGS.BY_ID(id));
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: headers,
          credentials: "include",
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            throw new Error(
              "Authentication required. Please sign in to view skill details."
            );
          } else if (response.status === 404) {
            throw new Error(
              "Skill not found. This skill may have been removed or the ID is incorrect."
            );
          } else if (response.status === 403) {
            throw new Error(
              "Access denied. You may not have permission to view this skill."
            );
          } else {
            const errorMessage =
              errorData.message ||
              `Failed to fetch skill details (${response.status})`;
            throw new Error(errorMessage);
          }
        }
        const data = await response.json();
        if (data.success) {
          setSkill(data.listing);
          fetchReviewStats(data.listing._id);
          // Do NOT call checkSessionStatus here
        } else {
          throw new Error(data.message || "Failed to fetch skill details");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSkillDetails();
    } else {
      setLoading(false);
      setError("No skill ID provided");
    }
  }, [id]);

  // Check session status when skill or user changes
  // Removed conflicting useEffect that overwrites sessionStatus

  // Check session status for skillListingID when id or user changes
  useEffect(() => {
    if (id && user) {
      checkSkillListingStatus(id);
    } else {
      setSessionStatus(null);
    }
  }, [id, user]);

  // Fetch reviews when reviews tab is selected
  useEffect(() => {
    if (selectedTab === "reviews" && skill && skill._id) {
      fetchReviews(skill._id);
    }
  }, [selectedTab, skill]);

  // Save / wishlist toggle
  const toggleSave = async () => {
    if (!user) {
      toast.info("Sign in to save listings");
      return;
    }
    setSaving(true);
    try {
      const token = getCookie("token") || localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(buildApiUrl(API_ENDPOINTS.LISTINGS.SAVE(id)), {
        method: "POST",
        headers,
        credentials: "include",
      });
      const data = await res.json();
      if (data?.success) {
        setIsSaved(data.isSaved);
        toast.success(data.isSaved ? "Saved to your listings" : "Removed from saved");
      } else {
        toast.error(data?.message || "Failed to update saved status");
      }
    } catch (err) {
      console.error("toggleSave error:", err);
      toast.error("Failed to update saved status");
    } finally {
      setSaving(false);
    }
  };

  // Initial saved status check
  useEffect(() => {
    if (!user || !id) return;
    const initial =
      (user.savedListings && user.savedListings.some((lid) => String(lid) === String(id))) ||
      false;
    setIsSaved(initial);
    const checkSaved = async () => {
      try {
        const token = getCookie("token") || localStorage.getItem("token");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(buildApiUrl(API_ENDPOINTS.LISTINGS.CHECK_SAVED(id)), {
          method: "GET",
          headers,
          credentials: "include",
        });
        const data = await res.json();
        if (data?.success) setIsSaved(Boolean(data.isSaved));
      } catch (_) {}
    };
    checkSaved();
  }, [user, id]);

  const handleMessageClick = async (receiver) => {
    try {
      const token = getCookie("token");
      const res = await axios.post(
        "http://localhost:3000/api/v1/chat/chat",
        { userId: receiver._id },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      const chatId = res.data._id;
      setSelectedInstructor({ ...receiver, chatId });
      setChatVisible(true);
    } catch (err) {
      console.error("Error opening chat", err);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading skill details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            Error Loading Skill
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            {error.includes("Authentication required") && (
              <a
                href="/signin"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Sign In
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Skill not found
  if (!skill) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            Skill Not Found
          </h3>
          <p className="text-gray-600">
            The skill you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const getProficiencyColor = (proficiency) => {
    switch (proficiency.toLowerCase()) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const convertTo12Hour = (time24) => {
    // Handle different time formats
    const timeStr = time24.toString().trim();

    // If already in 12-hour format, return as is
    if (
      timeStr.toLowerCase().includes("am") ||
      timeStr.toLowerCase().includes("pm")
    ) {
      return timeStr;
    }

    // Parse 24-hour format (e.g., "09:30", "9:30", "0930", "10:00", "14:00")
    let hours,
      minutes = "00";

    if (timeStr.includes(":")) {
      const parts = timeStr.split(":");
      hours = parts[0];
      minutes = parts[1] || "00";
    } else if (timeStr.length === 4) {
      // Handle format like "0930"
      hours = timeStr.substring(0, 2);
      minutes = timeStr.substring(2, 4);
    } else if (timeStr.length === 1 || timeStr.length === 2) {
      // Handle format like "9" or "14"
      hours = timeStr;
      minutes = "00";
    } else {
      return timeStr; // Return original if format is unrecognized
    }

    hours = parseInt(hours);
    minutes = parseInt(minutes);

    // Validate hours and minutes
    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return timeStr; // Return original if invalid
    }

    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const displayMinutes = minutes.toString().padStart(2, "0");

    return `${displayHours}:${displayMinutes} ${period}`;
  };

  // Helper function to render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Date not available";
    }
  };
  const handleCloseChat = () => {
    setChatVisible(false);
    setSelectedInstructor(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Skill Header */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            {/* Full Card Image with Overlay Content */}
            <div className="relative h-80 bg-gray-200">
              <img
                src={
                  skill.listingImgURL || "/placeholder.svg?height=300&width=600"
                }
                alt={skill.title}
                className="w-full h-full object-cover"
              />

              {/* Dark gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

              {/* Proficiency Badge on top-right corner */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getProficiencyColor(
                    skill.proficiency
                  )}`}
                >
                  {skill.proficiency}
                </span>
              </div>

              {/* Title and Tags on bottom-left corner */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    {/* Title */}
                    <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
                      {skill.title}
                    </h1>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {skill.skillID?.tags && skill.skillID.tags.length > 0 ? (
                        skill.skillID.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white/90 text-gray-800 text-sm rounded-full backdrop-blur-sm"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-white/90 text-gray-800 text-sm rounded-full backdrop-blur-sm">
                          No tags
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rating on bottom-right corner */}
                  <div className="flex items-center gap-1 ml-4">
                    {reviewStats.averageRating &&
                    reviewStats.averageRating > 0 ? (
                      <>
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow-lg" />
                        <span className="font-semibold text-lg text-white drop-shadow-lg">
                          {reviewStats.averageRating.toFixed(1)}
                        </span>
                        <span className="text-white/80 drop-shadow-lg">
                          ({reviewStats.totalReviews} reviews)
                        </span>
                      </>
                    ) : (
                      <span className="text-white/80 drop-shadow-lg">
                        {reviewStats.totalReviews > 0
                          ? `${reviewStats.totalReviews} reviews`
                          : "No reviews yet"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: "overview", label: "Overview", icon: BookOpen },
                  { id: "reviews", label: "Reviews", icon: Star },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 ${
                      selectedTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {selectedTab === "overview" && (
                <div>
                  {/* Course Description */}
                  <div className="mb-8">
                    <MarkdownRenderer
                      content={skill.description}
                      className="text-gray-600 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {selectedTab === "curriculum" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    Course Curriculum
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Detailed curriculum will be discussed during the first
                    session based on your learning goals.
                  </p>
                  <div className="space-y-3">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        Session 1: Introduction & Basics
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Getting started with fundamentals
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        Session 2-5: Core Concepts
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Deep dive into main topics
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h4 className="font-medium text-gray-900">
                        Session 6+: Advanced Topics & Projects
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Hands-on practice and real projects
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "reviews" && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">
                    Student Reviews
                  </h3>
                  
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading reviews...</p>
                    </div>
                  ) : reviewsError ? (
                    <div className="text-center py-8 text-red-500">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{reviewsError}</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                      {/* Reviews Summary */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-gray-900">
                              {reviewStats.averageRating ? reviewStats.averageRating.toFixed(1) : 'N/A'}
                            </div>
                            <div className="flex justify-center mb-1">
                              {renderStarRating(reviewStats.averageRating || 0)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              {reviewStats.averageRating ? 
                                `Based on ${reviewStats.totalReviews} student reviews` : 
                                `${reviewStats.totalReviews} reviews (minimum 5 required for average rating)`
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Individual Reviews */}
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              {/* Reviewer Avatar */}
                              <div className="flex-shrink-0">
                                {review.learnerID?.profile?.profilePhoto ? (
                                  <img
                                    src={review.learnerID.profile.profilePhoto}
                                    alt={review.learnerID.fullname}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                                    {review.learnerID?.fullname
                                      ? review.learnerID.fullname
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                      : "?"}
                                  </div>
                                )}
                              </div>

                              {/* Review Content */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {review.learnerID?.fullname || "Anonymous"}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {renderStarRating(review.rating)}
                                      </div>
                                      <span className="text-sm text-gray-600">
                                        {review.rating}/5
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatDate(review.createdAt)}
                                  </div>
                                </div>
                                
                                <p className="text-gray-700 leading-relaxed">
                                  {review.reviewText}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No reviews yet. Be the first to review this skill!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <ChatBox
          visible={chatVisible}
          onClose={handleCloseChat}
          receiver={selectedInstructor}
        />

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <span className="text-3xl font-bold text-gray-900">
                Taka {skill.fee}
              </span>
            </div>
            <div className="space-y-3">
              {/* Save / Wishlist button (visible to all signed-in non-owners) */}
              {user && String(skill.teacherID?._id || skill.teacherID) !== String(user._id) && (
                <button
                  onClick={toggleSave}
                  disabled={saving}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition border ${
                    isSaved
                      ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-70`}
                >
                  <Heart size={16} className={isSaved ? "fill-red-500 text-red-500" : ""} />
                  {isSaved ? "Saved (click to remove)" : "Save for Later"}
                </button>
              )}

              {/* Check if current user is the listing owner */}
              {user && String(skill.teacherID?._id || skill.teacherID) === String(user._id) ? (
                <button
                  onClick={() => navigate(`/edit-listing/${skill._id}`)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Listing
                </button>
              ) : user ? (
                skill.availableSlots && skill.availableSlots.length > 0 ? (
                  <button
                    onClick={() =>
                      navigate(`/book-session/${skill._id}`, {
                        state: { teacherID: skill.teacherID?._id || skill.teacherID },
                      })
                    }
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Book a Session
                  </button>
                ) : (
                  <div className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg text-sm text-center">
                    No available slots — contact the instructor to arrange a time
                  </div>
                )
              ) : (
                <button
                  onClick={() => navigate("/signin")}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Sign In to Book
                </button>
              )}

              {/* Course Feedback Button - Only show if session is completed */}
              {sessionStatus === "completed" && (
                <button
                  onClick={() => navigate(`/rating/${skill._id}`)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-2 shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  <Star className="h-4 w-4" />
                  Share Feedback
                </button>
              )}

              {user && String(skill.teacherID?._id || skill.teacherID) !== String(user._id) && (
                 <button onClick={() => handleMessageClick(skill.teacherID)} className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact Instructor
                </button>
              )}
            </div>
          </div>

          {/* Skill Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Skill Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Proficiency Level</span>
                <span className="font-medium text-gray-900">
                  {skill.proficiency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {skill.skillID?.tags && skill.skillID.tags.length > 0 ? (
                    skill.skillID.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="font-medium text-gray-900">No tags</span>
                  )}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sessions</span>
                <span className="font-medium text-gray-900">
                  {skill.totalSessions || "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format</span>
                <span className="font-medium text-gray-900">One-on-One</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Slots</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {skill.availableSlots && skill.availableSlots.length > 0 ? (
                    skill.availableSlots.map((slot, index) => (
                      <span
                        key={index}
                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium"
                      >
                        {convertTo12Hour(slot)}
                      </span>
                    ))
                  ) : (
                    <span className="font-medium text-gray-900">
                      No slots available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Instructor Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              About the Instructor
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {skill.teacherID?.profile?.profilePhoto ? (
                <img
                  src={skill.teacherID.profile.profilePhoto}
                  alt={skill.teacherID.fullname || "Instructor"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-semibold text-gray-600">
                  {skill.teacherID?.fullname
                    ? skill.teacherID.fullname
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : "??"}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {skill.teacherID?.fullname || "Unknown Instructor"}
                </p>
                <p className="text-sm text-gray-600">Instructor</p>
                {/* <p className="text-xs text-gray-500">{skill.teacherID?.email || 'No email available'}</p> */}
              </div>
            </div>

            {/* Instructor Details */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Skill</span>
                <span className="text-sm font-medium text-gray-900 break-all">
                  {skill.skillID?.name || "Not available"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Experience</span>
                <span className="text-sm font-medium text-gray-900">
                  {skill.skillID?.experience
                    ? `${skill.skillID.experience} years+`
                    : "Not specified"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Level</span>
                <span className="text-sm font-medium text-gray-900">
                  {skill.skillID?.level || "Not specified"}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate("/profile/" + (skill.teacherID?._id || skill.teacherID))}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              View Instructor Profile
            </button>
          </div>
        </div>
      </div>
      <ChatBox
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        receiver={selectedInstructor}
      />
    </div>
  );
};

export default SkillDetails;
