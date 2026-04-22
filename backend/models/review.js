import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
        default: "",
    },
    survey: {
        valuableInfo: {
            type: Boolean,
            default: null,
        },
        clearExplanation: { 
            type: Boolean,
            default: null,
        },
        engagingDelivery: { 
            type: Boolean,
            default: null,
        },
        helpfulPractice: { 
            type: Boolean,
            default: null,
        },
        accurateCourse: { 
            type: Boolean,
            default: null,
        },
        knowledgeableTeacher: { 
            type: Boolean,
            default: null,
        },
    },

}, { timestamps: true });

ReviewSchema.index({ courseId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model("Review", ReviewSchema);
export default Review;