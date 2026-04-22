import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAddQuizToSectionMutation } from "@/redux/api/sectionApiSlice";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";

const QuizModal = ({ open, onOpenChange, courseId, sectionId }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [quizDescription, setQuizDescription] = useState("");
    const handleCloseQuizModal = (open) => {
        onOpenChange(open);
        if (!open) {
            setQuizTitle("");
            setQuizDescription("");
        }
    };


    const [addQuizToSection, isLoading] = useAddQuizToSectionMutation();

    const handleSaveQuiz = (open) => {
        console.log("save quiz")
        addQuizToSection({
            courseId,
            sectionId,
            quizData: { title: quizTitle, description: quizDescription },
        });
        onOpenChange(open);
        if (!open) {
            setQuizTitle("");
            setQuizDescription("");
        }
    };
    return (
        <Dialog open={open} onOpenChange={handleCloseQuizModal} className="overflow-hidden">
            <div className="overflow-hidden">
                <DialogContent
                    onPointerDownOutside={(e) => e.preventDefault()}
                    className="min-w-[700px] max-h-[500px] overflow-auto p-0 gap-0"
                >
                    <DialogHeader className={"px-5 py-4 border-b border-gray-300"}>
                        <DialogTitle>Thêm bài giảng mới</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 p-5">
                        <div>
                            <label className="block">Tiêu đề</label>
                            <input
                                type="text"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                className="w-full border rounded border-gray-300 px-3 py-2 mt-1 text-sm"
                                placeholder="Nhập tên quiz..."
                            />
                        </div>
                        <div>
                            <div className="">
                                <p>Mô tả bài giảng</p>
                                <div className="rounded-[6px] mt-2">
                                    <SimpleEditor value={quizDescription} onChange={setQuizDescription} placeholder={"Nhập mô tả quiz"} mention={null} type="basic"></SimpleEditor>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 px-5 pb-5">
                        <button
                            onClick={() => handleCloseQuizModal(false)}
                            className="hover:bg-gray-300 px-2 py-1 rounded cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            disabled={!quizTitle}
                            onClick={() => handleSaveQuiz(false)}
                            className="bg-primary px-2 py-1 rounded text-white cursor-pointer disabled:opacity-50 disabled:cursor-default"
                        >
                            Lưu quiz
                        </button>
                    </DialogFooter>
                </DialogContent>
            </div>
        </Dialog>
    );
};
export default QuizModal;
