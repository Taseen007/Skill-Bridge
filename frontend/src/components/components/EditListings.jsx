"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  X,
  BookOpen,
  Tag,
  Award,
  Clock,
  FileText,
  Folder,
  AlertCircle,
  CheckCircle,
  User,
  Globe,
  Eye,
  Edit3,
  ChevronDown,
} from "lucide-react";
import { useSelector } from "react-redux";
import MarkdownRenderer from "./MarkdownRenderer";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    // Handle both string options and object options
    const selectedValue = typeof option === "object" ? option.value : option;
    onChange(selectedValue);
    setIsOpen(false);
  };

  // Find display text for current value
  const getDisplayText = () => {
    if (!value) return placeholder;

    const option = options.find((opt) =>
      typeof opt === "object" ? opt.value === value : opt === value
    );

    return typeof option === "object" ? option.label : option || value;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-4 border-2 rounded-xl text-base transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-left flex items-center justify-between ${
          error
            ? "border-red-500 bg-red-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {getDisplayText()}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
            >
              {typeof option === "object" ? option.label : option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AddListing = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get listing ID from URL params
  const user = useSelector((state) => state.auth.user);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    fee: "",
    proficiency: "",
    skillID: "",
    listingImgURL: "",
    availableSlots: [],
    totalSessions: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const proficiencyLevels = ["Beginner", "Intermediate", "Advanced"];

  // State for available skills
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);

  // Fetch existing listing data if editing
  useEffect(() => {
    const fetchListingData = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setFetchError(null);

        // Get token from cookies
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

        // Add authorization header if token exists
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.LISTINGS.BY_ID(id)),
          {
            method: "GET",
            headers: headers,
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.listing) {
          const listing = data.listing;
          
          // Check if current user owns this listing
          if (listing.teacherID._id !== user._id) {
            throw new Error("You can only edit your own listings");
          }

          // Populate form data with existing listing data
          setFormData({
            title: listing.title || "",
            description: listing.description || "",
            fee: listing.fee ? listing.fee.toString() : "",
            proficiency: listing.proficiency || "",
            skillID: listing.skillID._id || "",
            listingImgURL: listing.listingImgURL || "",
            availableSlots: listing.availableSlots || [],
            totalSessions: listing.totalSessions ? listing.totalSessions.toString() : "",
          });
        } else {
          throw new Error(data.message || "Failed to fetch listing data");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
        setFetchError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingData();
  }, [id, user]);

  // Fetch available skills on component mount
  useEffect(() => {
    const fetchSkills = async () => {
      if (!user || !user._id) {
        setLoadingSkills(false);
        return;
      }

      try {
        setLoadingSkills(true);

        // Get token from cookies
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

        // Add authorization header if token exists
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          buildApiUrl(API_ENDPOINTS.SKILLS.BY_ID(user._id)),
          {
            method: "GET",
            headers: headers,
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.skills) {
            setAvailableSkills(data.skills);
          } else {
            setAvailableSkills([]);
          }
        } else {
          setAvailableSkills([]);
        }
      } catch (error) {
        setAvailableSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    };

    fetchSkills();
  }, [user]);

  const steps = [
    {
      id: 1,
      title: "Basic Information",
      description: "Listing title and description",
    },
    {
      id: 2,
      title: "Skill & Proficiency",
      description: "Select skill and level",
    },
    {
      id: 3,
      title: "Pricing & Image",
      description: "Set fee and upload image",
    },
    {
      id: 4,
      title: "Review & Submit",
      description: "Final review before publishing",
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Slot input state
  const [slotInput, setSlotInput] = useState("");
  const [slotError, setSlotError] = useState("");

  // Helper to validate and add slot
  const handleAddSlot = () => {
    if (!slotInput) {
      setSlotError("Please select a time slot");
      return;
    }
    // Check for duplicates
    if (formData.availableSlots.includes(slotInput)) {
      setSlotError("This slot is already added");
      return;
    }
    // Check for < 1 hour gap with any existing slot
    const [inputHour, inputMinute] = slotInput.split(":").map(Number);
    const inputTotalMinutes = inputHour * 60 + inputMinute;
    const hasConflict = formData.availableSlots.some((existing) => {
      const [exHour, exMinute] = existing.split(":").map(Number);
      const exTotalMinutes = exHour * 60 + exMinute;
      return Math.abs(inputTotalMinutes - exTotalMinutes) < 60;
    });
    if (hasConflict) {
      setSlotError("Slots must be at least 1 hour apart");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      availableSlots: [...prev.availableSlots, slotInput],
    }));
    setSlotInput("");
    setSlotError("");
  };

  // Remove slot
  const handleRemoveSlot = (slot) => {
    setFormData((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.filter((s) => s !== slot),
    }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Listing title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 50) {
      newErrors.description =
        "Description must be at least 50 characters for better clarity";
    } else if (formData.description.trim().length > 5000) {
      newErrors.description = "Description must be less than 5000 characters";
    }

    if (!formData.skillID) {
      newErrors.skillID = "Skill selection is required";
    }

    if (!formData.proficiency) {
      newErrors.proficiency = "Proficiency level is required";
    }

    if (!formData.fee) {
      newErrors.fee = "Fee is required";
    } else if (formData.fee < 0 || formData.fee > 10000) {
      newErrors.fee = "Fee must be between 0 and 10000";
    }

    if (!formData.totalSessions.trim()) {
      newErrors.totalSessions = "Total sessions is required";
    } else if (isNaN(formData.totalSessions) || parseInt(formData.totalSessions) <= 0) {
      newErrors.totalSessions = "Total sessions must be a positive number";
    } else if (parseInt(formData.totalSessions) > 100) {
      newErrors.totalSessions = "Total sessions must be 100 or less";
    }

    if (!formData.listingImgURL.trim()) {
      newErrors.listingImgURL = "Image URL is required";
    } else {
      // Basic URL validation
      try {
        new URL(formData.listingImgURL);
      } catch {
        newErrors.listingImgURL = "Please enter a valid image URL";
      }
    }

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  }, [formData]);

  // Memoized form validation state to prevent re-renders
  const isFormValid = useMemo(() => {
    return validateForm().isValid;
  }, [validateForm]);

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.title.trim() &&
          formData.description.trim() &&
          formData.description.trim().length >= 50 &&
          formData.totalSessions.trim()
        );
      case 2:
        return (
          !loadingSkills &&
          formData.skillID &&
          formData.proficiency &&
          availableSkills.length > 0
        );
      case 3:
        return (
          formData.fee &&
          formData.listingImgURL.trim()
        );
      default:
        return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm();

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const requestBody = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        fee: parseInt(formData.fee),
        proficiency: formData.proficiency,
        skillID: formData.skillID,
        listingImgURL: formData.listingImgURL.trim(),
        availableSlots: formData.availableSlots,
        totalSessions: parseInt(formData.totalSessions),
      };

      // Get token from cookies
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

      // Add authorization header if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Determine if we're creating or updating
      const isEditing = !!id;
      const apiUrl = isEditing 
        ? buildApiUrl(API_ENDPOINTS.LISTINGS.UPDATE(id))
        : buildApiUrl(API_ENDPOINTS.LISTINGS.CREATE);
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method: method,
        headers: headers,
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          alert(isEditing ? "Listing updated successfully!" : "Listing created successfully!");
          navigate("/skills");
        } else {
          alert(`Error: ${data.message || (isEditing ? "Failed to update listing" : "Failed to create listing")}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(
          `Error: ${
            errorData.message || (isEditing ? "Failed to update listing. Please try again." : "Failed to create listing. Please try again.")
          }`
        );
      }
    } catch (error) {
      alert(isEditing ? "Error updating listing. Please try again." : "Error creating listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading listing data...</p>
          </div>
        )}

        {/* Error State */}
        {fetchError && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Error Loading Listing
            </h3>
            <p className="text-gray-600 mb-4">{fetchError}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate("/skills")}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Go Back
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !fetchError && (
          <>
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
                {isEditing ? <Edit3 className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {isEditing ? "Edit Your Listing" : "Share Your Expertise"}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {isEditing 
                  ? "Update your skill listing to keep it current and engaging"
                  : "Create a professional skill listing and help others learn from your experience"
                }
              </p>
            </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      currentStep >= step.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <p
                      className={`text-sm font-medium ${
                        currentStep >= step.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-24">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 rounded transition-all duration-300 ${
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 md:p-12">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Basic Information
                  </h2>
                  <p className="text-gray-600">
                    Create your listing title and description
                  </p>
                </div>

                {/* Listing Title */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Mastering Supply Chain Management"
                    className={`w-full px-4 py-4 border-2 rounded-xl text-lg transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${
                      errors.title
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                  {errors.title && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.title}
                    </div>
                  )}
                  <p className="text-gray-500 text-sm">
                    Create an engaging title that clearly describes your
                    offering.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Describe what you'll teach * (Markdown supported)
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewMode(false)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                          !previewMode
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Edit3 className="h-3 w-3" />
                        Write
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode(true)}
                        className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                          previewMode
                            ? "bg-blue-100 text-blue-700 border border-blue-200"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </button>
                    </div>
                  </div>

                  {!previewMode ? (
                    <div className="space-y-2">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={8}
                        placeholder={`Provide a comprehensive description of what students will learn, your teaching methodology, and the outcomes they can expect.`}
                        className={`w-full px-4 py-4 border-2 rounded-xl text-base leading-relaxed transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 resize-none font-mono ${
                          errors.description
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      />

                      {/* Markdown Help */}
                      <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="font-semibold mb-1">Headers:</p>
                            <code># H1</code>
                            <br />
                            <code>## H2</code>
                            <br />
                            <code>### H3</code>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Emphasis:</p>
                            <code>**bold**</code>
                            <br />
                            <code>*italic*</code>
                            <br />
                            <code>`code`</code>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Lists:</p>
                            <code>- Item 1</code>
                            <br />
                            <code>- Item 2</code>
                            <br />
                            <code>1. Numbered</code>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Quotes:</p>
                            <code>&gt; Quote text</code>
                            <br />
                            <code>[Link](url)</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl p-4 min-h-[250px] bg-gray-50">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Preview
                        </h4>
                        {formData.description.trim() ? (
                          <MarkdownRenderer content={formData.description} />
                        ) : (
                          <div className="text-gray-400 italic text-center py-8">
                            Start writing your description to see the preview
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    {errors.description && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.description}
                      </div>
                    )}
                    <div className="flex items-center gap-4 ml-auto">
                      <span
                        className={`text-sm ${
                          formData.description.length < 50
                            ? "text-red-500"
                            : formData.description.length > 5000
                            ? "text-orange-500"
                            : "text-green-600"
                        }`}
                      >
                        {formData.description.length}/5000 characters
                      </span>
                      {formData.description.length >= 50 && (
                        <div className="flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Good length
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Total Sessions */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Total Sessions *
                  </label>
                  <input
                    type="number"
                    name="totalSessions"
                    value={formData.totalSessions}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                    placeholder="e.g., 8"
                    className={`w-full px-4 py-4 border-2 rounded-xl text-lg transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${
                      errors.totalSessions
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  />
                  {errors.totalSessions && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      {errors.totalSessions}
                    </div>
                  )}
                  <p className="text-gray-500 text-sm">
                    Specify the total number of sessions your course will have.
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: Skill & Proficiency */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Skill & Proficiency
                  </h2>
                  <p className="text-gray-600">
                    Select the skill you're offering and your proficiency level
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Skill Selection */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Folder className="h-5 w-5 text-blue-600" />
                      Select Skill *
                    </label>
                    {loadingSkills ? (
                      <div className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2 text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                          Loading your skills...
                        </div>
                      </div>
                    ) : availableSkills.length === 0 ? (
                      <div className="w-full px-4 py-4 border-2 border-yellow-200 bg-yellow-50 rounded-xl">
                        <div className="flex items-center gap-2 text-yellow-700">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">
                            No skills found. Please{" "}
                            <button
                              type="button"
                              onClick={() => navigate("/skills/add")}
                              className="underline hover:no-underline font-medium"
                            >
                              create a skill
                            </button>{" "}
                            first.
                          </span>
                        </div>
                      </div>
                    ) : (
                      <CustomDropdown
                        value={formData.skillID}
                        onChange={(value) =>
                          setFormData({ ...formData, skillID: value })
                        }
                        options={availableSkills.map((skill) => ({
                          label: skill.name,
                          value: skill._id,
                        }))}
                        placeholder="Choose from your skills"
                        error={errors.skillID}
                      />
                    )}
                    {errors.skillID && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.skillID}
                      </div>
                    )}
                    <p className="text-gray-500 text-sm">
                      Select one of your existing skills to create a listing
                      for.
                      {availableSkills.length > 0 && (
                        <span className="block mt-1 text-blue-600">
                          Found {availableSkills.length} skill
                          {availableSkills.length !== 1 ? "s" : ""} available
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Proficiency Level */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Award className="h-5 w-5 text-blue-600" />
                      Proficiency Level *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {proficiencyLevels.map((level) => (
                        <label
                          key={level}
                          className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            formData.proficiency === level
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                          style={{ textAlign: 'center', fontSize: '1rem' }}
                        >
                          <input
                            type="radio"
                            name="proficiency"
                            value={level}
                            checked={formData.proficiency === level}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <span className="font-medium w-full text-center" style={{ textAlign: 'center', marginTop: '.75rem' }}>{level}</span>
                        </label>
                      ))}
                    </div>
                    {errors.proficiency && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.proficiency}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Pricing, Image & Available Slots */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Pricing, Image & Available Slots
                  </h2>
                  <p className="text-gray-600">
                    Set your fee, add an image, and specify your available
                    one-hour slots
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Fee */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Fee (BDT) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="fee"
                        value={formData.fee}
                        onChange={handleInputChange}
                        min="0"
                        max="10000"
                        placeholder="e.g., 55"
                        className={`w-full px-4 py-4 pl-8 border-2 rounded-xl text-lg transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${
                          errors.fee
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">
                        ৳
                      </div>
                    </div>
                    {errors.fee && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.fee}
                      </div>
                    )}
                    <p className="text-gray-500 text-sm">
                      Set a competitive price for your expertise
                    </p>
                  </div>

                  {/* Image URL */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Listing Image URL *
                    </label>
                    <input
                      type="url"
                      name="listingImgURL"
                      value={formData.listingImgURL}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                      className={`w-full px-4 py-4 border-2 rounded-xl text-lg transition-all duration-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 ${
                        errors.listingImgURL
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    />
                    {errors.listingImgURL && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.listingImgURL}
                      </div>
                    )}
                    <p className="text-gray-500 text-sm">
                      Add a relevant image URL that represents your listing
                    </p>
                    {/* Image Preview */}
                    {formData.listingImgURL && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Preview:
                        </p>
                        <div className="border-2 border-gray-200 rounded-xl p-4">
                          <img
                            src={formData.listingImgURL}
                            alt="Listing preview"
                            className="w-full h-48 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div className="hidden w-full h-48 bg-gray-100 rounded-lg items-center justify-center">
                            <span className="text-gray-500">
                              Invalid image URL
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Available Slots */}
                <div className="mt-8">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Available One-Hour Time Slots
                  </label>
                  <div className="flex flex-col md:flex-row gap-4 items-center mb-2">
                    <input
                      type="time"
                      value={slotInput}
                      onChange={(e) => {
                        setSlotInput(e.target.value);
                        setSlotError("");
                      }}
                      className="px-4 py-3 border-2 rounded-xl text-base focus:ring-4 focus:ring-blue-100 focus:border-blue-500 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all duration-200"
                    >
                      Add Slot
                    </button>
                  </div>
                  {slotError && (
                    <div className="text-red-600 text-sm mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {slotError}
                    </div>
                  )}
                  {formData.availableSlots.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.availableSlots.map((slot) => (
                          <div
                            key={slot}
                            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium gap-2"
                          >
                            {slot}
                            <button
                              type="button"
                              className="ml-1 text-blue-600 hover:text-red-600"
                              onClick={() => handleRemoveSlot(slot)}
                              aria-label="Remove slot"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        All slots are for 1 hour. Add as many as you want. (Time
                        only, e.g., 14:00)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Review Your Listing
                  </h2>
                  <p className="text-gray-600">
                    Double-check all information before publishing
                  </p>
                </div>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-6 mb-4">
                      {/* Image */}
                      {formData.listingImgURL && (
                        <div className="w-32 h-32 flex-shrink-0">
                          <img
                            src={formData.listingImgURL}
                            alt="Listing"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {formData.title}
                        </h3>
                        <div className="flex items-center gap-3 mb-3">
                          {formData.proficiency && (
                            <span
                              className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${
                                formData.proficiency === "Beginner"
                                  ? "bg-green-100 text-green-800"
                                  : formData.proficiency === "Intermediate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-orange-100 text-orange-800"
                              }`}
                            >
                              <Award className="h-3 w-3 mr-1" />
                              {formData.proficiency}
                            </span>
                          )}
                          {formData.fee && (
                            <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                              <Clock className="h-3 w-3 mr-1" />৳{formData.fee}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {formData.description && (
                      <div className="text-gray-600 leading-relaxed mb-4">
                        <MarkdownRenderer content={formData.description} />
                      </div>
                    )}

                    {formData.skillID && (
                      <div className="flex items-center gap-2 mb-4 text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Skill:{" "}
                          {availableSkills.find(
                            (skill) => skill._id === formData.skillID
                          )?.name || formData.skillID}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confirmation Checklist */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4">
                    Before you submit:
                  </h4>
                  <div className="space-y-3 text-sm text-yellow-700">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-yellow-600" />
                      <span>Title accurately represents your offering</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-yellow-600" />
                      <span>
                        Description clearly explains what learners will get
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-yellow-600" />
                      <span>Pricing is competitive and fair</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-yellow-600" />
                      <span>Image is relevant and professional</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <div className="flex gap-4">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200"
                  >
                    Previous
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-6 py-3 text-gray-500 hover:text-gray-700 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>

              <div className="flex gap-4">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedToNext()}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    Continue
                    <Globe className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting || !isFormValid}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        {isEditing ? "Updating..." : "Publishing..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {isEditing ? "Update Listing" : "Publish Skill"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-4">
              <User className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Tips for Success
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Use clear, professional language that beginners can understand
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Include specific outcomes and deliverables students will
                  achieve
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Choose tags that students actually search for</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Be honest about skill level to attract the right students
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>
                  Highlight your unique approach or teaching methodology
                </span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>Update your listing regularly to keep it relevant</span>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default AddListing;
