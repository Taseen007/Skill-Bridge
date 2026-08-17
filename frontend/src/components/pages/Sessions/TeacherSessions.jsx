// src/components/pages/Sessions/TeacherSessions.jsx
"use client";

import { useEffect, useState } from "react";
import {
  getSessionsByRole,
  updateSessionStatus,
  proposeSessionReschedule,
  updateMeetingLink,
} from "../../../config/api";
import { getSkillListingById } from "../../../config/skillListing";
import axios from "axios";

import { groupSessionsByStatus, STATUS_ORDER } from "../../../lib/sessionUtils";

const iconFor = (status) => {
  switch (status) {
    case "accepted":
      // check-circle
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
        </svg>
      );
    case "pending":
      // hourglass
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2h12M6 22h12M8 2v5a4 4 0 004 4 4 4 0 004-4V2M8 22v-5a4 4 0 014-4 4 4 0 014 4v5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "rejected":
      // x-circle
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "rescheduled":
      // calendar-clock
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2v4M16 2v4M3 9h18M21 9v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.5 16.5H13v-3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "completed":
      // flag
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 21V6m0 0s2-2 6-2 6 2 6 2 2-2 4-2v11s-2-2-6-2-6 2-6 2-2-2-4-2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    default:
      // dot
      return <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />;
  }
};

const TeacherSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [rescheduleData, setRescheduleData] = useState({});
  const [availableSlotsMap, setAvailableSlotsMap] = useState({});
  const [expandedSessions, setExpandedSessions] = useState({});
  const [meetingLinkInputs, setMeetingLinkInputs] = useState({});

  const fetchSessions = async () => {
    try {
      const response = await getSessionsByRole("teacher");
      const sessionsArray = Array.isArray(response) ? response : response.sessions || [];
      setSessions(sessionsArray);

      const uniqueListingIds = [...new Set(sessionsArray.map((s) => s.skillListingID?._id).filter(Boolean))];
      const slotsMap = {};
      await Promise.all(
        uniqueListingIds.map(async (id) => {
          try {
            const listing = await getSkillListingById(id);
            slotsMap[id] = listing.availableSlots || [];
          } catch {
            slotsMap[id] = [];
          }
        })
      );
      setAvailableSlotsMap(slotsMap);
    } catch (error) {
      console.error("Error fetching teacher sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleStatusChange = async (sessionId, status) => {
    try { await updateSessionStatus(sessionId, status); fetchSessions(); }
    catch (error) { console.error("Failed to update status:", error); }
  };

  const handleRescheduleSubmit = async (sessionId) => {
    const { newDate, newTime } = rescheduleData[sessionId] || {};
    if (!newDate || !newTime) return;
    try { await proposeSessionReschedule(sessionId, { newDate, newTime }); fetchSessions(); }
    catch (err) { console.error("Failed to propose reschedule:", err); }
  };

  const handleMeetingLinkSubmit = async (sessionId) => {
    const link = (meetingLinkInputs[sessionId] || "").trim();
    if (!link) return;
    try { await updateMeetingLink(sessionId, link); fetchSessions(); }
    catch (err) { console.error("Failed to update meeting link:", err); }
  };

  const toggleSessionDetails = (key) => {
    setExpandedSessions(prev => ({
      ...prev,
      [key]: !(prev[key] ?? true)
    }));
  };

  const isSessionNow = (scheduledTime) => {
    if (!scheduledTime) return false;
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diff = Math.abs(now - scheduled);
    return diff <= 60 * 60 * 1000;
  };

  const isUpcoming = (scheduledTime) => {
    if (!scheduledTime) return false;
    return new Date(scheduledTime) > new Date();
  };

  // Get proficiency badge styling based on level
  const getProficiencyBadgeStyle = (proficiency) => {
    const level = proficiency?.toLowerCase() || 'beginner';
    const styles = {
      beginner: "bg-green-100 text-green-800 ring-1 ring-green-600/20",
      intermediate: "bg-blue-100 text-blue-800 ring-1 ring-blue-600/20",
      advanced: "bg-orange-100 text-orange-800 ring-1 ring-orange-600/20",
      expert: "bg-purple-100 text-purple-800 ring-1 ring-purple-600/20"
    };
    return styles[level] || styles.beginner;
  };

  // Group sessions by student and course
  const groupSessionsByStudent = (sessions) => {
    const grouped = {};
    sessions.forEach(session => {
      const studentId = session.learnerID?._id;
      const courseId = session.skillListingID?._id;
      const key = `${studentId}-${courseId}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          student: session.learnerID,
          course: session.skillListingID,
          sessions: []
        };
      }
      grouped[key].sessions.push(session);
    });
    
    // Sort sessions by date (newest first) for each student-course pair
    Object.values(grouped).forEach(group => {
      group.sessions.sort((a, b) => new Date(b.scheduledTime || 0) - new Date(a.scheduledTime || 0));
    });
    
    return Object.values(grouped);
  };

  // Calculate progress for a student's course
  const calculateProgress = (sessions, totalSessions) => {
    const completedSessions = sessions.filter(s => s.status === "completed").length;
    const total = totalSessions || sessions.length; // Use totalSessions from course, fallback to actual sessions count
    return {
      completed: completedSessions,
      total: total,
      percentage: total > 0 ? Math.round((completedSessions / total) * 100) : 0
    };
  };

  // Filter sessions based on active tab
  const getFilteredSessions = () => {
    switch (activeTab) {
      case "pending":
        return sessions.filter(s => s.status === "pending");
      case "upcoming":
        return sessions.filter(s => s.status === "accepted" && isUpcoming(s.scheduledTime));
      case "completed":
        return sessions.filter(s => s.status === "completed");
      default:
        return sessions;
    }
  };

  const filteredSessions = getFilteredSessions();
  const groupedStudents = groupSessionsByStudent(filteredSessions);
  
  // Group all sessions (not filtered) for consistent progress calculation
  const allGroupedStudents = groupSessionsByStudent(sessions);

  const tabs = [
    { id: "all", label: "All", count: sessions.length },
    { id: "pending", label: "Pending", count: sessions.filter(s => s.status === "pending").length },
    { id: "upcoming", label: "Upcoming", count: sessions.filter(s => s.status === "accepted" && isUpcoming(s.scheduledTime)).length },
    { id: "completed", label: "Completed", count: sessions.filter(s => s.status === "completed").length },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-green-100 text-green-800 border-green-200",
      rescheduled: "bg-purple-100 text-purple-800 border-purple-200"
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}>
        {status === "completed" && "✓ "}
        {status === "accepted" && "📅 "}
        {status === "pending" && "⏳ "}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
          <p className="mt-2 text-gray-600">Manage your teaching sessions and student interactions</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading sessions...</span>
          </div>
        ) : groupedStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
            <p className="text-gray-600">No sessions match the current filter criteria.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {groupedStudents.map((group, index) => {
              // Find the corresponding group in all sessions for consistent progress
              const allSessionsGroup = allGroupedStudents.find(g => 
                g.student?._id === group.student?._id && g.course?._id === group.course?._id
              );
              const progress = calculateProgress(allSessionsGroup?.sessions || group.sessions, group.course?.totalSessions);
              const groupKey = `${group.student?._id}-${group.course?._id}`;
              
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Student Header */}
                  <div className="bg-gray-900 border-b border-gray-700 flex items-stretch h-[100px]">
                    {/* Course Image - Full Height at Edge */}
                    <div className="relative group w-50 flex-shrink-0">
                      {group.course?.listingImgURL ? (
                        <div className="h-full w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-lg">
                          <img
                            src={group.course.listingImgURL}
                            alt={group.course?.title || 'Course'}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="h-full w-full rounded-r-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                          <div className="text-center">
                            <span className="text-white font-bold text-2xl tracking-wider">
                              {group.course?.title?.charAt(0) || '?'}
                            </span>
                            <div className="absolute inset-0 rounded-r-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Content Area */}
                    <div className="flex-1 px-6 py-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-bold text-white truncate">
                          {group.course?.title || 'Unknown Course'}
                        </h3>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyBadgeStyle(group.course?.proficiency)}`}>
                            {group.course?.proficiency || 'Beginner'}
                          </span>
                          <span className="ml-2 text-sm text-gray-300">
                            {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white">
                            {group.student?.fullname || 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-300 font-medium">Student</p>
                        </div>
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-white shadow-md">
                            {group.student?.profile?.profilePhoto ? (
                              <img
                                src={group.student.profile.profilePhoto}
                                alt={group.student?.fullname || 'Student'}
                                className="h-12 w-12 object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {group.student?.fullname?.split(' ').map(n => n[0]).join('') || '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          {/* Online status indicator */}
                          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Course Progress */}
                  <div className="px-6 py-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-semibold text-gray-900">Course Progress</h4>
                      <span className="text-sm text-gray-600">
                        {progress.completed} of {progress.total} sessions completed
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-black h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-end">
                      <span className="text-sm font-medium text-gray-900">{progress.percentage}%</span>
                    </div>

                    {/* View Session Details Toggle */}
                    <button
                      onClick={() => toggleSessionDetails(groupKey)}
                      className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors"
                    >
                      <span>View Session Details</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${(expandedSessions[groupKey] ?? true) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Session Details (expanded by default so actions like Mark Completed and
                      Meeting Link aren't hidden behind an extra click) */}
                  {(expandedSessions[groupKey] ?? true) && (
                    <div className="divide-y divide-gray-200">
                      {group.sessions.map((session) => (
                        <div key={session._id} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-sm font-medium text-gray-900">
                                  Session #{session._id.slice(-6)}
                                </h4>
                                {getStatusBadge(session.status)}
                                {session.paymentStatus === "paid" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    ✓ Paid
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Scheduled:</span>
                                  <br />
                                  {session.scheduledTime
                                    ? new Date(session.scheduledTime).toLocaleString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })
                                    : 'Not scheduled'}
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span>
                                  <br />
                                  1 hour
                                </div>
                              </div>
                              {session.note && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                  <span className="text-sm font-medium text-gray-700">Note:</span>
                                  <p className="text-sm text-gray-600 mt-1">{session.note}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Reschedule Info */}
                          {session.status === "rescheduled" && session.rescheduleRequest && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                              <p className="text-sm font-medium text-amber-800">
                                Reschedule Requested
                              </p>
                              <p className="text-sm text-amber-700 mt-1">
                                New Time: {(() => {
                                  const { newDate, newTime } = session.rescheduleRequest;
                                  if (newDate && newTime) {
                                    try {
                                      return new Date(`${newDate}T${newTime}`).toLocaleString();
                                    } catch {
                                      return `${newDate} ${newTime}`;
                                    }
                                  }
                                  return "N/A";
                                })()}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          {session.status === "pending" && (
                            <div className="flex space-x-3">
                              <button
                                onClick={() => handleStatusChange(session._id, "accepted")}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                              >
                                Accept Session
                              </button>
                              <button
                                onClick={() => handleStatusChange(session._id, "rejected")}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                              >
                                Decline Session
                              </button>
                            </div>
                          )}

                          {session.status === "accepted" && (
                            <div className="space-y-4">
                              {/* Meeting Link — paste a Zoom/Google Meet/etc. link for the learner to join */}
                              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <h5 className="text-sm font-medium text-gray-900 mb-3">Meeting Link</h5>
                                {session.meetingLink && (
                                  <p className="text-sm text-gray-600 mb-2 break-all">
                                    Current: <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{session.meetingLink}</a>
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-3">
                                  <input
                                    type="url"
                                    placeholder="https://meet.google.com/..."
                                    value={meetingLinkInputs[session._id] ?? session.meetingLink ?? ""}
                                    onChange={(e) =>
                                      setMeetingLinkInputs((prev) => ({ ...prev, [session._id]: e.target.value }))
                                    }
                                    className="flex-1 min-w-[200px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <button
                                    onClick={() => handleMeetingLinkSubmit(session._id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                  >
                                    Save Link
                                  </button>
                                </div>
                              </div>

                              {/* Reschedule Section */}
                              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                                <h5 className="text-sm font-medium text-gray-900 mb-3">Propose Reschedule</h5>
                                <div className="flex flex-wrap gap-3">
                                  <input
                                    type="date"
                                    value={rescheduleData[session._id]?.newDate || ""}
                                    min={new Date().toISOString().slice(0, 10)}
                                    onChange={(e) =>
                                      setRescheduleData((prev) => ({
                                        ...prev,
                                        [session._id]: { ...prev[session._id], newDate: e.target.value },
                                      }))
                                    }
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <select
                                    value={rescheduleData[session._id]?.newTime || ""}
                                    onChange={(e) =>
                                      setRescheduleData((prev) => ({
                                        ...prev,
                                        [session._id]: { ...prev[session._id], newTime: e.target.value },
                                      }))
                                    }
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="">Select time</option>
                                    {(availableSlotsMap[session.skillListingID?._id] || []).map((slot) => (
                                      <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleRescheduleSubmit(session._id)}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                  >
                                    Propose
                                  </button>
                                </div>
                              </div>

                              {/* Session Actions */}
                              <div className="flex space-x-3">
                                <button
                                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                  onClick={() => handleStatusChange(session._id, "completed")}
                                >
                                  ✅ Mark Completed
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSessions;
