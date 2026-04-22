import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: "Section", required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedOptionIndex: { type: Number },
        isTrue: { type: Boolean }
    }],
    score: { type: Number, default: 0 },
    currentQuestion: { type: Number, default: 0 },
    isFinished: { type: Boolean, default: false },
}, { timestamps: true });

SubmissionSchema.index({ userId: 1, courseId: 1, sectionId: 1, quizId: 1 }, { unique: true });
const Submission = mongoose.model("Submission", SubmissionSchema);

export default Submission;