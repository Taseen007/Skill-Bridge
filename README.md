# SkillBridge

## 🚀 Problem Statement

The rising demand for new skills is often met with:
- High costs of online courses.
- Lack of personalization.
- Loss of motivation due to rigid content delivery.
- Skilled individuals lacking an accessible platform to share their knowledge.

---

## 💡 Solution

SkillBridge bridges this gap by providing:
- A **community-driven marketplace** for teachers and learners.
- **Affordable, flexible, and personalized** learning experiences.
- **Real-time connections** through live sessions.
- An ecosystem where teaching and learning are simplified and rewarding.

---

## 📚 Skills System

### Two Parallel Skill Systems

| Layer | Where Stored | Access Method | Use Case |
|-------|--------------|---------------|----------|
| **Basic Skill Tags** | `User.profile.skills` (string array) | Profile → Edit → comma-separated input | Quick tag cloud on profile (any role can edit) |
| **Detailed Skill Records** | `Skill` model (separate collection) | `/skills/add` route (AddSkills form) OR Profile → "Add New Skill" button (visible only if `role === 'teacher'`) | **Required** before a teacher can create a paid SkillListing |

### Flow for a Teacher to Offer a Skill

```
Register/Sign In as "teacher"
       ↓
Go to Profile → "Skills & Expertise" section → click "Add New Skill"
       ↓
Fill AddSkills form: name, description (50+ chars), category, tags[],
  proficiency level, years of experience
       ↓
Skill record created (linked via Skill.userID = teacher's ID)
       ↓
Go to /listings/add → "Add Listing"
       ↓
Pick the Skill from dropdown, set fee ($), total sessions,
  proficiency level, available time slots, listing image
       ↓
SkillListing published → discoverable on /skills page
```

---

## 🔑 Core Features

### 👤 User System
- Registration & login with **JWT authentication**
- **User roles**: Teacher / Learner
- **OAuth integration** (Google, GitHub, etc.)
- Profile management (bio, photo, location, skill tags)
- Personal dashboard to manage sessions, schedules, and chats

### 📚 Skill Listings & Discovery
- Categorized skill listings with filters and search
- Browse teachers by skill, rating, location, availability
- Detailed teacher profiles with experience, rates, and schedules
- **Two-tier skills system**: Quick profile tags + detailed verified skill records (see [Skills System](#-skills-system) above)

### 📅 Session Management
- Learners request **1-on-1 sessions**
- Teachers can accept, reject, or reschedule
- Track scheduled, pending, and past sessions
- Full audit of session status changes (pending → accepted → completed)

### 💬 Communication
- **Real-time chat** (Socket.io)
- In-app & email notifications for session updates

### ⭐ Ratings & Reviews
- Post-session reviews & star ratings
- Teacher profiles enhanced with student feedback
- Average rating auto-computed on SkillListing

---

## 🛠️ Tech Stack

This project is built using the **MERN stack**:
- **MongoDB** – Database
- **Express.js** – Backend framework
- **React.js** – Frontend framework
- **Node.js** – Server environment

**Libraries in use:**
- Backend: bcryptjs, cloudinary, JWT, mongoose, multer, nodemailer, passport (OAuth), socket.io
- Frontend: Redux Toolkit, Axios, React Router v7, Tailwind CSS, socket.io-client, lucide-react, sonner (toasts)

---

## ⚙️ Getting Started

Follow these steps to run the project locally:

### 1. Clone the repository
```bash
git clone https://github.com/your-username/SkillBridge.git
cd SkillBridge

# For backend
cd backend
npm install

# For frontend
cd frontend
npm install
```

### 2. Environment Setup
- Copy `backend/.env.example` → `backend/.env`
- Fill in: MongoDB URI, JWT SECRET_KEY, Cloudinary keys, Google/GitHub OAuth credentials, email SMTP settings, CLIENT_URL

### 3. Run
```bash
# Terminal 1 - Backend (runs on port 3000)
cd backend
npm run dev

# Terminal 2 - Frontend (runs on port 5173)
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📁 Project Structure Summary

```
skillbridge/
├── backend/
│   ├── controllers/      # Business logic (10 controllers)
│   ├── middlewares/      # isAuthenticated (JWT), multer (upload)
│   ├── models/           # 9 Mongoose schemas
│   ├── routes/           # 8 route files
│   ├── utils/            # db, cloudinary, email, passport, realtime (socket.io)
│   └── index.js
└── frontend/src/
    ├── components/
    │   ├── components/   # Reusable feature components (AddSkills, SkillCard, etc.)
    │   ├── pages/        # Route-level pages (Auth, Chat, General, Notifications, Rating, Sessions, Skills)
    │   ├── shared/       # Navbar, Footer
    │   └── ui/           # shadcn-style primitives
    ├── config/           # api.js endpoints
    ├── redux/            # authSlice, chatSlice, messageSlice, store
    └── App.jsx           # Router
```
