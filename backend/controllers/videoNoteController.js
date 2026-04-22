import VideoNote from '../models/video-note.js';
import Lecture from '../models/lecture.js';

// @desc    Create a new video note
// @route   POST /api/video-notes
// @access  Private
export const createVideoNote = async (req, res) => {
    try {
        const { content, timestamp, lectureId, courseId } = req.body;
        const userId = req.user._id;

        // Lấy thông tin lecture để lấy sectionId
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        console.log('Creating note for lecture:', lectureId, 'sectionId:', lecture.sectionId);

        const videoNote = await VideoNote.create({
            userId,
            courseId,
            sectionId: lecture.sectionId,
            lectureId,
            timestamp,
            content
        });

        console.log('Created video note:', videoNote);
        res.status(201).json(videoNote);
    } catch (error) {
        console.error('Error creating video note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Get video notes by course
// @route   GET /api/video-notes/course/:courseId
// @access  Private
export const getVideoNotesByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const notes = await VideoNote.find({
            userId,
            courseId
        }).populate('lectureId', 'title').sort({ createdAt: -1 });

        res.json(notes);
    } catch (error) {
        console.error('Error getting video notes by course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Get video notes by lecture
// @route   GET /api/video-notes/lecture/:lectureId
// @access  Private
export const getVideoNotesByLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        const userId = req.user._id;

        const notes = await VideoNote.find({
            userId,
            lectureId
        }).populate('lectureId', 'title').sort({ createdAt: -1 });

        res.json(notes);
    } catch (error) {
        console.error('Error getting video notes by lecture:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Get video notes by section
// @route   GET /api/video-notes/section/:sectionId
// @access  Private
export const getVideoNotesBySection = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const userId = req.user._id;

        console.log('Getting notes for sectionId:', sectionId, 'userId:', userId);

        // Debug: Kiểm tra tất cả notes của user
        const allUserNotes = await VideoNote.find({ userId });
        console.log('All user notes:', allUserNotes.map(note => ({
            id: note._id,
            sectionId: note.sectionId,
            lectureId: note.lectureId,
            content: note.content.substring(0, 50) + '...'
        })));

        const notes = await VideoNote.find({
            userId,
            sectionId
        }).populate('lectureId', 'title').sort({ createdAt: -1 });

        console.log('Found notes:', notes.length, 'notes');
        console.log('Notes data:', notes);

        res.json(notes);
    } catch (error) {
        console.error('Error getting video notes by section:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Get sectionId from lectureId
// @route   GET /api/video-notes/lecture/:lectureId/section
// @access  Private
export const getSectionByLecture = async (req, res) => {
    try {
        const { lectureId } = req.params;
        
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) {
            return res.status(404).json({ message: 'Lecture not found' });
        }

        res.json({ sectionId: lecture.sectionId });
    } catch (error) {
        console.error('Error getting section by lecture:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Update video note
// @route   PUT /api/video-notes/:id
// @access  Private
export const updateVideoNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { content, timestamp } = req.body;

        const note = await VideoNote.findById(id);
        if (!note) {
            return res.status(404).json({ message: 'Video note not found' });
        }

        // Kiểm tra quyền sở hữu
        if (note.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this note' });
        }

        const updatedNote = await VideoNote.findByIdAndUpdate(
            id,
            { content, timestamp },
            { new: true, runValidators: true }
        ).populate('lectureId', 'title');

        res.json(updatedNote);
    } catch (error) {
        console.error('Error updating video note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// @desc    Delete video note
// @route   DELETE /api/video-notes/:id
// @access  Private
export const deleteVideoNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const note = await VideoNote.findById(id);
        if (!note) {
            return res.status(404).json({ message: 'Video note not found' });
        }

        // Kiểm tra quyền sở hữu
        if (note.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this note' });
        }

        await VideoNote.findByIdAndDelete(id);

        res.json({ message: 'Video note deleted successfully' });
    } catch (error) {
        console.error('Error deleting video note:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
