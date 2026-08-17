// Learner responds to reschedule
export async function respondSessionReschedule(sessionId, accept) {
  const endpoint = `/sessions/${sessionId}/respond-reschedule`
  await axios.patch(buildApiUrl(endpoint), { accept }, { withCredentials: true })
}
// Propose session reschedule
export async function proposeSessionReschedule(sessionId, { newTime, newDate }) {
  const endpoint = `/sessions/${sessionId}/propose-reschedule`
  await axios.patch(buildApiUrl(endpoint), { newTime, newDate }, { withCredentials: true })
}
// API Configuration
const API_CONFIG = {
  BASE_URL: "http://localhost:3000/api/v1",
  ENDPOINTS: {
    // Skill Listings
    LISTINGS: {
      ALL: "/listings/all",
      BY_ID: (id) => `/listings/single/${id}`,
      TAGS: "/listings/tags",
      CREATE: "/listings/create",
      UPDATE: (id) => `/listings/update/${id}`,
      SAVE: (id) => `/listings/save/${id}`,
      CHECK_SAVED: (id) => `/listings/save/check/${id}`,
      SAVED_LIST: "/listings/saved/list",
    },

    // User Profile
    USER: {
      PROFILE: "/user/profile",
      UPDATE: "/user/profile/update",
      UPGRADE_ROLE: "/user/profile/upgrade-role",
      BY_ID: (id) => `/user/${id}`,
    },
    // Skills
    SKILLS: {
      ALL: "/skills/all",
      BY_ID: (id) => `/skills/user/${id}`,
      CREATE: "/skills/create",
    },
    // Session Management
    SESSIONS: {
      CREATE: "/sessions/create",
      GET_ALL: "/sessions/user",
      LEARNER: {
        GET: "/sessions/learner",
      },
      TEACHER: {
        GET: "/sessions/teacher",
      },
      UPDATE_STATUS: (id) => `/sessions/${id}/status`,
      RESCHEDULE: (id) => `/sessions/${id}/reschedule`,
    },
    // Rating and Review
    RATING: {
      CREATE: "/ratings/create",
    },
    REVIEW: {
      CREATE: "/reviews/create",
      STATS: (listingId) => `/reviews/average/${listingId}`,
    },
  },
}

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Export individual parts for convenience
export const API_BASE_URL = API_CONFIG.BASE_URL
export const API_ENDPOINTS = API_CONFIG.ENDPOINTS

// --- Session API helpers ---
import axios from "axios"

// role: 'learner' or 'teacher'
export async function getSessionsByRole(role) {
  let endpoint
  if (role === "learner") {
    endpoint = API_ENDPOINTS.SESSIONS.LEARNER.GET
  } else if (role === "teacher") {
    endpoint = API_ENDPOINTS.SESSIONS.TEACHER.GET
  } else {
    endpoint = API_ENDPOINTS.SESSIONS.GET_ALL
  }
  const res = await axios.get(buildApiUrl(endpoint), { withCredentials: true })
  // If your backend returns { sessions: [...] }
  return res.data.sessions || []
}

export async function updateSessionStatus(sessionId, status) {
  const endpoint = API_ENDPOINTS.SESSIONS.UPDATE_STATUS(sessionId)
  await axios.patch(buildApiUrl(endpoint), { status }, { withCredentials: true })
}

// Teacher sets/updates the meeting link (e.g. Zoom/Google Meet URL) for a session
export async function updateMeetingLink(sessionId, meetingLink) {
  const endpoint = `/sessions/${sessionId}/meeting-link`
  await axios.patch(buildApiUrl(endpoint), { meetingLink }, { withCredentials: true })
}

// Rating API helpers
export async function createRating(ratingData) {
  const endpoint = API_ENDPOINTS.RATING.CREATE
  const res = await axios.post(buildApiUrl(endpoint), ratingData, { withCredentials: true })
  return res.data
}

export async function createReview(reviewData) {
  const endpoint = API_ENDPOINTS.REVIEW.CREATE
  const res = await axios.post(buildApiUrl(endpoint), reviewData, { withCredentials: true })
  return res.data
}

// Export API config and helpers as named exports only (no default export)
export { API_CONFIG }
