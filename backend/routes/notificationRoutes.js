import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { getNotifications, markAllAsRead } from "../controllers/notificationController.js";
import { sendNotificationEmail } from "../utils/email.js";

const router = express.Router();

router.route("/get").get(isAuthenticated, getNotifications);
router.route("/mark-as-read").patch(isAuthenticated, markAllAsRead);

// Test endpoint: GET /api/v1/notification/test-email (must be logged in)
router.get("/test-email", isAuthenticated, async (req, res) => {
  const { User } = await import("../models/user.model.js");
  const user = await User.findById(req.user.userId).select("email fullname");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const sent = await sendNotificationEmail({
    to: user.email,
    subject: "SkillBridge — Email test",
    text: `Hi ${user.fullname}, your email notifications are working!`,
  });

  return res.json({
    success: sent,
    message: sent ? `Test email sent to ${user.email}` : "Email not sent — check SMTP in .env",
  });
});

export default router;
