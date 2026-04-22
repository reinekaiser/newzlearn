import express from 'express';
import {
    createVideoNote,
    getVideoNotesByCourse,
    getVideoNotesByLecture,
    getVideoNotesBySection,
    getSectionByLecture,
    updateVideoNote,
    deleteVideoNote
} from '../controllers/videoNoteController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(protectRoute);

// Routes
router.route('/')
    .post(createVideoNote);

router.route('/course/:courseId')
    .get(getVideoNotesByCourse);

router.route('/lecture/:lectureId')
    .get(getVideoNotesByLecture);

router.route('/lecture/:lectureId/section')
    .get(getSectionByLecture);

router.route('/section/:sectionId')
    .get(getVideoNotesBySection);

router.route('/:id')
    .put(updateVideoNote)
    .delete(deleteVideoNote);

export default router;
