import express from "express";
import {
    getCourseByAlias,
    getAllCourses,
    getCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseInfo,
    processCourse,
    getSearchCourseSuggestion,
    getSearchCourseResults,
    generateCaption,
    getCaptionVideoStatus,
    addCaptionVideo,
    getAllCoursesInfo,
    searchCourses,
    getInstructorCourses,
    deleteCaptionVideo,
    getCaptionContent,
    updateCaption,
} from "../controllers/courseController.js";

import {
    getAllSectionsByCourse,
    getAllCurriculumItemsBySection,
    addSectionToCourse,
    updateSection,
    deleteSection,
    addLectureToSection,
    addQuizToSection,
    updateCurriculumItem,
    deleteCurriculumItem,
    deleteResourceFromLecture,
    updateQuestionInQuiz,
    deleteQuestionFromQuiz,
    uploadQuestionsToQuiz,
    callLectureChatbotAgent,
} from "../controllers/sectionController.js";

import { getCurriculumItemById } from "../controllers/curriculumItemController.js";
import { protectRoute } from "../middleware/authMiddleware.js"
import { publicRoute } from "../middleware/publicMiddleware.js"; // cho phép unauth và auth đi qua, nhưng auth trả về req.user => để tracking
import { getRecommendations } from "../controllers/userRecommendationController.js";
const router = express.Router();

//search
router.route("/suggestion")
    .get(publicRoute, getSearchCourseSuggestion)
router.route("/suggestion/results")
    .get(publicRoute, getSearchCourseResults)
router.route("/getAllCoursesInfo")
    .get(getAllCoursesInfo)
router.route("/search")
    .get(searchCourses)
router.get("/instructor", getInstructorCourses)

router.get("/recommendation", protectRoute, getRecommendations)
router.get("/manage", getCourses);
//course
router.route("/alias/:courseAlias")
    .get(publicRoute, getCourseByAlias)
router.route("/")
    .get(getAllCourses)
    .post(createCourse);
router.route("/:courseAlias")
    .get(getCourseByAlias)
    .put(updateCourse)
    .delete(deleteCourse);
router.get("/:courseAlias/info", getCourseInfo)
router.post("/:courseAlias/process", processCourse)
// section
router.route("/:courseAlias/sections")
    .get(getAllSectionsByCourse)
router.post("/:courseId/sections", addSectionToCourse);
//.post("/:courseId/sections", addSectionToCourse);
router.route("/:courseId/sections/:sectionId")
    .put(updateSection)
    .delete(deleteSection);


// curriculum
router.route("/:courseId/sections/:sectionId/curriculum")
    .get(getAllCurriculumItemsBySection)

router.route("/:courseId/sections/:sectionId/curriculum/:itemId")
    .put(updateCurriculumItem)
    .delete(deleteCurriculumItem);

router.route("/:courseId/sections/:sectionId/lectures")
    .post(addLectureToSection)

router.route("/:courseId/sections/:sectionId/quizzes")
    .post(addQuizToSection)
// resources
router.delete(
    "/lectures/:lectureId/resources/:resourceId",
    deleteResourceFromLecture
);

// quiz questions
router.route("/quizzes/:quizId/questions/:questionId")
    .put(updateQuestionInQuiz)
    .delete(deleteQuestionFromQuiz);
router.route("/quizzes/:quizId/questions")
    .put(uploadQuestionsToQuiz)

router.route("/item/:itemId/type/:itemType").get(getCurriculumItemById);

router.post('/:courseId/generate-captions', generateCaption)
router.route('/:courseAlias/captions')
    .get(getCaptionVideoStatus)
    .post(addCaptionVideo)
    .delete(deleteCaptionVideo)
router.route('/:courseId/captions/:lectureId/:language/:itemType')
    .get(getCaptionContent)
    .put(updateCaption)

router.post('/lectures/:lectureId/chat/agent', callLectureChatbotAgent)

export default router;