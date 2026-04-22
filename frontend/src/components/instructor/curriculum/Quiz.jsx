import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import {  LuPencil } from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { MdOutlineDragIndicator } from "react-icons/md";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import "react-quill-new/dist/quill.snow.css";
import QuizQuestionModal from "./QuizQuestionModal";
import {
    useDeleteCurriculumItemMutation,
    useUpdateCurriculumItemMutation,
} from "@/redux/api/sectionApiSlice";
import Question from "./Question";
import QuizUploadModal from "./QuizUploadModal";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
const Quiz = ({ item, sectionOrder, quizOrder, sectionId, courseId, dragHandleProps, style }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [quizTitle, setQuizTitle] = useState(item.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [isQuizQuestionOpen, setIsQuizQuestionOpen] = useState(false);
    const [quizDescription, setQuizDescription] = useState(item.description || "");
    const [isQuizQuestionModalOpen, setIsQuizQuestionModalOpen] = useState(false);
    const [isQuizUploadModalOpen, setIsQuizUploadModalOpen] = useState(false);
    const [addQuestion, { isLoading: isAddingQuestion }] = useUpdateCurriculumItemMutation();
    const [updateTitle, { isLoading }] = useUpdateCurriculumItemMutation();

    const [isDeleteQuizModalOpen, setIsDeleteQuizModalOpen] = useState(false);
    const [deleteQuiz, { isLoading: isDeletingQuiz }] = useDeleteCurriculumItemMutation();
    const handleDeleteQuiz = async () => {
        await deleteQuiz({
            courseId,
            sectionId,
            itemId: item._id,
        }).unwrap();
        setIsDeleteQuizModalOpen(false);
    };
    return (
        <div style={style}>
            <div
                {...dragHandleProps}
                className={`cursor-grab active:cursor-grabbing border border-gray-300 p-3 ${
                    isQuizQuestionOpen ? "rounded-t" : "rounded"
                } bg-white`}
            >
                {!isEditingTitle ? (
                    <div
                        className="flex items-center relative"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <span>
                            Quiz {sectionOrder}.{quizOrder}: {quizTitle}
                        </span>
                        <div
                            className={`ml-2 flex items-center gap-1 transition-opacity duration-200 ${
                                isHovered ? "opacity-100" : "opacity-0"
                            }`}
                        >
                            <button
                                className="p-1 hover:bg-gray-200 rounded"
                                onClick={() => {
                                    setIsEditingTitle(true);
                                    setIsHovered(false);
                                    setIsQuizQuestionOpen(false);
                                }}
                            >
                                <LuPencil size={15} className="" />
                            </button>
                            <button
                                onClick={() => setIsDeleteQuizModalOpen(true)}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                <FaRegTrashAlt size={15} className="" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex">
                                <div
                                    onClick={() => setIsQuizQuestionOpen(!isQuizQuestionOpen)}
                                    className="p-1 w-6 h-6 hover:bg-gray-200 rounded"
                                >
                                    {isQuizQuestionOpen ? (
                                        <IoIosArrowUp></IoIosArrowUp>
                                    ) : (
                                        <IoIosArrowDown></IoIosArrowDown>
                                    )}
                                </div>
                                <MdOutlineDragIndicator
                                    className={`p-1 w-6 h-6 hover:bg-gray-200 rounded ${
                                        isHovered ? "opacity-100" : "opacity-0"
                                    }`}
                                ></MdOutlineDragIndicator>
                            </div>
                        </div>
                        <Dialog
                            open={isDeleteQuizModalOpen}
                            onOpenChange={setIsDeleteQuizModalOpen}
                        >
                            <DialogContent className={"min-w-[500px] gap-1 p-0"}>
                                <DialogHeader className={"p-4 pb-0"}>
                                    <DialogTitle className={"mb-0"}>Xác nhận</DialogTitle>
                                </DialogHeader>
                                <p className="px-4 mt-4">
                                    Bạn sắp xóa một quiz. Bạn có chắc chắn muốn tiếp tục không?
                                </p>
                                <DialogFooter className={"p-4"}>
                                    <button
                                        onClick={() => setIsDeleteQuizModalOpen(false)}
                                        className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        disabled={isDeletingQuiz}
                                        onClick={handleDeleteQuiz}
                                        className={`px-4 cursor-pointer py-1 bg-primary text-white rounded hover:bg-primary/70 font-medium ${
                                            isDeletingQuiz ? "opacity-60" : ""
                                        }`}
                                    >
                                        {isDeletingQuiz ? "Đang xóa" : "OK"}
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div>
                        <div className="flex gap-2 items-baseline">
                            <span>Quiz: </span>
                            <div className="flex-1 space-y-3 ml-2">
                                <input
                                    autoFocus
                                    onChange={(e) => setQuizTitle(e.target.value)}
                                    value={quizTitle}
                                    className="w-full border focus:border-primary border-gray-300 rounded px-2 py-[6px]"
                                />
                                <div className="rounded-[6px] mt-2">                                   
                                    <SimpleEditor value={quizDescription} onChange={setQuizDescription} placeholder={"Nhập mô tả quiz"} mention={null} type="basic"></SimpleEditor>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-3">
                            <button
                                onClick={() => {
                                    setIsEditingTitle(false);
                                }}
                                className="font-medium hover:bg-gray-200 py-1 px-2 rounded"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => {
                                    updateTitle({
                                        courseId,
                                        sectionId,
                                        itemId: item._id,
                                        data: {
                                            itemType: "Quiz",
                                            title: quizTitle,
                                            description: quizDescription,
                                        },
                                    });
                                    setIsEditingTitle(false);
                                }}
                                className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {isQuizQuestionOpen && (
                <div className="border-l border-b border-r border-gray-300 rounded-b p-2 bg-white flex flex-col gap-3">
                    <div className="flex items-baseline gap-3">
                        <p className="font-bold">Câu hỏi</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsQuizQuestionModalOpen(true)}
                                className="px-3 py-1 flex items-center gap-2 border rounded text-primary"
                            >
                                Câu hỏi mới
                            </button>
                            <button
                                onClick={() => setIsQuizUploadModalOpen(true)}
                                className="px-3 py-1 flex items-center gap-2 border rounded text-primary"
                            >
                                Upload file
                            </button>
                            
                        </div>
                        <QuizQuestionModal
                            itemId={item._id}
                            open={isQuizQuestionModalOpen}
                            onOpenChange={setIsQuizQuestionModalOpen}
                            onAddQuestion={addQuestion}
                            sectionId={sectionId}
                            courseId={courseId}
                        ></QuizQuestionModal>
                        <QuizUploadModal sectionId={sectionId} quizId={item._id} open={isQuizUploadModalOpen} onOpenChange={setIsQuizUploadModalOpen}></QuizUploadModal>
                    </div>
                    {item.questions && (
                        <div className="space-y-2">
                            {item.questions.map((question, index) => (
                                <div key={index}>
                                    <Question
                                        quizId={item._id}
                                        question={question}
                                        index={index}
                                        sectionId={sectionId}
                                    ></Question>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Quiz;
