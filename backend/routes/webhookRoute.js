import express from "express";
import { handleCaptionWebhook, handleVideoWebhook } from "../controllers/courseController.js";

const router = express.Router();

router.post("/conversion-complete", handleVideoWebhook);
router.post("/transcription", handleCaptionWebhook);

export default router;
