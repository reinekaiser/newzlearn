import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    likes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
        },
      },
    ],
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: "String", required: true },
    likes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: {
          type: String,
          enum: ["like", "love", "haha", "wow", "sad", "angry"],
        },
      },
    ],
    replies: [replySchema],
    isSolution: { type: Boolean, default: false },
    isTopComment:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

const QnASchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
    },
    type: { type: "String", require: true }, // Lý thuyết, Thử thách, ...
    title: { type: "String", required: true },
    content: { type: "String", required: true },
    comments: [commentSchema],
    isSolved: { type: Boolean, default: false },
    isRead:{ type: Boolean, default: false },
  },
  { timestamps: true }
);

const QnA = mongoose.model("QnA", QnASchema);
export default QnA;
