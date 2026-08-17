import { Link } from "react-router-dom";
import { Star, MessageCircle, Heart } from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import { useEffect, useState } from "react";
import ChatBox from "../pages/Chat/ChatBox";
import { useSelector } from "react-redux";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import { toast } from "sonner";

const SkillCard = ({ skill, onMessageClick }) => {
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check saved state on mount and when user/savedListings change
  useEffect(() => {
    if (!user || !skill?._id) return;
    const initial =
      (user.savedListings && user.savedListings.some((id) => String(id) === String(skill._id))) ||
      false;
    setIsSaved(initial);
  }, [user, skill?._id]);

  const toggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info("Sign in to save listings");
      return;
    }
    setSaving(true);
    try {
      const token =
        (typeof document !== "undefined" &&
          (() => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; token=`);
            if (parts.length === 2) return parts.pop().split(";").shift();
            return null;
          })()) ||
        localStorage.getItem("token");

      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(buildApiUrl(API_ENDPOINTS.LISTINGS.SAVE(skill._id)), {
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

  const truncateToWords = (text, wordLimit = 50) => {
    if (!text) return "";
    const lines = text.split("\n");
    const contentWithoutHeaders = lines
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n")
      .trim();
    if (!contentWithoutHeaders) return "";
    const words = contentWithoutHeaders.split(/\s+/);
    if (words.length <= wordLimit) return contentWithoutHeaders;
    return words.slice(0, wordLimit).join(" ") + "...";
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Skill Image */}
      <div className="h-48 bg-gray-200 overflow-hidden relative">
        <img
          src={skill.listingImgURL || "/placeholder.svg?height=200&width=400"}
          alt={skill.title}
          className="w-full h-full object-cover"
        />
        {/* Save/Heart Button */}
        <button
          onClick={toggleSave}
          disabled={saving}
          title={isSaved ? "Remove from saved" : "Save for later"}
          className={`absolute top-2 left-2 w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm border ${
            isSaved
              ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
              : "bg-white/90 border-white text-gray-600 hover:bg-white hover:text-red-500"
          } disabled:opacity-70`}
          aria-label="Save listing"
        >
          <Heart size={16} className={isSaved ? "fill-white" : ""} />
        </button>
        <span
          className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full ${getProficiencyColor(
            skill.proficiency
          )}`}
        >
          {skill.proficiency}
        </span>
      </div>

      <div className="p-6">
        {/* Skill Header */}
        <div className="mb-4">
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-gray-900 text-left line-clamp-2">
              {skill.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex flex-wrap gap-1">
              {skill.skillID?.tags &&
                skill.skillID.tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              {skill.skillID?.tags && skill.skillID.tags.length > 4 && (
                <span className="px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded-full">
                  +{skill.skillID.tags.length - 4} more
                </span>
              )}
              {skill.skillID?.category && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100">
                  {skill.skillID.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 mb-3">
            {skill.avgRating > 0 ? (
              <>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium text-gray-900">{skill.avgRating}</span>
                <span className="text-sm text-gray-500">(0 reviews)</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">No reviews yet</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <MarkdownRenderer
            content={truncateToWords(skill.description, 50)}
            className="text-sm text-gray-600 leading-relaxed line-clamp-3 text-justify [&>div]:text-sm [&_*]:text-sm [&_*]:text-gray-600 [&_*]:leading-relaxed [&_*]:mb-1 [&_strong]:font-medium"
          />
        </div>

        {/* Instructor Info */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {skill.teacherID?.profile?.profilePhoto ? (
              <img
                src={skill.teacherID.profile.profilePhoto}
                alt={skill.teacherID.fullname}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                {skill.teacherID?.fullname
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {skill.teacherID?.fullname}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {skill.teacherID?.profile?.location || "Instructor"}
            </p>
          </div>
        </div>

        {/* Price and Actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">৳{skill.fee}</span>
            <span className="text-sm text-gray-500">/session</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/skills/${skill._id}`}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 text-center"
          >
            View Details
          </Link>
          {user && user._id !== skill.teacherID?._id && (
            <button
              onClick={() => onMessageClick(skill.teacherID)}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 flex items-center justify-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              Contact
            </button>
          )}
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

export default SkillCard;
