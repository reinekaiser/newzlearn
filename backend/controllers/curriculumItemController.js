import Lecture from "../models/lecture.js";
import Quiz from "../models/quiz.js";

export const getCurriculumItemById = async (req, res) => {
    try {
        const { itemId, itemType } = req.params;
        let item = null;

        if (itemType === "Lecture"){
            item = await Lecture.findById(itemId);
        } else if (itemType === "Quiz"){
            item = await Quiz.findById(itemId);
        }
        
        if (!item){
            res.status(404).json({ message: "Item not found" })
        }

        res.status(200).json(
            item
        )
    } catch (error) {
        console.log("Error get curriculum item", error)
        res.status(500).json({message: "Server error"})
    }
}