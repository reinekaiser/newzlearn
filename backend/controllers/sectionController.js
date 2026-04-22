import mongoose from "mongoose";
import Course from "../models/course.js";
import Lecture from "../models/lecture.js";
import Quiz from "../models/quiz.js";
import Section from "../models/section.js";
import { deleteMultipleS3Files, uploadBase64ImagesInContent } from "./uploadController.js";
import { lectureChatAgent } from "../utils/chatbot/agent.js";

const getAllSectionsByCourse = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const course = await Course.findOne({ alias: courseAlias }).populate("sections.sectionId");
        if (!course) return res.status(404).json({ message: "Course not found" });
        const sortedSections = course.sections
            .sort((a, b) => a.order - b.order)
            .map((sec) => {
                // Nếu populate thành công, sec.sectionId là một object Section
                const sectionData = sec.sectionId?.toObject ? sec.sectionId.toObject() : {};
                return {
                    ...sectionData, // toàn bộ thuộc tính của section
                    order: sec.order, // thêm order tương ứng
                };
            });

        res.status(200).json(sortedSections);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getAllCurriculumItemsBySection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });

        const curriculumItems = await Promise.all(
            section.curriculumItems.map(async (item) => {
                let detailedItem = null;

                if (item.itemType === "Lecture") {
                    detailedItem = await Lecture.findById(item.itemId);
                } else if (item.itemType === "Quiz") {
                    detailedItem = await Quiz.findById(item.itemId);
                }

                if (detailedItem) {
                    return {
                        order: item.order,
                        itemType: item.itemType,
                        itemContent: detailedItem,
                    };
                }
                return null;
            })
        );

        const validItems = curriculumItems.filter((item) => item !== null);

        validItems.sort((a, b) => a.order - b.order);

        res.status(200).json(validItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const addSectionToCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { title, objective } = req.body; // description có thể undefined

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionData = { course: courseId, title };
        if (objective) sectionData.objective = objective;

        const newSection = new Section(sectionData);
        await newSection.save();

        const newOrder = course.sections.length + 1;

        course.sections.push({
            sectionId: newSection._id,
            order: newOrder,
        });

        await course.save();

        res.status(201).json({
            ...newSection.toObject(),
            order: newOrder,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const updateSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const { title, objective, curriculumItems } = req.body;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);

        if (!section) return res.status(404).json({ message: "Section not found" });
        if (title !== undefined) section.title = title;
        if (objective !== undefined) section.objective = objective;
        if (curriculumItems) section.curriculumItems = curriculumItems;

        await section.save();
        res.status(200).json(section);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });
        // xoá cirriculums
        for (const item of section.curriculumItems) {
            if (item.itemType === "Lecture") {
                const lecture = await Lecture.findById(item.itemId);

                if (!lecture) return;
                course.courseDuration -= lecture.content?.duration;

                const s3KeysToDelete = [];

                if (lecture.content?.s3Key) {
                    s3KeysToDelete.push(lecture.content.s3Key);
                }

                if (lecture.content?.thumbnailS3Key) {
                    s3KeysToDelete.push(lecture.content.thumbnailS3Key);
                }

                if (lecture.resources && lecture.resources.length > 0) {
                    lecture.resources.forEach((resource) => {
                        if (resource.s3Key) {
                            s3KeysToDelete.push(resource.s3Key);
                        }
                    });
                }

                if (s3KeysToDelete.length > 0) {
                    await deleteMultipleS3Files(s3KeysToDelete);
                }

                await Lecture.findByIdAndDelete(item.itemId);
            } else if (item.itemType === "Quiz") {
                await Quiz.findByIdAndDelete(item.itemId);
            }
        }

        await Section.findByIdAndDelete(sectionId);

        const index = course.sections.findIndex((se) => se.sectionId.toString() === sectionId);
        if (index !== -1) {
            course.sections.splice(index, 1);
        }
        await course.save();
        res.status(200).json({ message: "Section deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const addLectureToSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const { title, description, type } = req.body;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });

        const newOrder = section.curriculumItems.length + 1;

        let newLecture;

        if (type === "video") {
            const { s3Key, publicURL, duration, thumbnailS3Key, thumbnailURL, fileName } = req.body;
            newLecture = new Lecture({
                type,
                courseId,
                sectionId,
                title,
                ...(description && { description }),
                content: {
                    s3Key,
                    publicURL,
                    duration,
                    thumbnailS3Key,
                    thumbnailURL,
                    fileName,
                },
            });
        } else if (type === "article") {
            const { text, duration } = req.body;
            const processText = await uploadBase64ImagesInContent(
                courseId,
                text,
                "lecture-article-image"
            );
            newLecture = new Lecture({
                type,
                courseId,
                sectionId,
                title,
                ...(description && { description }),
                content: {
                    text: processText,
                    duration,
                },
            });
        }

        await newLecture.save();

        course.courseDuration += newLecture.content.duration;

        section.curriculumItems.push({
            order: newOrder,
            itemId: newLecture._id,
            itemType: "Lecture",
        });
        await section.save();
        await course.save();
        res.status(201).json(newLecture);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const addQuizToSection = async (req, res) => {
    try {
        const { courseId, sectionId } = req.params;
        const { title, description } = req.body;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });

        const newOrder = section.curriculumItems.length + 1;
        let newItem;

        newItem = new Quiz({
            courseId,
            sectionId,
            title,
            ...(description && { description }),
        });

        await newItem.save();
        section.curriculumItems.push({
            order: newOrder,
            itemId: newItem._id,
            itemType: "Quiz",
        });
        await section.save();
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const updateCurriculumItem = async (req, res) => {
    try {
        const { courseId, sectionId, itemId } = req.params;
        const {
            itemType,
            title,
            description,
            order,
            type,
            content,
            resource, // for Lecture
            question,
        } = req.body;

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });
        const curriculumItemIndex = section.curriculumItems.findIndex(
            (ci) => ci.itemId.toString() === itemId
        );
        if (curriculumItemIndex === -1)
            return res.status(404).json({ message: "Curriculum item not found in section" });

        if (order !== undefined) {
            section.curriculumItems[curriculumItemIndex].order = order;
            await section.save();
        }

        let item;
        if (itemType === "Lecture") {
            item = await Lecture.findById(itemId);
            item.title = title || item.title;
            item.description = description || item.description;
            item.type = type || item.type;
            if (content) {
                if ("text" in content) {
                    content.text = await uploadBase64ImagesInContent(
                        courseId,
                        content.text,
                        "lecture-article-image"
                    );
                }
                course.courseDuration -= item.content.duration;
                item.content = content;
                course.courseDuration += content.duration;
                await course.save();
            }

            if (resource) {
                item.resources.push(resource);
            }
            await item.save();
        } else if (itemType === "Quiz") {
            item = await Quiz.findById(itemId);
            item.title = title || item.title;
            item.description = description || item.description;
            if (question) {
                item.questions.push(question);
            }
            await item.save();
        }
        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteCurriculumItem = async (req, res) => {
    try {
        const { courseId, sectionId, itemId } = req.params;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: "Course not found" });

        const sectionInCourse = course.sections.find((se) => se.sectionId.toString() === sectionId);
        if (!sectionInCourse)
            return res.status(404).json({ message: "Section not found in course" });

        const section = await Section.findById(sectionId);
        if (!section) return res.status(404).json({ message: "Section not found" });

        const itemToDelete = section.curriculumItems.find(
            (item) => item.itemId.toString() === itemId
        );

        if (!itemToDelete) {
            return res.status(404).json({
                message: "Curriculum item not found in section",
            });
        }

        const deletedOrder = itemToDelete.order;

        if (itemToDelete.itemType === "Lecture") {
            const lecture = await Lecture.findById(itemId);
            if (!lecture) return;

            course.courseDuration -= lecture.content.duration;
            const s3KeysToDelete = [];

            if (lecture.content?.s3Key) {
                s3KeysToDelete.push(lecture.content.s3Key);
            }

            if (lecture.content?.thumbnailS3Key) {
                s3KeysToDelete.push(lecture.content.thumbnailS3Key);
            }

            if (lecture.resources && lecture.resources.length > 0) {
                lecture.resources.forEach((resource) => {
                    if (resource.s3Key) {
                        s3KeysToDelete.push(resource.s3Key);
                    }
                });
            }

            if (s3KeysToDelete.length > 0) {
                await deleteMultipleS3Files(s3KeysToDelete);
            }

            await Lecture.findByIdAndDelete(itemId);
            await course.save();
        } else if (itemToDelete.itemType === "Quiz") {
            await Quiz.findByIdAndDelete(itemId);
        }

        section.curriculumItems = section.curriculumItems.filter(
            (item) => item.itemId.toString() !== itemId
        );

        section.curriculumItems.forEach((item) => {
            if (item.order > deletedOrder) {
                item.order = item.order - 1;
            }
        });

        section.curriculumItems.sort((a, b) => a.order - b.order);
        await section.save();

        res.json({
            success: true,
            message: "Curriculum item deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteResourceFromLecture = async (req, res) => {
    try {
        const { lectureId, resourceId } = req.params;
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) return res.status(404).json({ message: "Lecture not found" });

        const resource = lecture.resources.id(resourceId);
        if (!resource) return res.status(404).json({ message: "Resource not found" });

        resource.deleteOne();
        await lecture.save();
        res.status(200).json({ message: "Resource deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const updateQuestionInQuiz = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;
        const { questionText, options } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            console.log("not found quiz");
            return res.status(404).json({ message: "Quiz not found" });
        }

        const question = quiz.questions.id(questionId);
        if (!question) {
            console.log("not found question");
            return res.status(404).json({ message: "Question not found" });
        }

        if (questionText !== undefined) question.questionText = questionText;
        if (options !== undefined) question.options = options;

        await quiz.save();

        res.status(200).json(question);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const deleteQuestionFromQuiz = async (req, res) => {
    try {
        const { quizId, questionId } = req.params;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        const question = quiz.questions.id(questionId);
        if (!question) return res.status(404).json({ message: "Question not found" });

        question.deleteOne();

        await quiz.save();

        res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const uploadQuestionsToQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { questions } = req.body;

        console.log(req.body)
        if (!questions || questions.length === 0) {
            return res.status(400).json({ message: "Không có câu hỏi nào để thêm" });
        }

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: "Không tìm thấy quiz" });
        }

        for (let i = 0; i < questions.length; i++) {
            const hasCorrectAnswer = questions[i].options.some((opt) => opt.isCorrect);

            if (!hasCorrectAnswer) {
                return res.status(400).json({
                    message: `Câu hỏi ${i + 1} không có đáp án đúng`,
                });
            }

            if (questions[i].options.length < 2) {
                return res.status(400).json({
                    message: `Câu hỏi ${i + 1} phải có ít nhất 2 đáp án`,
                });
            }
        }

        quiz.questions.push(...questions);
        await quiz.save();

        res.status(200).json({
            message: `Đã thêm ${questions.length} câu hỏi vào quiz`,
            quiz,
        });
    } catch (error) {
        console.error("Error adding questions:", error);
        res.status(500).json({
            message: "Lỗi server khi thêm câu hỏi",
            error: error.message,
        });
    }
};

const callLectureChatbotAgent = async (req, res) => {
    const { lectureId } = req.params;
    const { question, threadId } = req.body;
    
    if (!question || !question.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Question is required'
        });
    }
    
    
    try {
        // Kiểm tra lecture có tồn tại và đã được index
        const lecture = await Lecture.findById(lectureId)
            .select('title type embeddingMetadata');
        
        if (!lecture) {
            return res.status(404).json({
                success: false,
                error: 'Lecture not found'
            });
        }
        
        if (!lecture.embeddingMetadata?.isIndexed) {
            return res.status(400).json({
                success: false,
                error: 'Lecture has not been indexed yet. Please wait for indexing to complete.',
                needsIndexing: true
            });
        }
        
        // Gọi agent
        const result = await lectureChatAgent(
            lectureId,
            question,
            threadId
        );
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('Agent chat error:', error);
        res.status(500).json({
            success: false,
            error: 'Đã xảy ra lỗi khi xử lý câu hỏi của bạn',
            details: error.message
        });
    }
}

export {
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
    callLectureChatbotAgent
};
