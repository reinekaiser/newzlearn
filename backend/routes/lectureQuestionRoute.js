import express from "express";
import { addLectureQuestions, deleteLectureQuestion, getLectureQuestionAnswer, getLectureQuestions, submitAnswer, updateLectureQuestion } from "../controllers/lectureQuestionController.js";


const router = express.Router();

router.route("/submit")
    .post(submitAnswer);
router.route("/getAnswer")
    .get(getLectureQuestionAnswer)

router.route("/:lectureId")
    .get(getLectureQuestions)
router.route("/add")
    .post(addLectureQuestions);
router.route("/update")
    .put(updateLectureQuestion);
router.route("/delete/:lectureId/:questionId")
    .delete(deleteLectureQuestion);

export default router;
    