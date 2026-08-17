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

## 🔍 Project Architecture & Analysis

### Backend Structure (MERN Stack)

**API Base URL:** `http://localhost:3000/api/v1`

| Module | File | Purpose |
|--------|------|---------|
| Server | [index.js](file:///f:/Swapit/swapit/backend/index.js#L1-L109) | Express + Socket.io server, route mounting, CORS, JWT socket auth |
| Auth Routes | [user.route.js](file:///f:/Swapit/swapit/backend/routes/user.route.js#L1-L32) | Register, login, logout, OAuth (Google/GitHub), profile update, get user |
| Skills Routes | [skillRoutes.js](file:///f:/Swapit/swapit/backend/routes/skillRoutes.js#L1-L13) | CRUD for detailed teacher skills |
| Listing Routes | [listingRoutes.js](file:///f:/Swapit/swapit/backend/routes/listingRoutes.js#L1-L23) | Skill listings (teacher offerings with fee/slots) |
| Session Routes | [sessionRoutes.js](file:///f:/Swapit/swapit/backend/routes/sessionRoutes.js#L1-L14) | Session booking, accept/reject, reschedule, status |
| Rating Routes | [ratingRoutes.js](file:///f:/Swapit/swapit/backend/routes/ratingRoutes.js#L1-L31) | Star ratings (1-5) on listings by learners |
| Review Routes | [reviewRoutes.js](file:///f:/Swapit/swapit/backend/routes/reviewRoutes.js#L1-L33) | Text reviews + ratings on listings |
| Chat Routes | [chatRoutes.js](file:///f:/Swapit/swapit/backend/routes/chatRoutes.js) | 1-on-1 chat threads & messages (Socket.io real-time) |
| Notification Routes | [notificationRoutes.js](file:///f:/Swapit/swapit/backend/routes/notificationRoutes.js) | In-app notifications (session, chat events) + email |

### Database Models (MongoDB)

| Model | File | Core Fields |
|-------|------|-------------|
| **User** | [user.model.js](file:///f:/Swapit/swapit/backend/models/user.model.js#L1-L37) | `fullname`, `email`, `phoneNumber`, `password`, **`role`** (teacher/learner), `authProvider` (local/google/github), `profile` { bio, skills[], location, profilePhoto } |
| **Skill** | [skills.js](file:///f:/Swapit/swapit/backend/models/skills.js#L1-L46) | `userID` (teacher), `name`, `description`, `category`, `tags[]`, **`level`** (Beginner/Intermediate/Advanced), `experience` (years) |
| **SkillListing** | [skillListing.js](file:///f:/Swapit/swapit/backend/models/skillListing.js#L1-L52) | `title`, `teacherID`, `skillID`, `description`, **`fee`**, `totalSessions`, `proficiency`, `avgRating`, `listingImgURL`, `availableSlots[]` |
| **Session** | [session.js](file:///f:/Swapit/swapit/backend/models/session.js#L1-L56) | `learnerID`, `teacherID`, `skillListingID`, `scheduledTime`, `skillName`, `price`, **`status`** (pending/accepted/rejected/rescheduled/cancelled/completed), `note`, `rescheduleRequest` |
| **Rating** | [rating.js](file:///f:/Swapit/swapit/backend/models/rating.js#L1-L23) | `learnerID`, `listingID`, `rating` (1-5) |
| **Review** | [review.js](file:///f:/Swapit/swapit/backend/models/review.js#L1-L29) | `learnerID`, `listingID`, `reviewText` (10-1000 chars), `rating` (1-5) |
| **Chat** | [chatModel.js](file:///f:/Swapit/swapit/backend/models/chatModel.js#L1-L22) | `users[]` (2 participants), `latestMessage` |
| **Message** | [messageModel.js](file:///f:/Swapit/swapit/backend/models/messageModel.js#L1-L13) | `sender`, `content`, `chat`, `readBy[]` |
| **Notification** | [notificationModel.js](file:///f:/Swapit/swapit/backend/models/notificationModel.js#L1-L12) | `recipient`, `sender`, `message`, `isRead`, `sessionId`, `relatedChat`, **`type`** (message/book_session/session_rescheduled/session_status) |

### Frontend Structure (React + Vite + Redux)

| Page / Component | File | Purpose |
|------------------|------|---------|
| App Router | [App.jsx](file:///f:/Swapit/swapit/frontend/src/App.jsx#L1-L85) | All route definitions |
| Navbar | [Navbar.jsx](file:///f:/Swapit/swapit/frontend/src/components/shared/Navbar.jsx#L1-L412) | Navigation + notifications dropdown + chat popup |
| Home | [Home.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/General/Home.jsx#L1-L247) | Hero, next-session card, feature highlights |
| Sign In / Sign Up | [SignIn.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Authentication/SignIn.jsx), [SignUp.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Authentication/Signup.jsx) | Email/password + OAuth buttons |
| Profile | [Profile.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/General/Profile.jsx#L1-L565) | **Teachers only**: Detailed skills section + "Add New Skill" button. Profile editing with basic skills (comma-separated tags) |
| Add Skill Form | [AddSkills.jsx](file:///f:/Swapit/swapit/frontend/src/components/components/AddSkills.jsx#L1-L513) | Full form: name, description (50+ chars), category, tags[], level, experience years |
| Skills Discovery | [SkillsDiscovery.jsx](file:///f:/Swapit/swapit/frontend/src/components/components/SkillsDiscovery.jsx) | Browse listings with tag/category filter sidebar |
| Add Listing | [AddListings.jsx](file:///f:/Swapit/swapit/frontend/src/components/components/AddListings.jsx) | Teachers create a paid offering from an existing Skill |
| Skill Details | [SkillDetails.jsx](file:///f:/Swapit/swapit/frontend/src/components/components/SkillDetails.jsx) | View listing, teacher info, reviews, book button |
| Session Booking | [SessionBookingForm.jsx](file:///f:/Swapit/swapit/frontend/src/components/components/SessionBookingForm.jsx) | Pick date/time from availableSlots, add note |
| Learner Sessions | [LearnerSessions.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Sessions/LearnerSessions.jsx) | View as learner: pending/upcoming/completed sessions, respond to reschedule |
| Teacher Sessions | [TeacherSessions.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Sessions/TeacherSessions.jsx) | View as teacher: accept/reject, propose reschedule, mark complete |
| Rating + Review | [RatingReviewPage.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Rating/RatingReviewPage.jsx) | Rate & review a completed session |
| Chat Popup | [ChatBox.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Chat/ChatBox.jsx) | Real-time 1-on-1 messaging (Socket.io) |
| Notifications | [NotificationPage.jsx](file:///f:/Swapit/swapit/frontend/src/components/pages/Notifications/NotificationPage.jsx) | Full notifications history |

---

## 📚 Skills System (How to Add Skills - Already Implemented)

**YES, the platform already has skill-adding functionality — but it is teacher-only and somewhat hidden in the UX flow.**

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

### Current Gaps in Skills UX

1. **Not visible in main nav.** No navbar link to "Add Skill" — users must dig into Profile.
2. **Teacher-only lock.** The `Skill` model CRUD is usable by any authenticated user (the controller only checks `req.user.userId` matches `Skill.userID`), but the frontend buttons + profile section are gated by `user.role === 'teacher'`. A learner who also wants to teach something cannot easily cross over.
3. **No verification.** Skill experience/level is self-reported with zero validation.
4. **Basic profile skills (comma-separated) vs. detailed Skill records** are not cross-synced. A teacher adding a detailed Skill does not auto-populate `profile.skills[]`.

---

## 🧩 Logically Missing Features (Recommended Roadmap)

Below is a prioritized list of what a complete peer-to-peer skill exchange platform should add, given the current foundation (login/signup + session booking + chat + ratings is the MVP backbone; these are the next logical layers).

### 🔴 Priority 1 — Critical for a Functional Marketplace

#### 1. Role Flexibility (Dual-Role Users)
**Why:** The current `role: teacher | learner` enum is binary and unrealistic. A guitar teacher who wants to learn React must create two accounts.
**What to add:**
- Replace `role` enum with `roles: ['teacher', 'learner']` array (or just remove role gating on frontend actions).
- Navbar shows both "Teach" and "Learn" sections for every logged-in user.
- Session + SkillListing permission checks already use IDs, so no backend breakage.

#### 2. Payment & Transaction Flow
**Why:** `SkillListing.fee` and `Session.price` exist but no money ever changes hands. A marketplace without payments is just a scheduling demo.
**What to add:**
- **Model:** `Transaction` { sessionId, learnerID, teacherID, amount, status (pending/paid/refunded), paymentProvider, stripePaymentId, createdAt, paidAt, refundedAt }
- **Routes:** `/api/v1/payments/create-session-intent`, `/api/v1/payments/webhook`, `/api/v1/payments/history`
- **Integration:** Stripe Checkout or Razorpay.
- Hold payment in escrow; release to teacher only after session is marked "completed" + 24-hour dispute window.

#### 3. Learner Learning Goals & Dashboard
**Why:** Learners have zero way to track what they are learning. A "/sessions/learner" list is not a dashboard.
**What to add:**
- **Model:** `LearningGoal` { learnerID, skillNameOrId, targetLevel, targetDate, status (active/achieved/dropped), milestones[] }
- **Routes:** `/api/v1/goals CRUD`
- **Frontend:** New Dashboard page (replace bare Home for logged-in users) with:
  - Upcoming sessions with countdown
  - Active goals with progress bars
  - Number of hours/past sessions learned
  - "Skills I'm Learning" cards (group sessions by skill)

### 🟠 Priority 2 — Trust & Quality

#### 4. Teacher Skill Verification & Credibility Badges
**Why:** Anybody can claim "10 years of Advanced Rocket Science" — zero checks.
**What to add:**
- Add to `User` model: `verification: { emailVerified: bool, identityVerified: bool, skillsVerified: [{ skillId, status: pending/verified/rejected, evidenceUrls[], verifierNotes }] }`
- Add to `Skill` model: `portfolioLinks[]`, `certificateImageUrls[]`, `verificationStatus: 'unverified' | 'pending' | 'verified'`
- Frontend: Upload form for certificates/portfolio. Blue "✓ Verified" badge on Skill cards.
- Simple rule-based route: `/api/v1/skills/:id/submit-verification`

#### 5. Session Materials & Post-Session Follow-Up
**Why:** After a session completes, there's no shared notes, homework, or resources.
**What to add:**
- **Model:** `SessionMaterial` { sessionId, uploadedBy (teacher/learner), title, type (note/file/link), contentUrl, description }
- **Routes:** `/api/v1/sessions/:id/materials CRUD`
- Session details page: "Materials" tab (upload file via Cloudinary, add links, meeting recording URL)
- Auto-email both parties 15 minutes before session with links + reminder

#### 6. Search & Advanced Filtering
**Why:** The current `/skills` discovery page has tag/category filters but no search box or sort.
**What to add:**
- Search input (query `SkillListing.title`, `description`, and `Skill.tags`/`name`)
- Filters: price range slider, min rating, level dropdown, teacher location (if provided)
- Sort by: Popularity (most sessions), Newest, Price: Low to High, Price: High to Low, Top Rated
- Backend: update `getAllSkillListings` to accept `?search=&minFee=&maxFee=&minRating=&category=&level=&sort=` params with MongoDB `$regex`, `$gte/$lte`, `$sort`

### 🟡 Priority 3 — Engagement & Retention

#### 7. Wishlist / Saved Listings
**Why:** Learners often browse now but book later.
**What to add:**
- **Model:** `Wishlist` { learnerID, listingIDs[] } or add `savedListings[]` to User model
- **Routes:** POST/DELETE `/api/v1/listings/:id/save`, GET `/api/v1/listings/saved`
- Heart icon on SkillCard; a dedicated "Saved" tab/page

#### 8. Session Completion Certificates
**Why:** Gives learners a sense of achievement; teachers get a portfolio piece.
**What to add:**
- After `totalSessions` count reached for a listing, auto-generate PDF certificate (use `pdfkit` or `html2pdf.js`)
- **Model:** `Certificate` { learnerID, teacherID, listingID, issuedAt, certificateUrl, uniqueId }
- Certificate page (public URL) shareable on LinkedIn

#### 9. Teacher Analytics Dashboard
**Why:** Teachers have no visibility into their performance or earnings.
**What to add:**
- Stats cards: Total earnings (sum of completed sessions × fee), Total students, Session completion rate, Average rating over time, # cancelled
- Chart (recharts): Monthly bookings line chart, Top skills bar chart
- Filter by date range

#### 10. Notification Preferences
**Why:** All users get all events with no opt-out; email utility already exists but preferences don't.
**What to add:**
- Add to User model: `notificationPreferences: { emailSessionUpdates: bool, emailNewMessages: bool, inAppAll: bool, marketingEmails: bool }`
- Settings page toggles; guard clauses in `sendNotificationEmail()` and notification creation

### 🟢 Priority 4 — Platform Maturity

#### 11. Moderation & Reporting
- **Model:** `Report` { reporterID, reportedType (User/Session/Listing/Review), reportedId, reason, details, status (open/resolved), actionTaken }
- Routes to file report; a basic moderation page (admin-only)

#### 12. Referral & Rewards (Growth)
- Referral code per user; credits on signup + first completed session
- Credit wallet field on User model

#### 13. Proper Availability Calendar
- Replace `availableSlots: string[]` with per-date availability (`Availability` model with date + time blocks)
- Full calendar UI (react-big-calendar or datepicker grid) on listing creation

#### 14. Groups & Community Features
- **Model:** `CommunityPost`, `Comment` — a simple forum per skill category
- Group session bookings (multiple learners per session)

---

## 🗺️ Recommended Implementation Order

```
Phase 1 (MVP → Functional Platform)
  1. Dual-role system → remove teacher-only locks on AddSkills/AddListings
  2. Search + advanced filtering on /skills discovery
  3. Payment integration with escrow-style release
  4. Learner dashboard with goals & progress

Phase 2 (Trust & Quality)
  5. Skill verification badges + certificate upload
  6. Session materials upload & meeting reminders
  7. Teacher analytics dashboard
  8. Wishlist / saved listings

Phase 3 (Scale)
  9. Session completion certificates
 10. Notification preferences
 11. Moderation & reporting
 12. Calendar-based availability
 13. Community forum + group sessions
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
- **Two-tier skills system**: Quick profile tags + detailed verified skill records (see [Skills System](#-skills-system-how-to-add-skills---already-implemented) above)

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
