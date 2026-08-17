"use client"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { Star, LogIn } from "lucide-react"
import { toast } from "sonner"

const RatingButton = ({ session, className = "" }) => {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)

  const handleRateSession = () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please sign in to rate sessions")
      navigate("/signin", {
        state: {
          returnUrl: `/rate-session/${session._id}`,
          returnState: { sessionData: session },
        },
      })
      return
    }

    // Check if user is a learner
    if (user.role !== "learner") {
      toast.error("Only learners can rate sessions")
      return
    }

    // Navigate to rating page
    navigate(`/rate-session/${session._id}`, {
      state: { sessionData: session },
    })
  }

  // Only show rating button for completed sessions
  if (session.status !== "completed") {
    return null
  }

  return (
    <button
      onClick={handleRateSession}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium ${className}`}
    >
      {!user ? <LogIn size={16} /> : <Star size={16} />}
      {!user ? "Sign In to Rate" : "Rate Session"}
    </button>
  )
}

export default RatingButton
