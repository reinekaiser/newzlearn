import DOMPurify from "dompurify";
import { useState } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import QuizQuestionModal from "./QuizQuestionModal";
import {
    useDeleteQuestionFromQuizMutation,
    useUpdateQuestionInQuizMutation,
} from "@/redux/api/sectionApiSlice";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";

const Question = ({ question, sectionId, quizId, index }) => {
    const [isHoveredQuestion, setIsHoveredQuestion] = useState(false);

    const [isEditModalQuestion, setIsEditModalQuestion] = useState(false);
    const [updateQuestion] = useUpdateQuestionInQuizMutation();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteQuestionFromQuiz, { isLoading: isDeletingQuestion }] =
        useDeleteQuestionFromQuizMutation();

    const handelDeleteQuestion = () => {
        deleteQuestionFromQuiz({
            sectionId,
            quizId,
            questionId: question._id,
        }).unwrap();
        setIsDeleteModalOpen(false);
    };

    return (
        <div
            onMouseEnter={() => setIsHoveredQuestion(true)}
            onMouseLeave={() => setIsHoveredQuestion(false)}
            className="flex items-center justify-between"
        >
            <div className="flex gap-1">
                <span className="font-semibold">{index + 1}. </span>
                <div
                    dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(question.questionText),
                    }}
                />
            </div>
            <div className={`flex items-center ${isHoveredQuestion ? "opacity-100" : "opacity-0"}`}>
                <button
                    className="p-[6px] hover:bg-gray-200 rounded"
                    onClick={() => {
                        setIsEditModalQuestion(true);
                        setIsHoveredQuestion(false);
                    }}
                >
                    <LuPencil size={12} className="" />
                </button>
                <button
                    onClick={() => {
                        setIsDeleteModalOpen(true);
                        setIsHoveredQuestion(false);
                    }}
                    className="p-[6px] hover:bg-gray-200 rounded"
                >
                    <FaRegTrashAlt size={12} className="" />
                </button>
            </div>
            <QuizQuestionModal
                open={isEditModalQuestion}
                onOpenChange={setIsEditModalQuestion}
                initialData={question}
                onUpdateQuestion={updateQuestion}
                sectionId={sectionId}
                itemId={quizId}
                questionId={question._id}
            ></QuizQuestionModal>
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className={"min-w-[500px] gap-1 p-0"}>
                    <DialogHeader className={"p-4 pb-0"}>
                        <DialogTitle className={"mb-0"}>Xác nhận</DialogTitle>
                    </DialogHeader>
                    <p className="px-4 mt-4">
                        Bạn sắp xóa một câu hỏi. Bạn có chắc chắn muốn tiếp tục không?
                    </p>
                    <DialogFooter className={"p-4"}>
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50 "
                        >
                            Hủy
                        </button>
                        <button
                            disabled={isDeletingQuestion}
                            onClick={handelDeleteQuestion}
                            className="px-4 py-1 bg-primary text-white rounded hover:bg-primary/70 font-medium"
                        >
                            OK
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Question;
