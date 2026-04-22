import express from "express";
import { getProfile, updateProfile, changePassword } from "../controllers/profileController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, getProfile);
router.put("/", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);

export default router;

