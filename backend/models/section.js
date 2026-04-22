import mongoose from "mongoose";

const SectionSchema = new mongoose.Schema({
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Course", required: true 
    },
    title: { type: String, required: true },
    objective: String,

    curriculumItems: {
        type: [{
            _id: false,
            order: { type: Number },
            itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
            itemType: { type: String, enum: ["Lecture", "Quiz"], required: true },
        }],
        default: []
    },
    // sectionDuration: { type: Number, default: 0 },
}, { timestamps: true });

const Section = mongoose.model("Section", SectionSchema);
export default Section;