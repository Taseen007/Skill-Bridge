import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Session" },
    relatedChat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    type:{ type: String, enum: ["message","book_session","session_rescheduled","session_status"], default: "message" },
});

export default mongoose.model("Notification", notificationSchema);
