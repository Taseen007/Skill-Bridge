"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { Plus, X, BookOpen, Tag, Award, Clock, FileText, Folder, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { buildApiUrl, API_ENDPOINTS } from "../../config/api"
import { canTeach } from "../../utils/roles"

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const AddSkill = () => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    tags: [],
    level: "",
    experience: "",
  })
  const [currentTag, setCurrentTag] = useState("")
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    "Programming",
    "Design",
    "Marketing",
    "Business",
    "Operations",
    "Finance",
    "Music",
    "Languages",
    "Fitness",
    "Cooking",
    "Photography",
    "Writing",
    "Other",
  ]

  const levels = ["Beginner", "Intermediate", "Advanced"]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleCategoryChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, category: value }))
    // Clear category error if it exists
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: "" }))
    }
  }, [errors.category])

  const handleLevelChange = useCallback((value) => {
    setFormData(prev => ({ ...prev, level: value }))
    // Clear level error if it exists
    if (errors.level) {
      setErrors(prev => ({ ...prev, level: "" }))
    }
  }, [errors.level])

  const handleAddTag = (e) => {
    e.preventDefault()
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim().toLowerCase()],
      }))
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Skill name is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.trim().length < 50) {
      newErrors.description = "Description must be at least 50 characters"
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    if (formData.tags.length === 0) {
      newErrors.tags = "At least one tag is required"
    }

    if (!formData.level) {
      newErrors.level = "Skill level is required"
    }

    if (!formData.experience) {
      newErrors.experience = "Experience is required"
    } else if (formData.experience < 0 || formData.experience > 50) {
      newErrors.experience = "Experience must be between 0 and 50 years"
    }

    setErrors(newErrors)
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validateForm()

    if (!validation.isValid) {
      return
    }

    setIsSubmitting(true)

    try {
      const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };

      const token = getCookie('token');
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const requestBody = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags,
        level: formData.level,
        experience: parseInt(formData.experience)
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.SKILLS.CREATE), {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: JSON.stringify(requestBody)
      })

      const responseText = await response.text()
      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error('Server returned invalid JSON response')
      }

      if (response.ok) {
        toast.success("Skill added! Now create a listing so learners can find you.")
        navigate('/listings/add')
      } else {
        toast.error(result.message || 'Failed to create skill. Please try again.')
      }
    } catch (error) {
      console.error('Network error:', error)
      toast.error('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Role guard: renders a blocking UI if user lacks teacher permissions.
          TeacherRoute in App.jsx already redirects, but this is a safety net
          in case the component is used standalone or the Redux state lags. */}
      {(!user || !canTeach(user.role)) ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-5xl mb-4">{!user ? "🔒" : "🎓"}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {!user ? "Sign in required" : "Teacher account required"}
            </h2>
            <p className="text-gray-600 mb-6">
              {!user
                ? "You need to be signed in to add a skill."
                : "Only teachers can add skills. Upgrade your account in your profile to start teaching."}
            </p>
            <button
              onClick={() => navigate(!user ? "/signin" : "/skills")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {!user ? "Sign In" : "Browse Skills"}
            </button>
          </div>
        </div>
      ) : (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add New Skill</h1>
          <p className="text-gray-600">Share your expertise and help others learn new skills</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Skill Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="h-4 w-4" />
                Skill Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Supply Chain Management"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4" />
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe what you'll teach, the skills students will gain, and your teaching approach..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                <p className="text-gray-500 text-sm ml-auto">{formData.description.length}/50 characters</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Folder className="h-4 w-4" />
                  Category *
                </label>
                <CustomDropdown
                  value={formData.category}
                  onChange={handleCategoryChange}
                  options={categories}
                  placeholder="Select a category"
                  error={errors.category}
                />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>

              {/* Level */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Award className="h-4 w-4" />
                  Skill Level *
                </label>
                <CustomDropdown
                  value={formData.level}
                  onChange={handleLevelChange}
                  options={levels}
                  placeholder="Select skill level"
                  error={errors.level}
                />
                {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level}</p>}
              </div>
            </div>

            {/* Experience */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4" />
                Years of Experience *
              </label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                max="50"
                placeholder="e.g., 4"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.experience ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4" />
                Tags *
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Add a tag (e.g., logistics, procurement)"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddTag(e)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {/* Display Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags}</p>}
              <p className="text-gray-500 text-sm mt-1">
                Add relevant tags to help students find your skill (e.g., logistics, procurement, inventory)
              </p>
            </div>

            {/* Preview Section */}
            {formData.name && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                    {formData.level && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          formData.level === "Beginner"
                            ? "bg-green-100 text-green-800"
                            : formData.level === "Intermediate"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {formData.level}
                      </span>
                    )}
                  </div>
                  {formData.category && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
                      {formData.category}
                    </span>
                  )}
                  {formData.description && <p className="text-gray-600 text-sm mb-2">{formData.description}</p>}
                  {formData.experience && (
                    <p className="text-gray-500 text-sm">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formData.experience} years of experience
                    </p>
                  )}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding Skill..." : "Add Skill"}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Creating a Great Skill Listing</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li>• Write a clear, descriptive skill name that students can easily understand</li>
            <li>• Provide a detailed description of what students will learn and achieve</li>
            <li>• Choose relevant tags that students might search for</li>
            <li>• Be honest about the skill level - this helps match you with the right students</li>
            <li>• Your experience level helps build trust with potential students</li>
          </ul>
        </div>
      </div>
    </div>
      )}
    </>
  )
}

export default AddSkill
