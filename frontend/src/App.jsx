"use client"

// App.jsx
import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { setUser } from "./redux/authSlice"
import { canTeach } from "./utils/roles"

import { Toaster } from "sonner"

import Navbar from "./components/shared/Navbar"
import SignIn from "./components/pages/Authentication/SignIn"
import SignUp from "./components/pages/Authentication/SignUp"
import Home from "./components/pages/General/Home"
import Profile from "./components/pages/General/Profile"
import Footer from "./components/shared/Footer"
import SkillsDiscovery from "./components/pages/Skills/page"
import SkillsDetails from "./components/pages/Skills/[id]/page"
import AddListing from "./components/pages/Skills/AddListings"
import AddSkills from "./components/pages/Skills/AddSkills"
import BookSessionForm from "./components/components/SessionBookingForm"
import LearnerSessions from "./components/pages/Sessions/LearnerSessions"
import TeacherSessions from "./components/pages/Sessions/TeacherSessions"
import UserProfile from "./components/pages/General/UserProfile"
import EditListings from "./components/pages/Skills/edit/page"
import RatingReviewPage from "./components/pages/Rating/RatingReviewPage"
import RatingsReviews from "./components/pages/General/RatingsReviews"
import UserRatingsReviews from "./components/pages/General/UserRatingsReviews"
import TeacherReviews from "./components/pages/General/TeacherReviews"
import NotificationPage from "./components/pages/Notifications/NotificationPage"
import OAuthCallback from "./components/pages/Authentication/OAuthCallback"

const Skills = () => (
  <div className="p-6 text-center">
    <h2 className="text-3xl font-semibold">Skills</h2>
    <SkillsDiscovery />
  </div>
)

// Redirects unauthenticated users to /signin and non-teachers to /skills
const TeacherRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  if (!user) return <Navigate to="/signin" replace />
  if (!canTeach(user.role)) return <Navigate to="/skills" replace />
  return children
}

// Redirects unauthenticated users to /signin
const AuthRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  if (!user) return <Navigate to="/signin" replace />
  return children
}

// Redirects already-authenticated users away from auth pages
const GuestRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user)
  if (user) return <Navigate to="/" replace />
  return children
}

const App = () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    if (storedUser && token) {
      dispatch(setUser(JSON.parse(storedUser)))
    }
  }, [dispatch])

  return (
    <Router>
      <Toaster position="top-center" richColors />

      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/skills/:id" element={<SkillsDetails />} />
        <Route path="/skills/add" element={<TeacherRoute><AddSkills /></TeacherRoute>} />
        <Route path="/listings/add" element={<TeacherRoute><AddListing /></TeacherRoute>} />
        <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
        <Route path="/profile/ratings-reviews" element={<AuthRoute><RatingsReviews /></AuthRoute>} />
        <Route path="/profile/reviews" element={<AuthRoute><TeacherReviews /></AuthRoute>} />
        <Route path="/profile/user-ratings/:userId" element={<AuthRoute><UserRatingsReviews /></AuthRoute>} />
        <Route path="/profile/:id" element={<AuthRoute><UserProfile /></AuthRoute>} />
        {/* Authentication Routes */}
        <Route path="/signin" element={<GuestRoute><SignIn /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignUp /></GuestRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/book-session/:skillId" element={<AuthRoute><BookSessionForm /></AuthRoute>} />
        <Route path="/sessions/learner" element={<AuthRoute><LearnerSessions /></AuthRoute>} />
        <Route path="/sessions/teacher" element={<AuthRoute><TeacherSessions /></AuthRoute>} />
        <Route path="/edit-listing/:id" element={<TeacherRoute><EditListings /></TeacherRoute>} />
        <Route path="/rating/:skillListingID" element={<AuthRoute><RatingReviewPage /></AuthRoute>} />
        <Route path="/notifications" element={<AuthRoute><NotificationPage /></AuthRoute>} />
        <Route path="*" element={<div className="text-center p-6">404 - Page Not Found</div>} />
      </Routes>
      <Footer />
    </Router>
  )
}

export default App
