import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button"; 
import { useSelector } from "react-redux";
import {
  Sparkles,
  ShieldCheck,
  Users,
  BookOpen,
  Zap,
  Clock,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";

import { getSessionsByRole } from "@/config/api";


// Build a local Date from separate date/time strings (Safari-safe)
const buildLocalDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const d =
    typeof dateStr === "string" && dateStr.length > 10
      ? new Date(dateStr).toISOString().slice(0, 10)
      : dateStr;
  const dt = new Date(`${d}T${timeStr}`); // local time (not UTC)
  return isNaN(dt.getTime()) ? null : dt;
};

// ---------- Live next-session card (hero-sized, centered) ----------
const NextSessionCard = () => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = React.useState(true);
  const [nextSession, setNextSession] = React.useState(null);

  React.useEffect(() => {
    const run = async () => {
      if (!user) return setLoading(false);
      try {
        const role = user.role === "teacher" ? "teacher" : "learner";
        const resp = await getSessionsByRole(role);
        const sessions = Array.isArray(resp) ? resp : resp.sessions || [];
        const now = new Date();

        const resolveWhen = (s) => {
          if (s.status === "accepted" && s.scheduledTime) {
            const at = new Date(s.scheduledTime);
            return { at: isNaN(at.getTime()) ? null : at, label: "accepted" };
          }
          if (s.status === "rescheduled" && s.rescheduleRequest) {
            const at = buildLocalDate(
              s.rescheduleRequest.newDate,
              s.rescheduleRequest.newTime
            );
            return { at, label: "proposed" };
          }
          return { at: null, label: "accepted" };
        };

        const upcoming = sessions
          .map((s) => ({ s, ...resolveWhen(s) }))
          .filter((x) => x.at && x.at > now)
          .sort((a, b) => {
            const t = a.at.getTime() - b.at.getTime();
            if (t !== 0) return t;
            return a.label === "accepted" ? -1 : 1; // accepted first
          });

        setNextSession(upcoming[0] || null);
      } catch (e) {
        console.error("Failed to load next session:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  if (loading || !nextSession) return null;

  const { s, at, label } = nextSession;
  const formatted = at.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const title = s.skillName || s.skillListingID?.title || "Session";
  const counterpart =
    (s?.learnerID?.fullname || s?.teacherID?.fullname || "").trim() || "N/A";
  const withinHour = Math.abs(at.getTime() - Date.now()) <= 60 * 60 * 1000;

  return (
    <div
      className="
        mx-auto w-[min(640px,92vw)]
        rounded-3xl border border-sky-200/70 bg-white/90 backdrop-blur
        shadow-[0_24px_70px_rgba(2,132,199,0.12)]
        p-6 md:p-7
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
            <CalendarClock className="h-4 w-4" />
            Next session
            {label === "proposed" && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold normal-case">
                proposed
              </span>
            )}
          </div>
          <div className="mt-1 text-sky-800 font-extrabold text-xl md:text-2xl">
            {formatted}
          </div>
        </div>

        {withinHour && (
          <Link to="/sessions">
            <Button className="h-9 px-4 rounded-xl">Join</Button>
          </Link>
        )}
      </div>

      <div className="mt-4">
        <div className="text-base md:text-lg font-semibold text-gray-900">
          “{title}”
        </div>
        <div className="mt-1 text-sm text-slate-600">With: {counterpart}</div>
      </div>
    </div>
  );
};

// ---------- Page ----------
const Home = () => {
  const user = useSelector((s) => s.auth.user);

  return (
    <div className="bg-gradient-to-br from-white via-sky-50 to-indigo-100 pb-4">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-4 md:px-10 lg:px-16 pt-16 md:pt-20 pb-8 md:pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          {/* LEFT: copy */}
          <div
            className="md:col-span-7 text-center md:text-left"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Built for serious learners & mentors
            </span>

            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              <span className="text-gray-900">Empower Your </span>
              <span className="text-[#4B4BFF]">Learning</span>
              <br />
              <span className="text-gray-900">With the Future of </span>
              <span className="text-[#007ACC]">Knowledge</span>
              <br />
              <span className="text-[#00AEEF]">Sharing</span>
            </h1>

            <p className="mt-5 max-w-2xl text-gray-600 text-lg">
              A modern platform connecting learners and teachers through clear
              goals, effortless scheduling, and seamless sessions.
            </p>

            {!user && (
              <div className="mt-8 flex flex-wrap gap-3 md:gap-4 md:justify-start justify-center">
                <Link to="/signup">
                  <Button className="px-6 py-6 text-base md:text-lg font-semibold rounded-2xl shadow-md hover:-translate-y-0.5 transition">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* trust stats */}
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" /> 10k+ learners
              </span>
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-sky-500" /> 800+ mentors
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified &
                safe
              </span>
            </div>
          </div>

          {/* RIGHT: live next-session — centered beside the title */}
          <aside
            className="md:col-span-5 md:self-center md:pl-0 flex justify-center"
          >
            <NextSessionCard />
          </aside>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 md:px-10 lg:px-16 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              title: "Interactive Learning",
              desc:
                "Engage with mentors and peers using dynamic tools and real-time collaboration.",
              icon: <Sparkles className="h-6 w-6 text-indigo-600" />,
            },
            {
              title: "Seamless Experience",
              desc:
                "A beautifully crafted interface that keeps you focused on growth.",
              icon: <Sparkles className="h-6 w-6 text-emerald-600" />,
            },
            {
              title: "Outcome-driven",
              desc:
                "Set clear objectives and track progress after each session.",
              icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-white to-white shadow-xl hover:shadow-2xl transition"
            >
              <div className="relative rounded-2xl bg-white/70 backdrop-blur border border-indigo-100 p-6">
                <div className="mb-3 inline-flex rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-3">
                  {f.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm md:text-base text-gray-600">
                  {f.desc}
                </p>
                <span className="mt-4 block h-[2px] w-10 bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 rounded-full opacity-60 transition-all group-hover:w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
