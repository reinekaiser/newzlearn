import LectureQuestion from "../models/lectureQuestion.js";
import LectureQuestionResult from "../models/lectureQuestionResult.js";

export const getLectureQuestions = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const lectureQuestions = await LectureQuestion.findOne({ lectureId });

        if (!lectureQuestions) {
            return res.status(200).json({ questions: [] });
        }

        res.status(200).json(lectureQuestions);

    } catch (error) {
        console.error("Error fetching lecture questions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const addLectureQuestions = async (req, res) => {
    try {
        const { lectureId, question } = req.body;
        const lectureQuestions = await LectureQuestion.findOne({ lectureId });

        if (!lectureQuestions) {
            const newLectureQuestions = new LectureQuestion({
                lectureId,
                questions: [question],
            });
            await newLectureQuestions.save();

            return res.status(201).json(newLectureQuestions);
        } else {
            lectureQuestions.questions.push(question);
            await lectureQuestions.save();
        }

        res.status(200).json(lectureQuestions);

    } catch (error) {
        console.error("Error adding lecture questions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateLectureQuestion = async (req, res) => {
    try {
        const { lectureId, questionId, question } = req.body;

        const lectureQuestions = await LectureQuestion.findOne({ lectureId });

        if (!lectureQuestions) {
            return res.status(404).json({ message: "Lecture questions not found" });
        }

        const questionIndex = lectureQuestions.questions.findIndex(q => q._id.toString() === questionId);

        if (questionIndex === -1) {
            return res.status(404).json({ message: "Question not found" });
        }

        lectureQuestions.questions[questionIndex] = question;
        await lectureQuestions.save();

        res.status(200).json(lectureQuestions);

    } catch (error) {
        console.log("Error updating lecture question:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteLectureQuestion = async (req, res) => {
    try {
        const { lectureId, questionId } = req.params;

        const lectureQuestions = await LectureQuestion.findOne({ lectureId });

        if (!lectureQuestions) {
            return res.status(404).json({ message: "Lecture questions not found" });
        }

        const questionIndex = lectureQuestions.questions.findIndex(q => q._id.toString() === questionId);

        if (questionIndex === -1) {
            return res.status(404).json({ message: "Question not found" });
        }

        lectureQuestions.questions.splice(questionIndex, 1);
        await lectureQuestions.save();

        await LectureQuestionResult.updateMany(
            { lectureId: lectureId }, 
            {
                $pull: {
                    answers: { questionId: questionId } 
                }
            }
        );

        res.status(200).json(lectureQuestions);

    } catch (error) {
        console.log("Error deleting lecture question:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const submitAnswer = async (req, res) => {
    try {
        const { userId, lectureId, questionId, selectedOptionId } = req.body;
        const lectureQuestion = await LectureQuestion.findOne({ lectureId })
        if (!lectureQuestion) {
            return res.status(404).json({ message: "Lecture Question not found" });
        }

        const question = lectureQuestion.questions.id(questionId);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        const selectedOption = question.options.id(selectedOptionId);
        if (!selectedOption) {
            return res.status(400).json({ message: "Option not found" });
        }
        const isCorrect = selectedOption.isCorrect;

        let result = await LectureQuestionResult.findOne({ userId, lectureId });

        if (!result) {
            result = new LectureQuestionResult({
                userId, lectureId, answers: []
            });
        }

        const existingAnswerIndex = result.answers.findIndex(
            (ans) => ans.questionId.toString() === questionId
        );

        const newAnswerData = {
            questionId, selectedOptionId, isCorrect, answeredAt: new Date()
        };

        if (existingAnswerIndex > -1) {
            result.answers[existingAnswerIndex] = newAnswerData;
        } else {
            result.answers.push(newAnswerData);
        }

        await result.save();
        return res.status(200).json(result);

    } catch (error) {
        console.log("Error submit lecture question:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getLectureQuestionAnswer = async (req, res) => {
    try {
        const { userId, lectureId, questionId } = req.query;

        const lectureQuestionResult = await LectureQuestionResult.findOne({
            userId,
            lectureId
        });

        if (!lectureQuestionResult) {
            return res.status(200).json({ answers: [] });
        }

        if (!questionId) {
            return res.status(200).json({ answers: lectureQuestionResult.answers });
        }

        const answer = lectureQuestionResult.answers.find(
            (ans) => ans.questionId.toString() === questionId
        );

        return res.status(200).json({
            answer: answer || null
        });

    } catch (error) {
        console.error("Error get lecture question answer:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};