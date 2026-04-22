import mongoose from "mongoose";

const QuestionAnswerSchema = new mongoose.Schema({
    displayedAt: { type: Number }, // time in seconds 
    questionText: { type: String },
    options: [{
        optionText: { type: String },
        textExplanation: { type: String },
        isCorrect: { type: Boolean },
    }],
}, { _id: true });

const LectureQuestionSchema = new mongoose.Schema({
    lectureId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Lecture", 
        required: true 
    },
    questions: [QuestionAnswerSchema],
}, { timestamps: true });

LectureQuestionSchema.index({ lectureId: 1 }, { unique: true });

const LectureQuestion = mongoose.model("LectureQuestion", LectureQuestionSchema);
export default LectureQuestion;