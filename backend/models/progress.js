import mongoose from "mongoose";

const ProgressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemType: { type: String, enum: ["Lecture", "Quiz"] },
    // Tiến độ video hoặc bài đọc
    watchedSeconds: { type: Number, default: 0 },
    totalSeconds: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    // Nếu là Quiz
    submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "Submission" },
    isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

ProgressSchema.index({ userId: 1, courseId: 1, sectionId: 1, itemId: 1 }, { unique: true });

const Progress = mongoose.model("Progress", ProgressSchema);
export default Progress;