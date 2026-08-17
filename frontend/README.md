# SkillBridge

A peer-to-peer skill exchange platform where teachers can list skills they offer and learners can discover, book, and review sessions. Users can also hold both roles simultaneously.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Core Workflows](#core-workflows)
  - [Authentication](#authentication)
  - [Teacher Flow](#teacher-flow)
  - [Learner Flow](#learner-flow)
  - [Session Lifecycle](#session-lifecycle)
  - [Ratings and Reviews](#ratings-and-reviews)
  - [Real-time Chat](#real-time-chat)
  - [Notifications](#notifications)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Role System & Access Control](#role-system--access-control)
- [Frontend Architecture](#frontend-architecture)

---

## Project Overview

SkillBridge connects people who want to teach with people who want to learn. A teacher creates a **Skill** (their expertise record) and then publishes a **Skill Listing** (a bookable offering with a fee, schedule slots, and description). Learners browse listings, save favourites, book sessions, and leave ratings and reviews after completion.

---

## Tech Stack

### Backend
| Concern | Library |
|---|---|
| Server | Express 5 |
| Database | MongoDB via Mongoose |
| Auth | JWT (cookie + Bearer header), Passport.js (Google & GitHub OAuth) |
| File uploads | Multer + Cloudinary |
| Real-time | Socket.IO |
| Email | Nodemailer |
| Runtime | Node.js (ES Modules) |

### Frontend
| Concern | Library |
|---|---|
| UI framework | React 19 + Vite |
| Routing | React Router v7 |
| State | Redux Toolkit + React Redux |
| Styling | Tailwind CSS v4 |
| HTTP | Axios + Fetch API |
| Notifications | Sonner |
| Icons | Lucide React |
| Markdown | react-markdown |
| Real-time | Socket.IO Client |

---

## Project Structure

```
skillbridge/
├── backend/
│   ├── controllers/        # Business logic
│   │   ├── user.controller.js
│   │   ├── skillsController.js
│   │   ├── skillListingController.js
│   │   ├── sessionController.js
│   │   ├── ratingController.js
│   │   ├── reviewController.js
│   │   ├── chatController.js
│   │   ├── messageController.js
│   │   └── notificationController.js
│   ├── middlewares/
│   │   ├── isAuthenticated.js  # JWT verification
│   │   └── multer.js           # File upload handling
│   ├── models/                 # Mongoose schemas
│   │   ├── user.model.js
│   │   ├── skills.js
│   │   ├── skillListing.js
│   │   ├── session.js
│   │   ├── rating.js
│   │   ├── review.js
│   │   ├── chatModel.js
│   │   ├── messageModel.js
│   │   └── notificationModel.js
│   ├── routes/                 # Express routers
│   ├── utils/
│   │   ├── db.js               # MongoDB connection
│   │   ├── cloudinary.js       # Cloudinary config
│   │   ├── datauri.js          # Buffer → data URI
│   │   ├── email.js            # Nodemailer helper
│   │   ├── passport.js         # OAuth strategies
│   │   ├── realtime.js         # Socket.IO instance accessor
│   │   └── roleUtils.js        # canTeach / canLearn helpers
│   ├── .env.example
│   ├── index.js                # App entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # Routes + TeacherRoute guard
    │   ├── config/api.js       # All API endpoint constants
    │   ├── redux/authSlice.js  # User + notifications state
    │   ├── utils/roles.js      # canTeach / canLearn (frontend mirror)
    │   ├── components/
    │   │   ├── shared/
    │   │   │   ├── Navbar.jsx
    │   │   │   └── Footer.jsx
    │   │   ├── components/     # Real implementations
    │   │   │   ├── AddSkills.jsx
    │   │   │   ├── AddListings.jsx
    │   │   │   ├── EditListings.jsx
    │   │   │   ├── SkillsDiscovery.jsx
    │   │   │   ├── SkillCard.jsx
    │   │   │   ├── SkillDetails.jsx
    │   │   │   ├── SkillCategories.jsx
    │   │   │   ├── FilterSidebar.jsx
    │   │   │   ├── SessionBookingForm.jsx
    │   │   │   └── MarkdownRenderer.jsx
    │   │   └── pages/          # Route-level page wrappers
    │   │       ├── Authentication/
    │   │       ├── Chat/
    │   │       ├── General/
    │   │       ├── Notifications/
    │   │       ├── Rating/
    │   │       ├── Sessions/
    │   │       └── Skills/
    └── package.json
```

> The `components/pages/` files are thin route wrappers — they add a page-level container and delegate rendering to the actual component in `components/components/`.

---

## User Roles

| Role | Can do |
|---|---|
| `learner` (default) | Browse listings, save listings, book sessions, rate and review teachers |
| `teacher` | Everything a learner can do, plus: create Skills, create/edit/delete Skill Listings, accept or reject session bookings |
| `both` | All capabilities of both roles simultaneously |

Role is stored on the User document and enforced in two places:
- **Backend** — `canTeach()` / `canLearn()` helpers in `roleUtils.js`, called inside controllers
- **Frontend** — `TeacherRoute` guard in `App.jsx` redirects non-teachers away from teacher-only routes; component-level guards in `AddSkills` and `AddListings` provide a second layer

Users can self-upgrade their role at any time from the profile dropdown (no admin approval required).

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A Cloudinary account (for profile photo and listing image uploads)
- (Optional) Google and/or GitHub OAuth app credentials

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in the values:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/skillbridge
SECRET_KEY=replace-with-a-long-random-secret

# Cloudinary
CLOUD_NAME=
API_KEY=
API_SECRET=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/user/oauth/google/callback

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/user/oauth/github/callback

# SMTP email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

### Running the Backend

```bash
cd backend
npm install
npm run dev      # nodemon watches for changes
```

The server starts on `http://localhost:3000`.

### Running the Frontend

```bash
cd frontend
npm install
npm run dev      # Vite dev server with HMR
```

The app opens at `http://localhost:5173`.

---

## Core Workflows

### Authentication

**Local signup**
1. User fills in name, email, phone, password, and selects a role (`learner` / `teacher` / `both`), and uploads a profile photo.
2. `POST /api/v1/user/register` — password is bcrypt-hashed, photo is uploaded to Cloudinary.
3. User then signs in via `POST /api/v1/user/login` — a JWT is issued as an `httpOnly` cookie and also returned in the response body (stored in `localStorage` for Bearer header use).

**OAuth (Google / GitHub)**
1. User clicks "Sign in with Google" or "Sign in with GitHub".
2. Browser is redirected to the provider's consent screen via `GET /api/v1/user/oauth/google` (or `/github`).
3. On success the backend callback mints a JWT cookie and redirects to `/oauth/callback?token=...` on the frontend.
4. `OAuthCallback.jsx` extracts the token, fetches the user profile, stores both in Redux and `localStorage`.

**Session persistence**
On app load, `App.jsx` reads `user` and `token` from `localStorage` and rehydrates Redux state so the user stays logged in across page refreshes.

**Logout**
`GET /api/v1/user/logout` clears the cookie. The frontend clears `localStorage` and Redux state.

---

### Teacher Flow

#### 1. Add a Skill

> A Skill is the teacher's expertise record — it must exist before a listing can reference it.

1. Navigate to **Skills → Add Skill** (visible in the navbar only for `teacher` / `both` users).
2. Fill in: name, description, category, skill level (Beginner / Intermediate / Advanced), years of experience, and tags.
3. Submit → `POST /api/v1/skills/create`.
4. The backend checks `canTeach(user.role)`, saves the Skill document, and syncs the skill name into `user.profile.skills[]` (a denormalized cache used on profile pages).
5. On success the teacher is redirected to `/skills`.

#### 2. Create a Listing

> A Skill Listing is the public, bookable offering that learners see on the Skills page.

1. Navigate to **Skills → Create Listing**.
2. Complete the 4-step form:
   - **Step 1 — Basic Info**: title, description (Markdown supported), total number of sessions.
   - **Step 2 — Skill & Proficiency**: pick one of your existing Skills from the dropdown, choose proficiency level.
   - **Step 3 — Pricing & Image**: set the fee, provide a listing image URL, add available time slots (must be at least 1 hour apart), and add payment method details.
   - **Step 4 — Review**: preview everything before submitting.
3. Submit → `POST /api/v1/listings/create`.
4. The backend re-checks `canTeach`, verifies the chosen skill belongs to the requesting teacher, and saves the listing.
5. The listing is immediately visible on the public `/skills` discovery page.

#### 3. Manage Listings

- **Edit**: navigate to a listing and click Edit → `PUT /api/v1/listings/update/:id`. Only the owning teacher can update; role is re-verified on every update.
- **Delete**: `DELETE /api/v1/listings/delete/:id`. Ownership check only (role already verified at creation).

#### 4. Manage Sessions

- View incoming bookings at `/sessions/teacher`.
- Accept or reject a pending session → `PATCH /api/v1/sessions/:sessionId/status`.
- Propose a reschedule → `PATCH /api/v1/sessions/:sessionId/propose-reschedule`.

---

### Learner Flow

#### 1. Discover Skills

- The `/skills` page is **publicly accessible** — no login required to browse.
- `SkillsDiscovery` calls `GET /api/v1/listings/all` with optional query params:

| Param | Effect |
|---|---|
| `search` | Regex match on skill name, tags |
| `category` | Filter by skill category |
| `minFee` / `maxFee` | Fee range |
| `minRating` | Minimum average rating |
| `level` | Beginner / Intermediate / Advanced |
| `sort` | `newest`, `popular`, `rating`, `price_asc`, `price_desc` |

- Additional client-side filters (location, available now, max price slider) are applied after the server response.
- The category pill bar is populated from `GET /api/v1/listings/tags` (also public).

#### 2. Save a Listing

- Click the heart icon on any card → `POST /api/v1/listings/save/:id` (requires login).
- View saved listings via the **Saved** tab on the Skills page or the **Saved** nav link → `GET /api/v1/listings/saved/list`.

#### 3. Book a Session

1. Open a listing detail page → click **Book Session**.
2. `SessionBookingForm` lets the learner pick an available slot, add a note, and confirm.
3. Submit → `POST /api/v1/sessions/create`.
4. The teacher receives a real-time notification via Socket.IO.
5. The learner can track the session status at `/sessions/learner`.

#### 4. Respond to a Reschedule

- If the teacher proposes a new time, the learner can accept or reject it → `PATCH /api/v1/sessions/:sessionId/respond-reschedule`.

---

### Session Lifecycle

```
pending  →  accepted  →  completed
         ↘  rejected
         ↘  rescheduled (teacher proposes) → learner accepts/rejects
         ↘  cancelled
```

Status transitions are enforced in `sessionController.js`. Notifications are fired on every status change via `notificationController.js` and delivered in real time through Socket.IO.

---

### Ratings and Reviews

After a session reaches `completed` status:

- **Learner rates the teacher** → `POST /api/v1/ratings/create` (numeric score).
- **Learner writes a review** → `POST /api/v1/reviews/create` (text + implicit rating).
- Average rating per listing is computed via `GET /api/v1/ratings/average/:listingId` and displayed on listing cards.
- Teachers can view all reviews they've received at `/profile/reviews`.
- Learners can view their own submitted ratings at `/profile/ratings-reviews`.

---

### Real-time Chat

- Any logged-in user can message a teacher directly from a listing card or from a notification.
- Clicking the message button creates or retrieves a chat room via `POST /api/v1/chat/chat`.
- Messages are sent through Socket.IO (`chat:join`, `chat:message`) and persisted to MongoDB via `messageController.js`.
- The `ChatBox` component is a floating overlay accessible from both the Skills page and the Navbar notification panel.

---

### Notifications

- The Navbar polls `GET /api/v1/notification/get` every 5 seconds.
- Notifications are also pushed in real time over Socket.IO.
- Clicking a notification navigates to the relevant page (session view, chat, etc.).
- All notifications are marked read via `PATCH /api/v1/notification/mark-as-read`.
- The full notification list is at `/notifications`.

---

## API Reference

All routes are prefixed with `/api/v1`.

### User — `/user`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register with email/password + profile photo upload |
| POST | `/login` | — | Login, returns JWT cookie + token |
| GET | `/logout` | — | Clears JWT cookie |
| POST | `/profile/update` | ✅ | Update profile fields + optional photo |
| PATCH | `/profile/upgrade-role` | ✅ | Change own role to `learner`, `teacher`, or `both` |
| GET | `/oauth/google` | — | Start Google OAuth flow |
| GET | `/oauth/google/callback` | — | Google OAuth callback |
| GET | `/oauth/github` | — | Start GitHub OAuth flow |
| GET | `/oauth/github/callback` | — | GitHub OAuth callback |
| GET | `/:id` | ✅ | Get any user's public profile |

### Skills — `/skills`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create` | ✅ | teacher/both | Create a new skill |
| PUT | `/update/:skillId` | ✅ | teacher/both | Update own skill |
| DELETE | `/delete/:skillId` | ✅ | teacher/both | Delete own skill |
| GET | `/all` | ✅ | any | Get current user's skills |
| GET | `/user/:userId` | — | — | Get all skills for a specific user (public) |
| GET | `/single/:skillId` | ✅ | any | Get one skill by ID |

### Listings — `/listings`

| Method | Path | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/create` | ✅ | teacher/both | Create a listing |
| PUT | `/update/:id` | ✅ | teacher/both | Update own listing |
| DELETE | `/delete/:id` | ✅ | owner | Delete own listing |
| GET | `/all` | — | — | Browse all listings (public, with filters) |
| GET | `/single/:id` | — | — | Get one listing (public) |
| GET | `/tags` | — | — | Get all unique tags (public) |
| GET | `/teacher/:teacherId` | ✅ | any | Get listings by teacher |
| GET | `/tag/:tag` | ✅ | any | Get listings by tag |
| POST | `/save/:id` | ✅ | any | Toggle save/unsave a listing |
| GET | `/save/check/:id` | ✅ | any | Check if a listing is saved |
| GET | `/saved/list` | ✅ | any | Get current user's saved listings |

### Sessions — `/sessions`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | ✅ | Book a session |
| GET | `/learner` | ✅ | Get sessions where current user is learner |
| GET | `/teacher` | ✅ | Get sessions where current user is teacher |
| PATCH | `/:sessionId/status` | ✅ | Update session status |
| PATCH | `/:sessionId/propose-reschedule` | ✅ | Teacher proposes a new time |
| PATCH | `/:sessionId/respond-reschedule` | ✅ | Learner accepts or rejects reschedule |
| GET | `/:skillListingID/status` | ✅ | Get session status for a listing |

### Ratings — `/ratings`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | ✅ | Submit a rating |
| PUT | `/update/:id` | ✅ | Update own rating |
| DELETE | `/delete/:id` | ✅ | Delete own rating |
| GET | `/average/:listingId` | ✅ | Average rating for a listing |
| GET | `/listing/:listingId` | ✅ | All ratings for a listing |
| GET | `/user/my-ratings` | ✅ | Current user's submitted ratings |
| GET | `/user/:userId` | ✅ | Ratings by user ID |
| GET | `/learner/:learnerId` | ✅ | Ratings given by a learner |

### Reviews — `/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/create` | ✅ | Submit a review |
| PUT | `/update/:id` | ✅ | Update own review |
| DELETE | `/delete/:id` | ✅ | Delete own review |
| GET | `/listing/:listingId` | ✅ | All reviews for a listing |
| GET | `/average/:listingId` | ✅ | Average rating from reviews for a listing |
| GET | `/user/my-reviews` | ✅ | Current user's submitted reviews |
| GET | `/user/my-received-reviews` | ✅ | Reviews received as a teacher |
| GET | `/user/:userId` | ✅ | Reviews by user ID |
| GET | `/:id` | ✅ | Single review by ID |

### Chat — `/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/chat` | ✅ | Create or retrieve a chat room |
| GET | `/chats` | ✅ | List all chat rooms for current user |
| GET | `/:chatId/messages` | ✅ | Get messages in a chat room |

### Notifications — `/notification`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/get` | ✅ | Get all notifications for current user |
| PATCH | `/mark-as-read` | ✅ | Mark all notifications as read |

---

## Data Models

### User
```
_id, fullname, email, phoneNumber, password (hashed),
role: 'learner' | 'teacher' | 'both',
authProvider: 'local' | 'google' | 'github',
profile: { bio, skills[], location, profilePhoto },
savedListings: [SkillListing ref]
```

### Skill
```
_id, userID (→ User), name, description, category,
tags[], level: 'Beginner'|'Intermediate'|'Advanced',
experience (years)
```

### SkillListing
```
_id, title, teacherID (→ User), skillID (→ Skill),
description (Markdown), fee, totalSessions, proficiency,
avgRating, listingImgURL, availableSlots[]
```

### Session
```
_id, learnerID (→ User), teacherID (→ User),
skillListingID (→ SkillListing), scheduledTime,
skillName, price,
status: 'pending'|'accepted'|'rejected'|'rescheduled'|'cancelled'|'completed',
note, rescheduleRequest: { newDate, newTime, newDuration, newTimeZone }
```

### Rating
```
_id, learnerID (→ User), teacherID (→ User),
listingID (→ SkillListing), score, sessionID (→ Session)
```

### Review
```
_id, reviewerID (→ User), teacherID (→ User),
listingID (→ SkillListing), content, rating, sessionID (→ Session)
```

---

## Role System & Access Control

### How roles are checked

**Backend** (`backend/utils/roleUtils.js`):
```js
export const canTeach = (role) => role === 'teacher' || role === 'both';
export const canLearn = (role) => role === 'learner' || role === 'both';
```
Called inside controllers before any write operation that requires a teacher.

**Frontend** (`frontend/src/utils/roles.js`):
```js
export const canTeach = (role) => role === 'teacher' || role === 'both';
export const canLearn = (role) => role === 'learner' || role === 'both';
```

### Three-layer protection for teacher-only pages

1. **Navbar** — the "Add Skill" and "Add Listing" buttons are only rendered when `canTeach(user.role)` is true.
2. **Route guard** — `TeacherRoute` in `App.jsx` redirects unauthenticated users to `/signin` and learners to `/skills` before the component mounts.
3. **Component guard** — `AddSkills` and `AddListings` perform their own role check and render a blocking message if the role condition is not met (safety net for stale Redux state or direct URL access).

---

## Frontend Architecture

### State management

Redux store has a single `auth` slice:
```js
{ loading, user, notifications }
```
`user` is persisted to `localStorage` and rehydrated on app load. `notifications` are fetched on mount and updated by polling + Socket.IO push.

### API configuration

All endpoint paths are defined once in `src/config/api.js` and imported wherever needed. The base URL defaults to `http://localhost:3000/api/v1`.

### Route structure

| Path | Component | Access |
|---|---|---|
| `/` | `Home` | Public |
| `/skills` | `SkillsDiscovery` | Public |
| `/skills/:id` | `SkillDetails` | Public |
| `/skills/add` | `AddSkills` | Teacher only |
| `/listings/add` | `AddListings` | Teacher only |
| `/edit-listing/:id` | `EditListings` | Teacher only |
| `/profile` | `Profile` | Logged in |
| `/profile/:id` | `UserProfile` | Logged in |
| `/sessions/learner` | `LearnerSessions` | Logged in |
| `/sessions/teacher` | `TeacherSessions` | Logged in |
| `/book-session/:skillId` | `SessionBookingForm` | Logged in |
| `/rating/:skillListingID` | `RatingReviewPage` | Logged in |
| `/notifications` | `NotificationPage` | Logged in |
| `/signin` | `SignIn` | Public |
| `/signup` | `SignUp` | Public |
| `/oauth/callback` | `OAuthCallback` | Public |
