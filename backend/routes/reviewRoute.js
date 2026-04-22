import express from "express";

import { protectRoute } from "../middleware/authMiddleware.js"
import { createOrUpdateReview, deleteReviewById, getAllReviews, getReviews, getReviewsByCourse, getReviewsByUser, getSurveyStatistics } from "../controllers/reviewController.js";
const router = express.Router();

router.get("/", getReviews);
router.get("/all", getAllReviews);

router.get("/survey-stats/:courseId", getSurveyStatistics);

router.route("/my-reviews")
    .get(protectRoute, getReviewsByUser)
    .post(protectRoute, createOrUpdateReview);

router.route("/:courseId")
    .get(getReviewsByCourse)

router.route("/delete/:id")
    .delete(protectRoute, deleteReviewById);


export default router;