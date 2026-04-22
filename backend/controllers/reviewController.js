import Course from "../models/course.js";
import Review from "../models/review.js";
import mongoose from "mongoose";

export const getReviewsByUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const reviews = await Review.find({ userId });
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

export const getReviewsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const reviews = await Review.find({ courseId })
            .populate("userId", "firstName lastName profilePicture")
            .populate("courseId", "title")
            .lean();
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

const updateCourseAverageRating = async (courseId) => {
    try {
        const stats = await Review.aggregate([
            {
                $match: { courseId: new mongoose.Types.ObjectId(courseId) }
            },
            {
                $group: {
                    _id: "$courseId",
                    averageRating: { $avg: "$rating" }
                }
            }
        ]);
        let averageRating = stats.length > 0 ? stats[0].averageRating : 0;
        averageRating = Math.round(averageRating * 100) / 100;
        
        await Course.findByIdAndUpdate(courseId, { averageRating: averageRating });

    } catch (error) {
        console.error("Error updating course average rating:", error);
    }
};

export const createOrUpdateReview = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId, rating, comment, survey } = req.body;

        let review = await Review.findOne({ userId, courseId });

        if (review) {
            review.rating = rating;
            review.comment = comment;
            review.survey = survey;
            await review.save();
        } else {
            review = new Review({
                userId,
                courseId,
                rating,
                comment,
                survey,
            });
            await review.save();
        }

        await updateCourseAverageRating(courseId);

        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

export const deleteReviewById = async (req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndDelete(id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        await updateCourseAverageRating(review.courseId);

        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};



export const getReviews = async (req, res) => {
    try {
        const { courseId, rating, sortBy, page, limit } = req.query;

        const filter = {};

        if (courseId && courseId !== "all" && mongoose.Types.ObjectId.isValid(courseId)) {
            filter.courseId = courseId;
        }

        const ratingNumber = Number(rating);
        if (!isNaN(ratingNumber)) {
            filter.rating = { $gte: ratingNumber };
        }

        let sortOption = { createdAt: -1 };
        switch (sortBy) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "highest":
                sortOption = { rating: -1, createdAt: -1 };
                break;
            case "lowest":
                sortOption = { rating: 1, createdAt: -1 };
                break;
        }

        const pageNumber = parseInt(page) > 0 ? parseInt(page) : 1;
        const pageSize = parseInt(limit) > 0 ? parseInt(limit) : 10;
        const skip = (pageNumber - 1) * pageSize;

        const totalReviews = await Review.countDocuments(filter);

        const reviews = await Review.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(pageSize)
            .populate("userId", "firstName lastName profilePicture")
            .populate("courseId", "title")
            .lean();

        res.status(200).json({
            reviews,
            totalPages: Math.ceil(totalReviews / pageSize),
            currentPage: pageNumber,
            totalReviews,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error });
    }
};


export const getSurveyStatistics = async (req, res) => {
    try {
        const { courseId } = req.params;

        const surveyStatsRaw = await Review.aggregate([
            {
                $match: {
                    courseId: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    valuableInfo: { $avg: { $cond: ["$survey.valuableInfo", 1, 0] } },
                    clearExplanation: { $avg: { $cond: ["$survey.clearExplanation", 1, 0] } },
                    engagingDelivery: { $avg: { $cond: ["$survey.engagingDelivery", 1, 0] } },
                    helpfulPractice: { $avg: { $cond: ["$survey.helpfulPractice", 1, 0] } },
                    accurateCourse: { $avg: { $cond: ["$survey.accurateCourse", 1, 0] } },
                    knowledgeableTeacher: { $avg: { $cond: ["$survey.knowledgeableTeacher", 1, 0] } }
                }
            }
        ]);

        const result = surveyStatsRaw[0];

        if (!result) {
            return res.status(200).json({ totalReviews: 0, stats: [] });
        }

        const keys = [
            "valuableInfo",
            "clearExplanation",
            "engagingDelivery",
            "helpfulPractice",
            "accurateCourse",
            "knowledgeableTeacher"
        ];

        const stats = keys.map(key => ({
            key,
            percent: Math.round((result[key] || 0) * 100)
        }));

        res.status(200).json({
            totalReviews: result.totalReviews,
            stats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error });
    }
};

export const getAllReviews = async (req, res) => {
    try {
        const { courseId, rating, sortBy } = req.query;

        const filter = {};

        if (courseId && courseId !== "all" && mongoose.Types.ObjectId.isValid(courseId)) {
            filter.courseId = courseId;
        }

        const ratingNumber = Number(rating);
        if (!isNaN(ratingNumber)) {
            filter.rating = { $gte: ratingNumber };
        }

        let sortOption = { createdAt: -1 };
        switch (sortBy) {
            case "newest":
                sortOption = { createdAt: -1 };
                break;
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "highest":
                sortOption = { rating: -1, createdAt: -1 };
                break;
            case "lowest":
                sortOption = { rating: 1, createdAt: -1 };
                break;
        }

        const reviews = await Review.find(filter)
            .sort(sortOption)
            .populate("userId", "firstName lastName profilePicture")
            .populate("courseId", "title")
            .lean();

        res.status(200).json({
            reviews,
            totalReviews: reviews.length, 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error", error });
    }
};