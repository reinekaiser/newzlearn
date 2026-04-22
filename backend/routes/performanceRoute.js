import express from "express";
import {
    getCourseStats,
    getLearningItemsCountStats,
    getLearningMinutesStats,
    getRevenueOverview,
} from "../controllers/performanceController.js";

const router = express.Router();

router.get("/course/:courseId", getCourseStats);

router.get("/minutes-stats", getLearningMinutesStats);
router.get("/count-items-stats", getLearningItemsCountStats);
router.get("/revenue-overview", getRevenueOverview);

export default router;