import mongoose from "mongoose";

const CourseProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    totalItems: { type: Number, default: 0 }, 
    completedItems: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

CourseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CourseProgress = mongoose.model("CourseProgress", CourseProgressSchema);
export default CourseProgress;