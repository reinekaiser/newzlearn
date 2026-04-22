import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
    questionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    selectedOptionId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true 
    },
    isCorrect: { 
        type: Boolean, 
        required: true 
    },
    answeredAt: { 
        type: Date, 
        default: Date.now 
    }
}, { _id: true });

const LectureQuestionResultSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    lectureId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Lecture", 
        required: true 
    },
    answers: [AnswerSchema], 
}, { timestamps: true });

LectureQuestionResultSchema.index({ userId: 1, lectureId: 1 }, { unique: true });

const LectureQuestionResult = mongoose.model("LectureQuestionResult", LectureQuestionResultSchema);
export default LectureQuestionResult;