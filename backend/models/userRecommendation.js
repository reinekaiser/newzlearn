import mongoose from "mongoose";

const RecommendationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    recommendedCourses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        score: Number,
      },
    ],
  },
  { timestamps: true }
);

RecommendationSchema.index({ user: 1 });
const UserRecommendation = mongoose.model("UserRecommendation", RecommendationSchema);
export default UserRecommendation;
