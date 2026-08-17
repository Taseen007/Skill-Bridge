import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  learnerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teacherID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  skillListingID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SkillListing",
    required: true,
  },
  scheduledTime: {
    type: Date, // Stores both date and time
    required: true,
  },
  skillName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "rescheduled", "cancelled", "completed"],
    default: "pending",
  },
  note: {
    type: String,
  },
  meetingLink: {
    type: String,
    default: "",
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid"],
    default: "unpaid",
  },
  paymentMethod: {
    type: String,
  },
  paidAt: {
    type: Date,
  },
  rescheduleRequest: {
    newDate: Date,
    newTime: String, // Add this line to store the time part
    newDuration: Number,
    newTimeZone: String,
    requestedAt: Date,
    previousStatus: String, // status to restore to if the reschedule is rejected
  },
}, { timestamps: true });

// Virtual to get time string (HH:mm) for slot matching
sessionSchema.virtual('scheduledTimeString').get(function() {
  if (!this.scheduledTime) return '';
  const date = new Date(this.scheduledTime);
  return date.toISOString().substring(11, 16); // 'HH:mm'
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;