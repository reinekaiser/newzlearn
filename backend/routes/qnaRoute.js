import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js"
import { createComment, createQNA, createReply, deleteComment, deleteQnA, deleteReply, getQnAByCourseId, getQnAById, getQnAByInstructor, getQnAByPage, updateAnswer, updateComment, updateIsRead, updateQnA, updateReactionComment, updateReactionReply, updateReply, upvoteComment } from "../controllers/qnaController.js";
const router = express.Router();

router.post("/createQnA", protectRoute, createQNA)
router.get("/", protectRoute, getQnAByPage)
router.get("/course/:courseId", protectRoute, getQnAByCourseId)
router.get("/instructor", getQnAByInstructor)
router.get("/:qnaId", protectRoute, getQnAById)
router.put("/:qnaId", protectRoute, updateQnA)
router.delete("/:qnaId", protectRoute, deleteQnA)

router.post("/:qnaId/comment", protectRoute, createComment)
router.put("/:qnaId/comment/:commentId/", protectRoute, updateComment)
router.delete("/:qnaId/comment/:commentId/", protectRoute, deleteComment)
router.put("/:qnaId/comment/:commentId/reaction", protectRoute, updateReactionComment)

router.post("/:qnaId/comment/:commentId/reply", protectRoute, createReply)
router.put("/:qnaId/comment/:commentId/reply/:replyId", protectRoute, updateReply)
router.delete("/:qnaId/comment/:commentId/reply/:replyId", protectRoute, deleteReply)
router.put("/:qnaId/comment/:commentId/reply/:replyId/reaction", protectRoute, updateReactionReply)

router.put("/:qnaId/isRead", protectRoute, updateIsRead)
router.put("/:qnaId/answer", protectRoute, updateAnswer)
router.put("/:qnaId/upvote/:commentId", protectRoute, upvoteComment)
export default router;