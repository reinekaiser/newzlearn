import Progress from "../models/progress.js";
import CourseProgress from "../models/courseProgress.js";
import Lecture from "../models/lecture.js";
import Quiz from "../models/quiz.js";
import Course from "../models/course.js"
import Submission from "../models/submission.js";
import mongoose from "mongoose";

export const getCourseProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId } = req.params;
        const courseProgress = await updateCourseProgress(userId, courseId);

        res.status(200).json(courseProgress);
    } catch (error) {
        console.error("Error getting course progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllUserCoursesProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        if (!userId) {
            return res.status(400).json({ message: "Missing userId" });
        }
        const progressList = await CourseProgress.find({ userId })
            .populate("courseId", "title thumbnail alias")
            .lean();
        res.status(200).json(progressList || []);
    } catch (error) {
        console.error("Error getting all user courses progress:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export const getAllUserItemsProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId } = req.params;
        const progressList = await Progress.find({ userId, courseId });
        res.status(200).json(progressList || []);
    } catch (error) {
        console.error("Error getting course progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};
export const getItemProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId, sectionId, itemId } = req.params;
        const progress = await Progress.findOne({
            userId, courseId, sectionId, itemId,
        });

        if (!progress) {
            return res.json({
                watchedSeconds: 0,
                totalSeconds: 0,
                progressPercent: 0,
            });
        }

        if (progress.itemType === "Quiz") {
            const progressWithQuiz = await progress.populate("submissionId");
            return res.json(progressWithQuiz);
        }

        await updateItemPr(progress);

        res.json(progress);
    } catch (error) {
        console.error("Error getting item progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateItemPr = async (progress) => {
    try {
        const item = await Lecture.findById(progress.itemId);
        if (!item?.content?.duration) return;

        const newTotalSeconds = item.content.duration;

        if (progress.totalSeconds !== newTotalSeconds) {
            progress.totalSeconds = newTotalSeconds;
            progress.watchedSeconds = 0;
            progress.progressPercent = 0;
            progress.isCompleted = false;
        }

        await progress.save();
        return;
    } catch (error) {
        console.error("Error getting item progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateItemProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { courseId } = req.params;
        const { sectionId, itemId, itemType: type,
            watchedSeconds, totalSeconds, progressPercent
        } = req.body;
        if (!courseId || !sectionId || !itemId || !type) {
            return res.status(400).json({ message: "Missing required fields: courseId, sectionId, itemId, or itemType" });
        }
        if (type === "video") {
            if (watchedSeconds == null || totalSeconds == null || progressPercent == null) {
                return res.status(400).json({ message: "Missing video progress fields: watchedSeconds, totalSeconds, progressPercent" });
            }
        }
        const watched = Number(watchedSeconds) || 0;
        const total = Number(totalSeconds) || 0;
        const percent = Math.min(Number(progressPercent) || 0, 100);
        let ws = 0; //watchedSeconds
        if (type === "article") {
            ws = Math.floor((percent / 100) * total)
        }
        else if (type === "video") {
            ws = watched
        }

        const filter = { userId, courseId, sectionId, itemId };
        const existingProgress = await Progress.findOne(filter);
        if (existingProgress?.isCompleted) {
            await Progress.updateOne(
                { _id: existingProgress._id },
                {
                    $set: {
                        totalSeconds: total,
                        watchedSeconds: ws,
                        // progressPercent: percent,
                        updatedAt: new Date()
                    }
                }
            );
            const updated = await Progress.findById(existingProgress._id);
            return res.status(200).json(updated);
        }
        const update = {
            userId, courseId, sectionId, itemId,
            itemType: "Lecture",
            progressPercent: percent,
            isCompleted: percent >= 85,
            totalSeconds: total,
        };
        if (type === "video") {
            Object.assign(update, {
                watchedSeconds: ws,
            });
        } else if (type === "article") {
            Object.assign(update, {
                watchedSeconds: ws,
            });
        }
        const progress = await Progress.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true,
        });
        await updateCourseProgress(userId, courseId);

        res.status(200).json(progress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update progress failed" });
    }
};

export const updateCourseProgress = async (userId, courseId) => {
    try {
        const course = await Course.findById(courseId)
            .populate({
                path: "sections.sectionId",
                select: "curriculumItems"
            })
            .lean();

        if (!course) throw new Error("Course not found");

        const totalItems = course.sections.reduce((acc, section) => {
            const items = section.sectionId?.curriculumItems || [];
            return acc + items.length;
        }, 0);

        const completedItems = await Progress.countDocuments({
            userId, courseId, isCompleted: true,
        });

        const percentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

        const updated = await CourseProgress.findOneAndUpdate(
            { userId, courseId },
            {
                userId,
                courseId,
                totalItems,
                completedItems,
                percentage,
                isCompleted: percentage >= 100,
            },
            { upsert: true, new: true }
        );

        return updated;

    } catch (err) {
        console.error("Error updating course progress:", err);
        throw err;
    }
};

export const updateQuizProgress = async (req, res) => {
    try {
        const { userId, courseId, sectionId, quizId,
            answers, currentQuestion, isFinished, score, percentProgress
        } = req.body;

        if (!courseId || !sectionId || !quizId) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const submission = await Submission.findOneAndUpdate(
            { userId, courseId, sectionId, quizId },
            {
                userId, courseId, sectionId, quizId,
                answers,
                currentQuestion,
                isFinished,
                score: isFinished ? score : 0,
                updatedAt: new Date(),
            },
            { new: true, upsert: true }
        );

        const existingProgress = await Progress.findOne({
            userId, courseId, sectionId, itemId: quizId,
        });
        const finalIsCompleted = existingProgress?.isCompleted === true ? existingProgress?.isCompleted : isFinished;
        const pc = existingProgress?.progressPercent > percentProgress ? existingProgress?.progressPercent : percentProgress
        const progress = await Progress.findOneAndUpdate(
            { userId, courseId, sectionId, itemId: quizId },
            {
                $set: { submissionId: submission._id, updatedAt: new Date(), isCompleted: finalIsCompleted, progressPercent: pc },
                $setOnInsert: {
                    userId, courseId, sectionId, itemId: quizId,
                    itemType: "Quiz",
                    createdAt: new Date(),
                },
            },
            { new: true, upsert: true }
        );

        await updateCourseProgress(userId, courseId);

        res.status(200).json(progress);
    } catch (error) {
        console.error("Error updating quiz progress:", error);
        res.status(500).json({ message: "Server error" });
    }
};