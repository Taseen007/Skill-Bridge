"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, User, Phone, Upload, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

const SignUp = () => {
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "learner",
  })
  const [file, setFile] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()

  const validateForm = () => {
    const newErrors = {}
    if (!form.fullname) newErrors.fullname = "Full name is required"
    if (!form.email) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Enter a valid email"
    if (!form.phoneNumber) newErrors.phoneNumber = "Phone number is required"
    if (!form.password) newErrors.password = "Password is required"
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    if (!file) newErrors.file = "Profile photo is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: "" })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
    if (errors.file) setErrors({ ...errors, file: "" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)

    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.append(key, value))
    formData.append("profilePhoto", file)

    try {
      const res = await fetch("http://localhost:3000/api/v1/user/register", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        toast.success("Account created successfully!", {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        })
        navigate("/signin")
      } else {
        toast.error(data.message || "Registration failed", {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        })
      }
    } catch (err) {
      console.error("Signup error:", err)
      toast.error("Network error. Please try again.", {
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-xl border border-gray-100 rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-xl mb-3 shadow-sm">
              <User className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
            <p className="text-gray-500 text-sm mt-1">Sign up to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  className={`w-full h-11 pl-10 pr-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                    ${errors.fullname ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200"}`}
                  placeholder="Your full name"
                  disabled={isLoading}
                />
              </div>
              {errors.fullname && <p className="text-red-600 text-xs mt-1">{errors.fullname}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full h-11 pl-10 pr-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                    ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200"}`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className={`w-full h-11 pl-10 pr-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                    ${errors.phoneNumber ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200"}`}
                  placeholder="Your phone number"
                  disabled={isLoading}
                />
              </div>
              {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full h-11 pl-10 pr-10 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30
                    ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200"}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "learner" })}
                  className={`h-11 rounded-lg border text-sm font-medium transition
                    ${form.role === "learner"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                  disabled={isLoading}
                >
                  Learner
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "teacher" })}
                  className={`h-11 rounded-lg border text-sm font-medium transition
                    ${form.role === "teacher"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                  disabled={isLoading}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: "both" })}
                  className={`h-11 rounded-lg border text-sm font-medium transition
                    ${form.role === "both"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                  disabled={isLoading}
                  title="Teach AND learn with one account"
                >
                  Both
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Choose "Both" if you want to teach some skills and learn others.
                You can change this later from your profile menu.
              </p>
            </div>

            {/* Profile Photo */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Profile Photo</label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="file"
                  name="file"
                  onChange={handleFileChange}
                  className="w-full h-11 pl-10 pr-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  disabled={isLoading}
                />
              </div>
              {errors.file && <p className="text-red-600 text-xs mt-1">{errors.file}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Creating account...
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link to="/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
