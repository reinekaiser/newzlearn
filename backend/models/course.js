import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        alias: { type: String, default: "" },
        thumbnail: {
            publicURL: { type: String },
            s3Key: { type: String },
        },
        subtitle: { type: String, default: "" },
        description: { type: String, default: "" },
        learningOutcomes: [
            {
                type: String,
                default: [],
            },
        ],
        requirements: [
            {
                type: String,
                default: [],
            },
        ],
        intendedLearners: [
            {
                type: String,
                default: [],
            },
        ],

        language: { type: String, default: "Tiếng Việt" },
        level: {
            type: String,
            enum: ["Người mới bắt đầu", "Trung cấp", "Nâng cao", "Mọi trình độ"],
        },
        category: { type: String, default: "" },
        subcategory: { type: String, default: "" },
        isFree: { type: Boolean },
        status: { type: String, enum: ["draft", "processing", "published"], default: "draft" },
        price: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        sections: {
            type: [
                {
                    sectionId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Section",
                    },
                    order: Number,
                },
            ],
            default: [],
        },
        promoVideo: {
            publicURL: { type: String },
            s3Key: { type: String },
            thumbnailURL: { type: String },
            thumbnailS3Key: { type: String },
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
        courseDuration: { type: Number, default: 0 },
        publishedAt: { type: Date },
        // totalCurriculumItems: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Course = mongoose.model("Course", CourseSchema);
export default Course;
