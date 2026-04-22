import mongoose from "mongoose";

const VideoNoteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    lectureId: { type: mongoose.Schema.Types.ObjectId, ref: "Lecture", required: true },
    timestamp: { type: Number, required: true, min: 0 },
    content: { type: String, required: true },
});

const VideoNote = mongoose.model("VideoNote", VideoNoteSchema);
export default VideoNote;