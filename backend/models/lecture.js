import mongoose from "mongoose";

const ChunkSchema = new mongoose.Schema({
    text: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    embedding: { type: [Number], required: true }, // Array of floats
    metadata: {
        startTime: Number, // Cho video
        endTime: Number,
        language: String,
    }
});

const LectureSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["video", "article"] },
    description: { type: String },
    content: {
        s3Key: { type: String },
        publicURL: { type: String },
        hlsURL: { type: String },
        duration: { type: Number }, // duration in seconds
        text: { type: String },
        thumbnailS3Key : { type: String },
        thumbnailURL: { type: String },
        fileName: { type: String },
        captions: [
            {
                s3Key: String,
                publicURL: String,
                language: String,
                isTranslation: Boolean,
                status: { type: String, enum: ["uploaded", "auto-generated", "edited"] },
            },
        ],
    },
    // order: { type: Number, required: true },
    resources: {
        type: [{
            type: { type: String },
            s3Key: { type: String },
            publicURL: { type: String },
            fileName: { type: String },
            urlTitle: { type: String },
            url: { type: String },
        }],
        default: []
    },

    chunks: [ChunkSchema],
    embeddingMetadata: {
        isIndexed: { type: Boolean, default: false },
        totalChunks: { type: Number, default: 0 },
        embeddingModel: { type: String, default: 'text-embedding-3-small' },
        lastIndexedAt: Date,
        sourceLanguage: String, // Ngôn ngữ của caption được dùng
    }
}, { timestamps: true });

// LectureSchema.index({ 'chunks.embedding': 1 });
const Lecture = mongoose.model("Lecture", LectureSchema);
export default Lecture;