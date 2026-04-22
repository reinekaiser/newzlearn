// import mongoose from "mongoose";

// const AnswerSchema = new mongoose.Schema({
//     questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
//     content: { type: String, required: true, maxlength: 10000 },
//     answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     answererRole: { type: String, enum: ["student", "instructor"], required: true },
//     isAccepted: { type: Boolean, default: false },
//     parentAnswer: { type: mongoose.Schema.Types.ObjectId, ref: "Answer" },
//     depth: { type: Number, default: 0, max: 3 },
//     repliesCount: { type: Number, default: 0 },
//     isEdited: { type: Boolean, default: false },
//     editHistory: [
//         {
//             content: String,
//             editedAt: { type: Date, default: Date.now },
//             editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//         },
//     ],
//     reactions: [
//         {
//             userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//             type: { type: String, enum: ["like", "sad", "love", "haha", "angry"], required: true },
//             reactedAt: { type: Date, default: Date.now },
//         },
//     ],
// });

// const Answer = mongoose.model("Answer", AnswerSchema);