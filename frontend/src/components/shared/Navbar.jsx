import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Settings, Plus, BookOpen, Heart, GraduationCap, Briefcase } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setUser, setNotifications } from "../../redux/authSlice";
import { toast } from "sonner";
import axios from "axios";
import { io } from "socket.io-client";
import ChatBox from "../pages/Chat/ChatBox";
import { buildApiUrl, API_ENDPOINTS } from "../../config/api";
import { canTeach } from "../../utils/roles";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const notifications = useSelector((state) => state.auth.notifications);
  const isLoggedIn = !!user;
  const userCanTeach = canTeach(user?.role);
  const POLLING_INTERVAL = 5000;
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Determine sessions link based on user role — both-role users default to teacher view
  const sessionsLink = canTeach(user?.role) ? "/sessions/teacher" : "/sessions/learner";
  const navItems = [
    { name: "Home", href: "/" },
    { name: "Skills", href: "/skills" },
  ];
  const [chatVisible, setChatVisible] = useState(false);
  const [chatData, setChatData] = useState(null);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const handleMessageClick = async (sender) => {
    if (!sender?._id) return; // safeguard

    try {
      const token = getCookie("token");
      const res = await axios.post(
        "http://localhost:3000/api/v1/chat/chat",
        { userId: sender._id },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setChatData({
        receiver: { ...sender, chatId: res.data._id },
      });

      setChatVisible(true);
    } catch (err) {
      console.error("Error opening chat", err);
    }
  };
  const handleNotificationClick = (notif) => {
    switch (notif.type) {
      case "message":
        if (notif.sender) handleMessageClick(notif.sender);
        break;

      case "book_session":
        navigate("/sessions/teacher");
        break;

      case "session_rescheduled":
        navigate("/sessions/learner");
        break;
      case "session_status":
        navigate("/sessions/learner");
        break;

      default:
        if (notif.sessionId) {
          const role = user?.role === "teacher" ? "teacher" : "learner";
          navigate(`/sessions/${role}`);
        }
    }
  };

  // Real-time notification delivery via Socket.IO
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !isLoggedIn) return;

    const socket = io("http://localhost:3000", { auth: { token } });

    socket.on("notification:new", (notification) => {
      // Re-fetch all notifications to stay in sync (avoids stale closure)
      axios.get("http://localhost:3000/api/v1/notification/get", { withCredentials: true })
        .then((res) => {
          if (Array.isArray(res.data.notifications)) {
            dispatch(setNotifications(res.data.notifications));
          }
        })
        .catch(() => {});
    });

    return () => socket.disconnect();
  }, [isLoggedIn, dispatch]);

  useEffect(() => {
    let intervalId;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/notification/get",
          {
            withCredentials: true,
          }
        );

        if (Array.isArray(response.data.notifications)) {
          dispatch(setNotifications(response.data.notifications));
        } else {
          console.error("Unexpected API response:", response.data);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    intervalId = setInterval(fetchNotifications, POLLING_INTERVAL);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [dispatch]);

  useEffect(() => {
    const unread = notifications.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleLogout = async () => {
    try {
      // Clear the httpOnly cookie on the server side
      await axios.get("http://localhost:3000/api/v1/user/logout", { withCredentials: true });
    } catch (_) {
      // Proceed with local logout even if the server call fails
    }
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    dispatch(setUser(null));
    toast.success("Logged out successfully!");
    navigate("/signin");
    setProfileDropdownOpen(false);
  };

  const handleManageProfile = () => {
    navigate("/profile");
    setProfileDropdownOpen(false);
  };

  const handleUpgradeRole = async (targetRole) => {
    if (!user) return;
    setUpgradeLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        buildApiUrl(API_ENDPOINTS.USER.UPGRADE_ROLE),
        { targetRole },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.data?.success) {
        dispatch(setUser(res.data.user));
        localStorage.setItem("user", JSON.stringify(res.data.user));
        toast.success(`Role updated to ${targetRole}`);
      } else {
        toast.error(res.data?.message || "Failed to update role");
      }
    } catch (err) {
      console.error("Upgrade role error:", err);
      toast.error("Failed to update role");
    } finally {
      setUpgradeLoading(false);
      setProfileDropdownOpen(false);
    }
  };

  const renderNavLink = (item) => (
    <Link
      key={item.name}
      to={item.href}
      onClick={() => setMenuOpen(false)}
      className="text-gray-600 hover:text-indigo-600 transition font-medium"
    >
      {item.name}
    </Link>
  );

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-gray-800">
            Skill<span className="text-indigo-600">Bridge</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {/* Home, Skills */}
            {navItems.map(renderNavLink)}
            {/* Sessions (if logged in) */}
            {isLoggedIn && (
              <Link
                to={sessionsLink}
                className="text-gray-600 hover:text-indigo-600 transition font-medium"
              >
                Sessions
              </Link>
            )}
            {/* Saved (if logged in) */}
            {isLoggedIn && (
              <Link
                to="/skills?view=saved"
                className="text-gray-600 hover:text-indigo-600 transition font-medium inline-flex items-center gap-1"
              >
                <Heart size={16} /> Saved
              </Link>
            )}
            {/* Quick actions: Add Skill + Add Listing (teachers only) */}
            {isLoggedIn && userCanTeach && (
              <div className="flex items-center gap-2 border-l pl-6 ml-1">
                <Link
                  to="/skills/add"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-indigo-200 text-indigo-700 rounded-md hover:bg-indigo-50 transition font-medium"
                  title="Add a skill you can teach"
                >
                  <BookOpen size={15} />
                  <Plus size={14} />
                  Skill
                </Link>
                <Link
                  to="/listings/add"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-medium"
                  title="Create a paid listing to offer a skill"
                >
                  <Briefcase size={15} />
                  <Plus size={14} />
                  Listing
                </Link>
              </div>
            )}
            {isLoggedIn && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    axios
                      .patch(
                        "http://localhost:3000/api/v1/notification/mark-as-read",
                        {},
                        { withCredentials: true }
                      )
                      .then(() => {
                        setUnreadCount(0);
                        dispatch(
                          setNotifications(
                            notifications.map((n) => ({ ...n, isRead: true }))
                          )
                        );
                      })
                      .catch((err) =>
                        console.error("Failed to mark as read", err)
                      );
                  }}
                  className="relative focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-gray-500 text-sm">
                        No notifications
                      </p>
                    ) : (
                      <>
                        <ul className="divide-y">
                          {notifications.slice(0, 5).map((notif) => (
                            <li
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className="p-4 border rounded-lg shadow-sm bg-white flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition"
                            >
                              {notif.sender?.profile?.profilePhoto ? (
                                <img
                                  src={notif.sender.profile.profilePhoto}
                                  alt={`${notif.sender.fullname}'s profile`}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 flex-shrink-0 font-semibold">
                                  {notif.sender?.fullname
                                    ?.charAt(0)
                                    .toUpperCase() || "U"}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-800 font-medium leading-tight">
                                  {notif.sender?.fullname || "Someone"}:{" "}
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(notif.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="text-right p-2 border-t">
                          <Link
                            to="/notifications"
                            className="text-sm text-indigo-600 hover:underline font-medium"
                            onClick={() => setShowNotifications(false)}
                          >
                            See All
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {isLoggedIn ? (
              <div className="relative ml-4" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
                  aria-label="Profile menu"
                >
                  {user?.profile?.profilePhoto ? (
                    <img
                      src={user.profile.profilePhoto}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border">
                    {/* Current role display */}
                    <div className="px-4 py-2 border-b">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        Signed in as
                      </p>
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {user?.fullname || "User"}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {user?.role === "teacher" ? (
                            <Briefcase size={11} />
                          ) : user?.role === "both" ? (
                            <GraduationCap size={11} />
                          ) : (
                            <User size={11} />
                          )}
                          {(user?.role || "learner").toUpperCase()}
                        </span>
                      </div>
                    </div>
                    {/* Upgrade role section */}
                    {user?.role !== "both" && (
                      <div className="px-3 py-2 border-b bg-gray-50/50">
                        <p className="text-xs text-gray-500 mb-1.5">
                          Want to {user?.role === "teacher" ? "learn new skills" : "teach what you know"}?
                        </p>
                        <div className="flex flex-col gap-1">
                          {user?.role === "learner" && (
                            <button
                              onClick={() => handleUpgradeRole("teacher")}
                              disabled={upgradeLoading}
                              className="flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 disabled:opacity-60 transition"
                            >
                              <Briefcase size={12} />
                              {upgradeLoading ? "Upgrading..." : "Become a Teacher"}
                            </button>
                          )}
                          {user?.role === "teacher" && (
                            <button
                              onClick={() => handleUpgradeRole("learner")}
                              disabled={upgradeLoading}
                              className="flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-60 transition"
                            >
                              <GraduationCap size={12} />
                              {upgradeLoading ? "Upgrading..." : "Enable Learner Mode"}
                            </button>
                          )}
                          <button
                            onClick={() => handleUpgradeRole("both")}
                            disabled={upgradeLoading}
                            className="flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-medium rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-60 transition"
                          >
                            <GraduationCap size={12} />
                            <Briefcase size={12} />
                            {upgradeLoading ? "Upgrading..." : "Teach & Learn (Both)"}
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleManageProfile}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <Settings size={16} className="mr-3" />
                      Manage Profile
                    </button>
                    {userCanTeach && (
                      <>
                        <Link
                          to="/skills/add"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <BookOpen size={16} className="mr-3" />
                          Add a Skill
                        </Link>
                        <Link
                          to="/listings/add"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          <Briefcase size={16} className="mr-3" />
                          Create Listing
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <LogOut size={16} className="mr-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/signin"
                className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-gray-700 focus:outline-none"
              aria-label="Toggle Menu"
            >
              {menuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          {/* Home, Skills */}
          {navItems.map(renderNavLink)}
          {/* Sessions (if logged in) */}
          {isLoggedIn && (
            <Link
              to={sessionsLink}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 text-gray-600 hover:text-indigo-600 transition font-medium"
            >
              Sessions
            </Link>
          )}
          {isLoggedIn && (
            <Link
              to="/skills?view=saved"
              onClick={() => setMenuOpen(false)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-indigo-600 transition font-medium"
            >
              <Heart size={16} className="mr-3" /> Saved Listings
            </Link>
          )}
          {isLoggedIn && userCanTeach && (
            <div className="grid grid-cols-2 gap-2 px-1">
              <Link
                to="/skills/add"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1 px-2 py-2 border border-indigo-200 text-indigo-700 rounded-md bg-white hover:bg-indigo-50 text-sm font-medium"
              >
                <BookOpen size={15} /> + Skill
              </Link>
              <Link
                to="/listings/add"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1 px-2 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
              >
                <Briefcase size={15} /> + Listing
              </Link>
            </div>
          )}
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  handleManageProfile();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-gray-700 hover:text-indigo-600 transition font-medium"
              >
                <Settings size={16} className="mr-3" />
                Manage Profile
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 font-semibold"
              >
                <LogOut size={16} className="mr-3" />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/signin"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-semibold text-center"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
      {chatVisible && chatData && (
        <ChatBox
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          receiver={chatData.receiver} // contains fullname + chatId now
        />
      )}
    </nav>
  );
};

export default Navbar;
