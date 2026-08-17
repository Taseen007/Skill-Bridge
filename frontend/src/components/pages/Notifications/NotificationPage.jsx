import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setNotifications } from "../../../redux/authSlice";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ChatBox from "../Chat/ChatBox";

const NotificationPage = () => {
  const notifications = useSelector((state) => state.auth.notifications);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [chatVisible, setChatVisible] = useState(false);
  const [chatData, setChatData] = useState(null);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  // Open chat with sender
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
        console.log("Unknown notification type:", notif.type);
    }
  };
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/v1/notification/get",
          { withCredentials: true }
        );
        if (Array.isArray(response.data.notifications)) {
          dispatch(setNotifications(response.data.notifications));
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications();
  }, [dispatch]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        All Notifications
      </h1>

      {notifications.length === 0 ? (
        <p className="text-gray-500 text-center">
          You don’t have any notifications.
        </p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li
              key={notif._id}
              onClick={() => handleNotificationClick(notif)}
              className="p-4 border rounded-lg shadow-sm bg-white flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition"
            >
              {/* Profile Picture */}
              {notif.sender?.profile?.profilePhoto ? (
                <img
                  src={notif.sender.profile.profilePhoto}
                  alt={`${notif.sender.fullname}'s profile`}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 flex-shrink-0 font-semibold">
                  {notif.sender?.fullname?.charAt(0).toUpperCase() || "U"}
                </div>
              )}

              {/* Notification Text */}
              <div>
                <div className="text-sm text-gray-800 font-medium">
                  {notif.sender?.fullname || "Someone"}: {notif.message}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => navigate(-1)}
        className="mt-8 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-medium"
      >
        ← Back
      </button>

      {/* Chat Box Popup */}
      {chatVisible && chatData && (
        <ChatBox
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          receiver={chatData.receiver} // contains fullname + chatId now
        />
      )}
    </div>
  );
};
export default NotificationPage;
