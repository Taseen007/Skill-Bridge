"use client"

import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useDispatch } from "react-redux"
import { setUser } from "../../../redux/authSlice"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

const SignIn = () => {
  const [form, setForm] = useState({ email: "", password: "", role: "learner" })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()

  const returnUrl = location.state?.returnUrl || "/"
  const returnState = location.state?.returnState

  const validateForm = () => {
    const newErrors = {}
    if (!form.email) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Please enter a valid email address"
    if (!form.password) newErrors.password = "Password is required"
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (errors[name]) setErrors({ ...errors, [name]: "" })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:3000/api/v1/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user))
        localStorage.setItem("token", data.token)
        dispatch(setUser(data.user))
        toast.success("Welcome back! Login successful.", {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        })
        if (returnUrl !== "/" && returnState) navigate(returnUrl, { state: returnState })
        else navigate(returnUrl)
      } else {
        toast.error(data.message || "Login failed. Please check your credentials.", {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
        })
      }
    } catch (err) {
      console.error("Login error:", err)
      toast.error("Network error. Please check your connection and try again.", {
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
            <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
          </div>

          {location.state?.returnUrl?.includes("rate-session") && (
            <div className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Please sign in to rate and review your session.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full h-11 pl-10 pr-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder-gray-400
                    ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200"}`}
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full h-11 pl-10 pr-10 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 placeholder-gray-400
                    ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200"}`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.password}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <div className="grid grid-cols-2 gap-3">
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
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                  Signing you in...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href="http://localhost:3000/api/v1/user/oauth/google" className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-center leading-10 hover:bg-gray-50">Google</a>
            <a href="http://localhost:3000/api/v1/user/oauth/github" className="h-10 rounded-lg border border-gray-200 text-sm font-medium text-center leading-10 hover:bg-gray-50">GitHub</a>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-indigo-600 hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
