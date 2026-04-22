import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js"
import { getStudentProfile, getStudentsInCourse } from "../controllers/studentController.js";

const router = express.Router();

router.get("/:studentId/", protectRoute, getStudentProfile)
router.get("/course/:courseId/", protectRoute, getStudentsInCourse)

export default router;