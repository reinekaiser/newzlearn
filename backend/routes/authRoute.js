import express from "express";
import {
  signup,
  login,
  logout,
  checkAuth,
  verifyEmail,
  resendVerificationEmail,
  googleAuth,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from "../controllers/authController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/google", googleAuth); // Google OAuth
router.get("/check", protectRoute, checkAuth);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// Forgot password routes
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token", verifyResetToken);
router.post("/reset-password", resetPassword);

export default router;
