import express from "express";
import {
    createSession,
    deleteSession,
    endSession,
    getRTCToken,
    getSession,
    getSessions,
    getSessionsByCourse,
    joinSession,
    leaveSession,
    startSession,
    updateSession,
} from "../controllers/sessionController.js";

import { protectRoute } from "../middleware/authMiddleware.js"

const router = express.Router();

router.route("/").get(getSessions).post(createSession);
router.route("/:sessionId").get(getSession).put(updateSession).delete(deleteSession);

router.post("/:sessionId/join", protectRoute, joinSession);
router.post("/:sessionId/leave", protectRoute, leaveSession);
router.put("/:sessionId/start", protectRoute, startSession);
router.put("/:sessionId/end", protectRoute, endSession);
router.get("/course/:courseId/sessions", protectRoute, getSessionsByCourse);
router.post('/token/rtc', protectRoute, getRTCToken);
export default router;
