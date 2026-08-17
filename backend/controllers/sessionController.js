import Session from "../models/session.js";
import SkillListing from "../models/skillListing.js";
import Notification from "../models/notificationModel.js"
import { User } from "../models/user.model.js";
import { emitToUser } from "../utils/realtime.js";
import { sendNotificationEmail } from "../utils/email.js";


// Learner creates a session request
export const createSession = async (req, res) => {
  try {
    const learnerID = req.user.userId;
    const { teacherID, skillListingID, slotDate, slotTime, note, paymentConfirmed, paymentMethod } = req.body;

    if (!paymentConfirmed) {
      return res.status(400).json({ message: "Payment is required to book a session", success: false });
    }

    const skillListing = await SkillListing.findById(skillListingID);
    if (!skillListing) {
      return res.status(404).json({ message: "Skill listing not found", success: false });
    }

    if (!slotTime || !skillListing.availableSlots.includes(slotTime)) {
      return res.status(400).json({ message: "Selected time slot is not available", success: false });
    }

    if (!slotDate) {
      return res.status(400).json({ message: "Date is required", success: false });
    }

    const scheduledTime = new Date(`${slotDate}T${slotTime}`);

    const existingSession = await Session.findOne({
      skillListingID,
      scheduledTime,
    });

    if (existingSession) {
      return res.status(400).json({ message: "This slot is already booked for the selected date.", success: false });
    }

    const newSession = new Session({
      learnerID,
      teacherID,
      skillListingID,
      scheduledTime,
      skillName: skillListing.title,
      price: skillListing.fee,
      note,
      paymentStatus: "paid",
      paymentMethod: paymentMethod || "mock-card",
      paidAt: new Date(),
    });

    await newSession.save();

    // ✅ Create notification for the teacher
    const notification = new Notification({
      recipient: teacherID,
      sender: learnerID,
      message: `A session has been booked for "${skillListing.title}" on ${slotDate} at ${slotTime}.`,
      sessionId: newSession._id, 
      type: "book_session",
    });

    await notification.save();
    emitToUser(teacherID, "notification:new", notification);
    const teacher = await User.findById(teacherID).select("email");
    sendNotificationEmail({
      to: teacher?.email,
      subject: "New SkillBridge booking request",
      text: notification.message,
    }).catch(console.error);

    res.status(201).json({
      message: "Session request sent",
      success: true,
      session: newSession,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};


// Get all sessions of a user (learner or teacher), with optional filtering by status and date range
export const getUserSessions = async (req, res) => {
  try {
    const userID = req.user.userId;
    const { status, startDate, endDate } = req.query;

    const filter = {
      $or: [{ learnerID: userID }, { teacherID: userID }],
    };

    if (status) filter.status = status;


    // Remove date filtering since scheduledTime is now a string (time only)
    const sessions = await Session.find(filter)
      .populate("teacherID", "fullname profile.profilePhoto")
      .populate("learnerID", "fullname profile.profilePhoto")
      .populate("skillListingID", "title totalSessions listingImgURL proficiency")
      .sort({ createdAt: 1 });

    res.status(200).json({ message: "Sessions retrieved", success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Teacher updates session status (accept/reject/cancel/complete)
export const updateSessionStatus = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { status } = req.body;
    const userId = req.user.userId;

    const validStatus = ["accepted", "rejected", "cancelled", "completed"];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status", success: false });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found", success: false });
    }

    if (session.teacherID.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this session", success: false });
    }

    session.status = status;
    await session.save();
   const teacher = await User.findById(userId).select('fullname');
    const teacherName = teacher ? teacher.fullname : "Teacher";

    let notifMessage = "";
    if (status === "accepted") {
      notifMessage = `Your session request for "${session.skillName}" has been accepted by ${teacherName}`;
    } else if (status === "rejected") {
      notifMessage = `Your session request for "${session.skillName}" has been rejected by ${teacherName}`;
    } else if (status === "cancelled") {
      notifMessage = `Your session for "${session.skillName}" has been cancelled by ${teacherName}`;
    } else if (status === "completed") {
      notifMessage = `Your session for "${session.skillName}" has been marked as completed by ${teacherName}`;
    }

    const notification = new Notification({
      recipient: session.learnerID,
      sender: userId,
      message: notifMessage,
      sessionId: session._id,
      type: "session_status",
    });

    await notification.save();
    // Populate sender so the frontend notification panel can show name/avatar immediately
    await notification.populate("sender", "fullname profile.profilePhoto");
    emitToUser(session.learnerID, "notification:new", notification);

    const learner = await User.findById(session.learnerID).select("email");
    sendNotificationEmail({
      to: learner?.email,
      subject: "SkillBridge — Session update",
      text: notifMessage,
    }).catch(console.error);

    res.status(200).json({ message: "Session status updated", success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Teacher sets/updates the link learner and teacher will use to actually meet
// (e.g. a Zoom/Google Meet URL). The app has no built-in video calling, so this
// is just a plain link the teacher pastes in and the learner sees on their session.
export const updateMeetingLink = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { meetingLink } = req.body;
    const userId = req.user.userId;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found", success: false });
    }

    if (session.teacherID.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this session", success: false });
    }

    session.meetingLink = meetingLink || "";
    await session.save();

    res.status(200).json({ message: "Meeting link updated", success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Teacher proposes reschedule
export const proposeReschedule = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { newDate, newTime } = req.body;
    const userId = req.user.userId;

    if (!newTime || !newDate) {
      return res.status(400).json({ message: "New date and time required", success: false });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found", success: false });
    }

    if (session.teacherID.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to reschedule this session", success: false });
    }

    // Check for double-booking: is there already a session for this skillListing, date, and time?
    const rescheduleDateTime = new Date(`${newDate}T${newTime}`);
    const existingSession = await Session.findOne({
      skillListingID: session.skillListingID,
      scheduledTime: rescheduleDateTime,
      _id: { $ne: session._id },
    });
    if (existingSession) {
      return res.status(400).json({ message: "This slot is already booked for the selected date.", success: false });
    }

    session.rescheduleRequest = {
      newTime,
      newDate,
      requestedAt: new Date(),
      previousStatus: session.status,
    };
    session.status = "rescheduled";
    // Ensure required fields are not lost
    if (!session.skillName || !session.price) {
      // If not present, fetch from DB
      let skillListingDoc = null;
      if (session.skillListingID && typeof session.skillListingID === 'object' && session.skillListingID.title) {
        // Populated
        skillListingDoc = session.skillListingID;
      } else {
        // Not populated, fetch
        skillListingDoc = await SkillListing.findById(session.skillListingID);
      }
      if (skillListingDoc) {
        if (!session.skillName) session.skillName = skillListingDoc.title;
        if (!session.price) session.price = skillListingDoc.fee;
      }
    }

    await session.save();
    const notificationMessage = `Teacher has proposed to reschedule your session "${session.skillName}" to ${newDate} at ${newTime}.`;

    const notification = new Notification({
      sender: userId,
      recipient: session.learnerID,
      message: notificationMessage,
      sessionId: session._id,
      type: "session_rescheduled",
    });

    await notification.save();
    await notification.populate("sender", "fullname profile.profilePhoto");
    emitToUser(session.learnerID, "notification:new", notification);

    const learner = await User.findById(session.learnerID).select("email");
    sendNotificationEmail({
      to: learner?.email,
      subject: "SkillBridge — Session reschedule request",
      text: notificationMessage,
    }).catch(console.error);

    res.status(200).json({ message: "Reschedule proposed", success: true, session });
  } catch (err) {
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Learner responds to reschedule request (accept or reject)
export const respondReschedule = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { accept } = req.body;
    const userId = req.user.userId;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found", success: false });
    }

    if (session.learnerID.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to respond to this reschedule", success: false });
    }

    if (!session.rescheduleRequest) {
      return res.status(400).json({ message: "No reschedule request pending", success: false });
    }



    if (accept) {
      if (!session.rescheduleRequest.newTime || !session.rescheduleRequest.newDate) {
        return res.status(400).json({ message: "No new date/time provided in reschedule request", success: false });
      }
      // Check if the new time is available in the teacher's SkillListing (by time only)
      const skillListing = await SkillListing.findById(session.skillListingID);
      if (!skillListing) {
        return res.status(404).json({ message: "Skill listing not found", success: false });
      }
      if (!skillListing.availableSlots.includes(session.rescheduleRequest.newTime)) {
        return res.status(400).json({ message: "Selected time slot is no longer available", success: false });
      }
      // availableSlots is a recurring time-of-day template, not date-specific —
      // don't remove it here (booking a session doesn't remove it either).
      // Combine newDate and newTime into a Date object. newDate comes back from
      // the DB as a real Date, so format it to "YYYY-MM-DD" before combining
      // with the time string — string-concatenating a Date directly produces
      // an unparsable string.
      const newDateStr = new Date(session.rescheduleRequest.newDate).toISOString().slice(0, 10);
      session.scheduledTime = new Date(`${newDateStr}T${session.rescheduleRequest.newTime}`);
      session.status = "accepted";
    } else {
      // Revert to whatever the session's status was before the reschedule was proposed
      session.status = session.rescheduleRequest.previousStatus || "accepted";
    }

    // Ensure required fields are present
    if (!session.skillName || !session.price) {
      let skillListingDoc = null;
      if (session.skillListingID && typeof session.skillListingID === 'object' && session.skillListingID.title) {
        skillListingDoc = session.skillListingID;
      } else {
        skillListingDoc = await SkillListing.findById(session.skillListingID);
      }
      if (skillListingDoc) {
        if (!session.skillName) session.skillName = skillListingDoc.title;
        if (!session.price) session.price = skillListingDoc.fee;
      }
    }

    session.rescheduleRequest = undefined;
    await session.save();

    // Notify the teacher that the learner accepted/rejected the reschedule
    const learner = await User.findById(userId).select("fullname email");
    const learnerName = learner ? learner.fullname : "The learner";
    const rescheduleResponseMsg = accept
      ? `${learnerName} accepted your reschedule request for "${session.skillName}".`
      : `${learnerName} declined your reschedule request for "${session.skillName}". The session remains as originally scheduled.`;

    const rescheduleNotif = new Notification({
      sender: userId,
      recipient: session.teacherID,
      message: rescheduleResponseMsg,
      sessionId: session._id,
      type: "session_status",
    });
    await rescheduleNotif.save();
    await rescheduleNotif.populate("sender", "fullname profile.profilePhoto");
    emitToUser(session.teacherID, "notification:new", rescheduleNotif);

    const teacher = await User.findById(session.teacherID).select("email");
    sendNotificationEmail({
      to: teacher?.email,
      subject: "SkillBridge — Reschedule response",
      text: rescheduleResponseMsg,
    }).catch(console.error);

    res.status(200).json({ message: "Reschedule response recorded", success: true, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get sessions where user is learner
export const getLearnerSessions = async (req, res) => {
  try {
    const learnerID = req.user.userId;
    const sessions = await Session.find({ learnerID })
      .populate("teacherID", "fullname profile.profilePhoto")
      .populate("skillListingID", "title totalSessions listingImgURL proficiency")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Learner sessions retrieved", success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get sessions where user is teacher
export const getTeacherSessions = async (req, res) => {
  try {
    const teacherID = req.user.userId;
    const sessions = await Session.find({ teacherID })
      .populate("learnerID", "fullname profile.profilePhoto")
      .populate("skillListingID", "title totalSessions listingImgURL proficiency")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "Teacher sessions retrieved", success: true, sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get status of a session by skillListingID
export const getSessionStatus = async (req, res) => {
    try {
        const { skillListingID } = req.params;
        const userId = req.user.userId;
        if (!skillListingID) {
            return res.status(400).json({
                message: "Skill Listing ID is required",
                success: false
            });
        }
        // Prefer a completed session so "leave feedback" stays available even if
        // the learner booked ANOTHER, newer session for the same listing that
        // isn't completed yet. Fall back to the most recent session otherwise.
        let session = await Session.findOne({
            skillListingID,
            learnerID: userId,
            status: "completed"
        }).sort({ createdAt: -1 });

        if (!session) {
            session = await Session.findOne({
                skillListingID,
                learnerID: userId
            }).sort({ createdAt: -1 });
        }
        if (!session) {
            return res.status(200).json({
                message: "No session found for this user and skill listing",
                success: true,
                status: null
            });
        }
        return res.status(200).json({
            message: "Session status retrieved successfully",
            success: true,
            status: session.status
        });
    } catch (error) {
        console.error("Error getting session status:", error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};
