import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const publicRoute = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    // 🚫 Không có token → cho qua
    if (!token) {
      req.user = null;
      return next();
    }

    // Có token → verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      req.user = null;
      return next();
    }

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      req.user = null;
      return next();
    }

    // ✅ Logged in user
    req.user = user;
    next();
  } catch (error) {
    console.log("optionalAuth error:", error.message);
    req.user = null;
    next();
  }
};