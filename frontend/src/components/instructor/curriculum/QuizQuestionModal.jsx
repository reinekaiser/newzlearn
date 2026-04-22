import React, { useState, useRef, useEffect } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "react-toastify";
import ReactQuillNew from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";

const stripHtml = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const QuizQuestionModal = ({
    open,
    onOpenChange,
    initialData = null,
    sectionId,
    courseId,
    itemId,
    questionId,
    onAddQuestion = () => {},
    onUpdateQuestion = () => {},
}) => {
    const [options, setOptions] = useState(
        initialData?.options || [
            { optionText: "", optionExplanation: "", isCorrect: false },
            { optionText: "", optionExplanation: "", isCorrect: false },
            { optionText: "", optionExplanation: "", isCorrect: false },
        ]
    );
    const [questionText, setQuestion] = useState(initialData?.questionText || "");

    const [activeEditor, setActiveEditor] = useState(null);
    const quillRef = useRef(null);
    // Reset form when modal opens with new data
    useEffect(() => {
        if (open) {
            if (initialData) {
                setQuestion(initialData.questionText || "");
                setOptions(
                    initialData.options || [
                        { optionText: "", optionExplanation: "", isCorrect: false },
                        { optionText: "", optionExplanation: "", isCorrect: false },
                        { optionText: "", optionExplanation: "", isCorrect: false },
                    ]
                );
            } else {
                setQuestion("");
                setOptions([
                    { optionText: "", optionExplanation: "", isCorrect: false },
                    { optionText: "", optionExplanation: "", isCorrect: false },
                    { optionText: "", optionExplanation: "", isCorrect: false },
                ]);
            }
            setActiveEditor(null);
        }
    }, [open, initialData]);

    useEffect(() => {
        if (activeEditor && quillRef.current) {
            setTimeout(() => {
                const editor = quillRef.current.getEditor();
                if (editor) {
                    editor.focus();

                    const length = editor.getLength();
                    editor.setSelection(length, 0);
                }
            }, 0);
        }
    }, [activeEditor]);

    const addOption = () => {
        const newOption = {
            optionText: "",
            optionExplanation: "",
            isCorrect: false,
        };
        setOptions([...options, newOption]);
    };

    const removeOption = (index) => {
        if (options.length > 2) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);

            if (activeEditor && activeEditor.startsWith(`option-${index}`)) {
                setActiveEditor(null);
            }
        }
    };

    const updateOption = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index] = {
            ...newOptions[index],
            [field]: value,
        };
        setOptions(newOptions);
    };

    const setCorrectOption = (index) => {
        const newOptions = options.map((option, i) => ({
            ...option,
            isCorrect: i === index,
        }));
        setOptions(newOptions);
    };
    const handleSave = () => {
        if (!questionText || stripHtml(questionText).trim() === "") {
            toast.error("Nhập câu trả lời trước khi lưu", {
                position: "top-right",
                autoClose: 2000,
            });
            return;
        }

        if (options.length < 2) {
            toast.error("Điền ít nhất hai lựa chọn.", {
                position: "bottom-right",
            });
            return;
        }

        const hasCorrectAnswer = options.some((option) => option.isCorrect);
        if (!hasCorrectAnswer) {
            toast.error("Chọn câu trả lời đúng nhất.", {
                position: "bottom-right",
            });
            return;
        }

        const emptyOptions = options.filter(
            (option) =>
                !option.optionText || option.optionText.replace(/<(.|\n)*?>/g, "").trim() === ""
        );

        if (emptyOptions.length > 0) {
            toast.error("Điền các câu trả lời hoặc xóa những câu trả lời trống", {
                position: "bottom-right",
            });
            return;
        }
        const question = {
            questionText,
            options,
        };

        if (!initialData) {
            onAddQuestion({ courseId, sectionId, itemId, data: { itemType: "Quiz", question } });
        } else {
            onUpdateQuestion({ sectionId, quizId: itemId, questionId, data: question });
        }

        onOpenChange(false);
    };

    const handleCancel = () => {
        onOpenChange(false);
    };

    const modules = {
        toolbar: [["bold", "italic", "underline"], ["code-block"]],
    };

    const handleEditorClick = (editorId) => {
        setActiveEditor(editorId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-bold">
                        {initialData ? "Sửa câu hỏi" : "Tạo câu hỏi mới"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <label className="block font-semibold mb-2">Câu hỏi</label>

                        <div
                            onClick={() => handleEditorClick(`questionText`)}
                            className="rounded-[6px]"
                        >
                            <SimpleEditor
                                value={questionText}
                                onChange={setQuestion}
                                placeholder={"Nhập câu hỏi"}
                                mention={null}
                                type="question"
                            ></SimpleEditor>
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold mb-3">Câu trả lời</label>

                        {options.map((option, index) => (
                            <div key={option.id} className="mb-4">
                                <div className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        checked={option.isCorrect}
                                        onChange={() => setCorrectOption(index)}
                                        className="mt-4 w-5 h-5 cursor-pointer"
                                    />

                                    <div className="flex-1">
                                        <div>
                                            {activeEditor === `option-${index}` ? (
                                                <div className="rounded-[6px]">
                                                    {/* <ReactQuillNew
                                                        ref={quillRef}
                                                        value={option.optionText}
                                                        onChange={(value) =>
                                                            updateOption(index, "optionText", value)
                                                        }
                                                        modules={modules}
                                                        placeholder="Nhập câu trả lời."
                                                        className="quiz-option-editor"
                                                    /> */}
                                                    <SimpleEditor
                                                        ref={quillRef}
                                                        value={option.optionText}
                                                        onChange={(value) =>
                                                            updateOption(index, "optionText", value)
                                                        }
                                                        placeholder={"Nhập câu trả lời."}
                                                        mention={null}
                                                        type="basic"
                                                    ></SimpleEditor>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() =>
                                                        handleEditorClick(`option-${index}`)
                                                    }
                                                    className={`min-h-[60px] p-3 border rounded-md cursor-text hover:border-gray-400 transition-colors border-gray-300
                                                       `}
                                                >
                                                    {option.optionText
                                                        .replace(/<(.|\n)*?>/g, "")
                                                        .trim().length > 0 ? (
                                                        <div
                                                            dangerouslySetInnerHTML={{
                                                                __html: option.optionText,
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Nhập câu trả lời.
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 ml-4">
                                            {activeEditor === `explanation-${index}` ? (
                                                <div className="rounded-[6px]">
                                                    {/* <ReactQuillNew
                                                        ref={quillRef}
                                                        value={option.optionExplanation}
                                                        onChange={(value) =>
                                                            updateOption(
                                                                index,
                                                                "explanation",
                                                                value
                                                            )
                                                        }
                                                        modules={modules}
                                                        placeholder="Giải thích tại sao đây là câu trả lời tốt nhất hoặc sai."
                                                        className="quiz-explanation-editor"
                                                    /> */}
                                                    <SimpleEditor
                                                        ref={quillRef}
                                                        value={option.optionExplanation}
                                                        onChange={(value) =>
                                                            updateOption(
                                                                index,
                                                                "explanation",
                                                                value
                                                            )
                                                        }
                                                        placeholder={
                                                            "Giải thích tại sao đây là câu trả lời tốt nhất hoặc sai."
                                                        }
                                                        mention={null}
                                                        type="basic"
                                                    ></SimpleEditor>
                                                </div>
                                            ) : (
                                                <div
                                                    onClick={() =>
                                                        handleEditorClick(`explanation-${index}`)
                                                    }
                                                    className="p-3 border border-gray-300 rounded-md cursor-text hover:border-gray-400 transition-colors text-sm"
                                                >
                                                    {option.optionExplanation
                                                        ?.replace(/<(.|\n)*?>/g, "")
                                                        .trim().length > 0 ? (
                                                        <div
                                                            dangerouslySetInnerHTML={{
                                                                __html: option.optionExplanation,
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            Giải thích tại sao đây là câu trả lời
                                                            tốt nhất hoặc sai.
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => removeOption(index)}
                                        disabled={options.length <= 2}
                                        className={`mt-4 p-2 rounded ${
                                            options.length <= 2
                                                ? "text-gray-300 cursor-not-allowed"
                                                : "text-gray-500 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Add Option Button */}
                        <button
                            onClick={addOption}
                            className="mt-2 px-4 py-2 text-blue-600 hover:bg-primary/5 rounded-md font-medium transition-colors"
                        >
                            + Thêm câu trả lời
                        </button>
                    </div>
                </div>

                <DialogFooter>
                    <button
                        onClick={handleCancel}
                        className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 "
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/70 font-medium"
                    >
                        {initialData ? "Sửa câu hỏi" : "Lưu câu hỏi"}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Demo component to show usage
export default QuizQuestionModal;
