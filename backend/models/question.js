// import mongoose from "mongoose";

// const QuestionSchema = new mongoose.Schema({
//     title: { type: String, required: true, maxlength: 200 },
//     content: { type: String, required: true },
//     askedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
//     sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
//     lectureId: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
//     status: { type: String, enum: ["open", "answered", "resolved", "closed"], default: "open" },
//     views: { type: Number, default: 0 },
//     category: { type: String, enum: ["technical", "content", "general", "bug-report"], default: "general" },
//     acceptedAnswer: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
//     lastActivityAt: { type: Date, default: Date.now },
// });

// const Question = mongoose.model("Question", QuestionSchema);

// export default Question;