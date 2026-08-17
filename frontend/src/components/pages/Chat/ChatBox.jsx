import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { io } from "socket.io-client";

const ChatBox = ({ visible, onClose, receiver }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const socketRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userId = decoded.userId || decoded._id;
        setCurrentUserId(userId);
      } catch (err) {
        console.error("Token decoding failed", err);
      }
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!visible || !receiver?.chatId || !token) return undefined;
    const socket = io("http://localhost:3000", { auth: { token } });
    socketRef.current = socket;
    socket.emit("chat:join", receiver.chatId);
    const receiveMessage = (message) => {
      if (String(message.chat?._id || message.chat) !== String(receiver.chatId)) return;
      setMessages((current) => current.some((item) => item._id === message._id) ? current : [...current, message]);
    };
    socket.on("message:new", receiveMessage);
    return () => socket.disconnect();
  }, [visible, receiver?.chatId]);

  const fetchMessages = async (chatId) => {
    try {
      const token = getToken();

      const response = await axios.get(
        `http://localhost:3000/api/v1/chat/${chatId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setMessages(response.data);
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    setSending(true);

    try {
      const token = getToken();

      const res = await axios.post(
        "http://localhost:3000/api/v1/chat/chatsend",
        {
          content: inputMessage,
          chat: receiver.chatId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setMessages((prev) => prev.some((message) => message._id === res.data._id) ? prev : [...prev, res.data]);
      setInputMessage("");
    } catch (error) {
      console.error("Message send failed", error);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when visible or receiver changes
  useEffect(() => {
    if (visible && receiver?.chatId && currentUserId) {
      fetchMessages(receiver.chatId);
    }
  }, [visible, receiver, currentUserId]);

  
  if (!visible || !receiver) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white border border-gray-300 shadow-xl rounded-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center border-b p-3 bg-blue-50 rounded-t-lg">
        <h4 className="font-semibold text-gray-800 text-sm">
          {receiver.fullname}
        </h4>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>

      {/* Message Body */}
      <div className="flex-1 p-3 overflow-y-auto text-sm text-gray-700 space-y-2">
        {messages.map((msg, index) => {
          const senderId =
            typeof msg.sender === "string" ? msg.sender : msg.sender._id;
          const isCurrentUser = String(senderId) === String(currentUserId);

          return (
            <div
              key={index}
              className={`flex mb-2 ${
                isCurrentUser ? "justify-end" : "justify-start"
              }`}
            >
              {/* Show avatar and name only for others */}
              {!isCurrentUser && msg.sender.profile?.profilePhoto && (
                <img
                  src={msg.sender.profile.profilePhoto}
                  alt={msg.sender.fullname || msg.sender.name || "User"}
                  className="w-8 h-8 rounded-full mr-2 self-end"
                />
              )}

              <div
                className={`max-w-[70%] px-3 py-2 rounded-lg ${
                  isCurrentUser
                    ? "bg-blue-600 text-white text-right"
                    : "bg-gray-200 text-gray-900 text-left"
                }`}
              >
                {/* Optionally show sender name for others */}
                {!isCurrentUser && (
                  <p className="text-xs font-semibold mb-1">
                    {msg.sender.fullname || msg.sender.name || "User"}
                  </p>
                )}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex border-t p-2">
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button
          onClick={handleSendMessage}
          disabled={sending}
          className={`p-2 text-blue-600 hover:text-blue-800 ${
            sending ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
