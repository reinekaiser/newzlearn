import mongoose from "mongoose";

const VideoConversionSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
            index: true,
        },
        batchNumber: {
            type: Number,
            required: true,
        },
        totalVideos: {
            type: Number,
            required: true,
        },
        completedVideos: {
            type: Number,
            default: 0,
        },
        failedVideos: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
            index: true,
        },
        videoS3Keys: [String],
        startedAt: Date,
    },
    { timestamps: true }
);

const VideoConversion = mongoose.model("VideoConversion", VideoConversionSchema);
export default VideoConversion;
