import express from "express";
import { sendAnnouncementMail } from "../controllers/announcementController.js";

const router = express.Router();

// POST /api/announcement/send
router.post("/send", sendAnnouncementMail);

export default router;
