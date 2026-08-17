import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import * as sessionController from "../controllers/sessionController.js";

const router = express.Router();

router.post("/create", isAuthenticated, sessionController.createSession);
router.get("/learner", isAuthenticated, sessionController.getLearnerSessions);
router.get("/teacher", isAuthenticated, sessionController.getTeacherSessions);
router.patch("/:sessionId/status", isAuthenticated, sessionController.updateSessionStatus);
router.patch("/:sessionId/meeting-link", isAuthenticated, sessionController.updateMeetingLink);
router.patch("/:sessionId/propose-reschedule", isAuthenticated, sessionController.proposeReschedule);
router.patch("/:sessionId/respond-reschedule", isAuthenticated, sessionController.respondReschedule);
router.get("/:skillListingID/status", isAuthenticated, sessionController.getSessionStatus);

export default router;
