import React, { useState, useEffect } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, RefreshCw, Circle } from "lucide-react";
import { useUpdateQuizProgressMutation } from "@/redux/api/progressApiSlice";

const stripHtml = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
};

const Quiz = ({ item, setIsDone, itemProgress, isProgressLoading }) => {
    const { userInfo } = useSelector((state) => state.auth);
    const questions = item.questions || [];
    const [step, setStep] = useState("loading");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [errorMessage, setErrorMessage] = useState("");

    const [updateQuizProgress] = useUpdateQuizProgressMutation();

    useEffect(() => {
        if (isProgressLoading) return;
        if (itemProgress?.submissionId) {
            const submission = itemProgress.submissionId;
            setAnswers(submission.answers || []);
            if (submission.isFinished) {
                setStep("finish");
            }
            else if (submission.currentQuestion == 0 || !submission.currentQuestion) {
                setStep("start");
            }
            else {
                setStep("quiz");
                setCurrentIndex(submission.currentQuestion - 1 || 0);
            }
        }
        else {
            setStep("start");
        }
    }, [itemProgress, isProgressLoading]);

    useEffect(() => {
        const startSubmission = async () => {
            try {
                if (userInfo?._id && item?._id && step === "start") {
                    await updateQuizProgress({
                        userId: userInfo._id,
                        courseId: item.courseId,
                        sectionId: item.sectionId,
                        quizId: item._id,
                        answers: [],
                        currentQuestion: 0,
                        isFinished: false,
                    }).unwrap();
                } else if (step !== "start") {
                    await updateQuizProgress({
                        userId: userInfo._id,
                        courseId: item.courseId,
                        sectionId: item.sectionId,
                        quizId: item._id,
                    }).unwrap();
                }
            } catch (err) {
                console.error("Lỗi khi khởi tạo tiến trình quiz:", err);
            }
        };

        if (userInfo?._id && item?._id) {
            startSubmission();
        }
    }, []);

    const startQuiz = () => {
        setStep("quiz");
        setCurrentIndex(0);
        setAnswers([]);
        setErrorMessage("");
    };

    const handleAnswer = (questionId, selectedOptionIndex) => {
        const isTrue =
            questions.find((q) => q?._id === questionId)?.options[
                selectedOptionIndex
            ]?.isCorrect || false;
        setAnswers((prev) => {
            const existing = prev.find((a) => a.questionId === questionId);
            if (existing) {
                return prev.map((a) =>
                    a.questionId === questionId
                        ? { ...a, selectedOptionIndex, isTrue }
                        : a
                );
            }
            return [...prev, { questionId, selectedOptionIndex, isTrue }];
        });
        setErrorMessage("");
    };

    const goNext = async () => {
        const q = questions[currentIndex];
        const found = answers.find((a) => a.questionId === q?._id);
        if (!found) {
            setErrorMessage("Vui lòng chọn đáp án trước khi tiếp tục.");
            return;
        }
        const pc = Math.round((answers.length / questions.length) * 100);
        const submissionProcessData = {
            userId: userInfo._id,
            courseId: item.courseId,
            sectionId: item.sectionId,
            quizId: item._id,
            answers,
            currentQuestion: answers.length,
            isFinished: false,
            percentProgress: pc
        };
        try {
            const res = await updateQuizProgress(submissionProcessData).unwrap();
            // console.log("Tiến trình lưu thành công:", res);
        } catch (error) {
            console.error("Lỗi khi lưu tiến trình làm bài quiz:", error);
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
            setErrorMessage("");
        } else {
            const percentage = Math.round((answers.filter((a) => a.isTrue).length / questions.length) * 100);
            const submissionData = {
                userId: userInfo._id,
                courseId: item.courseId,
                sectionId: item.sectionId,
                quizId: item._id,
                answers,
                score: percentage,
                currentQuestion: answers.length,
                isFinished: true,
            };
            try {
                const res = await updateQuizProgress(submissionData).unwrap();
                setIsDone(true);
                // console.log("Nộp bài thành công:", res);
            } catch (error) {
                console.error("Lỗi khi nộp bài quiz:", error);
            }
            setStep("finish");
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setErrorMessage("");
        }
    };

    if (step === "loading" || !item || !item.questions || !itemProgress || isProgressLoading) {
        return (
            <div className="px-20 py-12 space-y-6">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="px-20 py-12 text-center">
                <h2 className="text-2xl font-semibold mb-4">{item.title}</h2>
                <p className="text-gray-600">Bài trắc nghiệm này hiện chưa có câu hỏi nào.</p>
            </div>
        );
    }

    if (step === "start") {
        return (
            <div className="px-20 py-12">
                <h2 className="text-2xl font-semibold">{item.title}</h2>
                <p className="mt-2 text-gray-600">
                    Bài trắc nghiệm gồm {questions.length} câu hỏi
                </p>
                <button
                    onClick={startQuiz}
                    className="mt-10 px-4 py-2 bg-[#399cf3] hover:bg-[#2086df] text-white rounded"
                >
                    Bắt đầu làm trắc nghiệm
                </button>
            </div>
        );
    }

    if (step === "quiz") {
        const q = questions[currentIndex];
        const selected = answers.find((a) => a.questionId === q?._id);

        return (
            <div className="px-20 py-8">
                <p className="font-light text-lg">
                    Câu {currentIndex + 1} / {questions.length}:
                </p>
                <h3
                    className="mt-2 mb-4 font-light"
                    dangerouslySetInnerHTML={{ __html: q?.questionText }}
                />

                <RadioGroup
                    value={selected?.selectedOptionIndex?.toString() || ""}
                    onValueChange={(val) => {
                        handleAnswer(q?._id, val)
                    }}
                    className="space-y-2"
                >
                    {q?.options.map((opt, index) => (
                        <div
                            key={opt._id}
                            className="border border-gray-300 rounded-md px-4 py-3 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <RadioGroupItem
                                    value={index.toString()}
                                    id={`option-${opt._id}`}
                                    className="border border-gray-400"
                                />
                                <Label
                                    htmlFor={`option-${opt._id}`}
                                    className="text-gray-700 text-sm font-semibold w-full"
                                >
                                    <span
                                        dangerouslySetInnerHTML={{ __html: opt.optionText }}
                                    />
                                </Label>
                            </div>
                        </div>
                    ))}
                </RadioGroup>

                {errorMessage && (
                    <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                )}

                <div className="mt-6 flex space-x-3">
                    {currentIndex > 0 && (
                        <button
                            onClick={goBack}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Quay lại
                        </button>
                    )}
                    <button
                        onClick={goNext}
                        className="px-4 py-2 bg-[#399cf3] hover:bg-[#2086df] text-white rounded"
                    >
                        {currentIndex < questions.length - 1 ? "Tiếp theo" : "Hoàn thành"}
                    </button>
                </div>
            </div>
        );
    }

    if (step === "finish") {
        const correctCount = answers.filter((a) => a.isTrue).length;
        const totalQuestions = questions.length;
        const percentage = Math.round((correctCount / totalQuestions) * 100);

        let performanceMessage = "";
        if (percentage === 100) {
            performanceMessage = "Xuất sắc! Bạn đã trả lời đúng tất cả câu hỏi.";
        } else if (percentage >= 80) {
            performanceMessage = "Tuyệt vời! Kết quả của bạn rất tốt.";
        } else if (percentage >= 50) {
            performanceMessage = "Khá tốt! Cùng xem lại một vài câu trả lời nhé.";
        } else {
            performanceMessage = "Cần cố gắng thêm! Hãy xem lại các đáp án dưới đây.";
        }

        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Card className="mb-8 shadow-lg border-t-4 border-[#399cf3]">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold">
                            Kết quả trắc nghiệm
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        <div className="text-6xl font-bold text-gray-800">
                            <span className="text-[#399cf3]">{correctCount}</span>
                            <span className="text-gray-400"> / </span>
                            {totalQuestions}
                        </div>
                        <div className="text-2xl font-semibold text-gray-600">
                            (Đạt {percentage}%)
                        </div>
                        <p className="text-lg text-gray-700 text-center">
                            {performanceMessage}
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <Button onClick={startQuiz} size="lg">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Làm lại bài trắc nghiệm
                        </Button>
                    </CardFooter>
                </Card>

                <h3 className="text-2xl font-semibold mb-6">Xem lại đáp án</h3>
                <Accordion type="multiple" className="w-full">
                    {questions.map((q, i) => {
                        const userAnswer = answers.find(
                            (a) => a.questionId === q?._id
                        );
                        const userOptionIndex = userAnswer?.selectedOptionIndex;
                        const isUserCorrect = userAnswer?.isTrue;

                        return (
                            <AccordionItem
                                key={q?._id}
                                value={`item-${i}`}
                                className={`
                                    border-1 rounded-md shadow-sm mb-4 last:border-b-1
                                    ${isUserCorrect ? "border-green-400" : "border-red-400"}
                                `}
                            >
                                <AccordionTrigger
                                    className={`px-4 py-3 text-left hover:no-underline 
                                    ${isUserCorrect ? "text-green-400" : "text-red-400"}`}
                                >
                                    <div className="flex items-start flex-1 space-x-3">
                                        {isUserCorrect ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                                        )}
                                        <div className=" text-base text-gray-900">
                                            <span className="inline-block">Câu {i + 1}:</span>
                                            <span
                                                className="font-normal pl-2"
                                                dangerouslySetInnerHTML={{
                                                    __html: q?.questionText.replace(/<\/?p>/g, '').replace(/<\/?div>/g, ''),
                                                }}
                                            />
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pt-0 pb-4">
                                    <div className="px-2">
                                        {q?.options.map((opt, index) => {
                                            const isThisCorrect = opt.isCorrect;
                                            const isThisSelected =
                                                userOptionIndex?.toString() ===
                                                index.toString();

                                            let stateClass = "bg-gray-50 border-gray-200 text-gray-700";
                                            let icon = (<Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />);
                                            let label = "";

                                            if (isThisCorrect) {
                                                stateClass = "bg-green-50 border-green-200 text-green-800 font-medium";
                                                icon = (
                                                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                                );
                                                label = "(Đáp án đúng)";
                                            }

                                            if (isThisSelected && !isThisCorrect) {
                                                stateClass = "bg-red-50 border-red-200 text-red-800 font-medium";
                                                icon = (
                                                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                                                );
                                                label = "(Lựa chọn của bạn)";
                                            }

                                            return (
                                                <div
                                                    key={opt._id}
                                                    className={`p-3 rounded-md border mb-3 ${stateClass}`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        {icon}
                                                        <div className="flex-1">
                                                            <span
                                                                className="break-words"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: opt.optionText.replace(/<\/?p>/g, '').replace(/<\/?div>/g, ''),
                                                                }}
                                                            />
                                                            {label && (
                                                                <span className="text-sm ml-2 opacity-90">
                                                                    {label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {opt?.optionExplanation && (
                                                        <div className="mt-2">
                                                            <span className="font-semibold text-sm">Giải thích: </span>
                                                            <span className="font-normal">
                                                                {stripHtml(opt?.optionExplanation)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
                {/* -------------------------------------------------------- */}
            </div>
        );
    }
    // ------------------------------------

    return null;
};

export default Quiz;