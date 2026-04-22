import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";


const ReviewModal = ({
    open,
    setOpen,
    editReview,
    courseId,
    onReviewSubmitted,
    onDeleteReview
}) => {
    const [step, setStep] = useState(1);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [survey, setSurvey] = useState({
        valuableInfo: null,
        clearExplanation: null,
        engagingDelivery: null,
        helpfulPractice: null,
        accurateCourse: null,
        knowledgeableTeacher: null,
    });
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (editReview) {
            setRating(editReview.rating);
            setComment(editReview.comment);
            setSurvey(editReview.survey || {
                valuableInfo: null,
                clearExplanation: null,
                engagingDelivery: null,
                helpfulPractice: null,
                accurateCourse: null,
                knowledgeableTeacher: null,
            });
        }
    }, [editReview]);

    const setValue = (key, val) => {
        setSurvey(prev => ({ ...prev, [key]: val }));
    };

    const next = () => setStep(prev => prev + 1);
    const back = () => setStep(prev => prev - 1);
    const reset = () => setStep(1);

    const handleOpenChange = (newState) => {
        setOpen(newState);
        if (newState === false) {
            reset();
        }
    };

    const resetReview = () => {
        setRating(0);
        setComment("");
        setSurvey({
            valuableInfo: null,
            clearExplanation: null,
            engagingDelivery: null,
            helpfulPractice: null,
            accurateCourse: null,
            knowledgeableTeacher: null,
        });
        setShowConfirmDelete(false);
        setOpen(false);
    };

    const handleSubmit = async () => {
        const payload = {
            courseId,
            rating,
            comment,
            survey
        };
        if (onReviewSubmitted) {
            onReviewSubmitted(payload);
        }
        setOpen(false);
        reset();
    };

    const handleDelete = async () => {
        if (onDeleteReview && editReview && editReview._id) {
            onDeleteReview(editReview._id);
        }
        resetReview();
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader className="hidden">
                        <DialogTitle>Đánh giá khoá học</DialogTitle>
                    </DialogHeader>

                    {step === 1 && (
                        <div>
                            {!showConfirmDelete ? (
                                <>
                                    <p className='text-2xl font-semibold mb-4'>Bạn xếp hạng khóa học này ở mức nào?</p>
                                    <div className="flex flex-col items-center space-y-3">
                                        <StarRating rating={rating} setRating={setRating} />
                                    </div>
                                    <div className="flex justify-end pt-5 text-sm space-x-2">
                                        {editReview && editReview._id && (
                                            <button
                                                onClick={() => setShowConfirmDelete(true)}
                                                className="px-3 py-2 border rounded-md font-medium text-white bg-red-500 hover:bg-red-600"
                                            >
                                                Xoá
                                            </button>
                                        )}

                                        <button
                                            onClick={next}
                                            disabled={!rating}
                                            className="px-3 py-2 bg-blue-500 font-medium hover:bg-blue-600 text-white rounded-md disabled:bg-gray-300"
                                        >
                                            {editReview ? "Tiếp tục chỉnh sửa" : "Tiếp tục"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className='text-2xl font-semibold mb-4 text-center'>
                                        Bạn có chắc muốn xoá đánh giá này?
                                    </p>
                                    <div className="flex justify-center gap-4 pt-5">
                                        <button
                                            onClick={() => setShowConfirmDelete(false)}
                                            className="px-3 py-2 border rounded-md hover:bg-gray-100"
                                        >
                                            Huỷ
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                        >
                                            Xoá đánh giá của tôi
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}


                    {step === 2 && (
                        <div>
                            <p className='ftext-2xl font-semibold mb-4'>Vì sao bạn xếp hạng ở mức này?</p>
                            <div className="flex flex-col items-center space-y-3">
                                <StarRating rating={rating} setRating={setRating} />
                            </div>

                            <div className="space-y-2 mt-6">
                                <textarea
                                    className="w-full border rounded-sm p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    rows={7}
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Hãy cho chúng tôi biết thêm về trải nghiệm của bạn khi tham gia khoá học này. Khoá học có phù hợp không?"
                                />
                            </div>

                            <div className="flex justify-end pt-5 text-sm space-x-2">
                                <button onClick={back} className="px-3 py-2 border rounded-md font-medium hover:bg-gray-100">
                                    Quay lại
                                </button>

                                <button
                                    onClick={next}
                                    disabled={!rating}
                                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 font-medium text-white rounded-md disabled:bg-gray-300"
                                >
                                    {editReview ? "Tiếp tục chỉnh sửa" : "Tiếp tục"}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <p className="text-2xl font-semibold mb-4">
                                Vui lòng cho chúng tôi biết thêm (tùy chọn)
                            </p>

                            <div className="space-y-3">
                                <SurveyItem
                                    label="Bạn có tìm hiểu được thông tin có giá trị không?"
                                    value={survey.valuableInfo}
                                    onChange={(v) => setValue("valuableInfo", v)}
                                />

                                <SurveyItem
                                    label="Nội dung giải thích các khái niệm có rõ ràng không?"
                                    value={survey.clearExplanation}
                                    onChange={(v) => setValue("clearExplanation", v)}
                                />

                                <SurveyItem
                                    label="Cách giảng dạy của giảng viên có thu hút không?"
                                    value={survey.engagingDelivery}
                                    onChange={(v) => setValue("engagingDelivery", v)}
                                />

                                <SurveyItem
                                    label="Bài tập hoặc thực hành có hữu ích không?"
                                    value={survey.helpfulPractice}
                                    onChange={(v) => setValue("helpfulPractice", v)}
                                />

                                <SurveyItem
                                    label="Khóa học này có đúng như mong đợi của bạn không?"
                                    value={survey.accurateCourse}
                                    onChange={(v) => setValue("accurateCourse", v)}
                                />

                                <SurveyItem
                                    label="Giảng viên có am hiểu về chủ đề không?"
                                    value={survey.knowledgeableTeacher}
                                    onChange={(v) => setValue("knowledgeableTeacher", v)}
                                />
                            </div>

                            <div className="flex justify-end pt-5 text-sm space-x-2 mt-4">
                                <button
                                    onClick={back}
                                    className="px-3 py-2 border rounded-md font-medium hover:bg-gray-100"
                                >
                                    Quay lại
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    className="px-3 py-2 bg-blue-500 font-medium hover:bg-blue-600 text-white rounded-md disabled:bg-gray-300"
                                >
                                    {editReview ? "Sửa đánh giá" : "Lưu đánh giá"}
                                </button>
                            </div>
                        </div>
                    )}

                </DialogContent>
            </Dialog>
        </div>
    )
}

const SurveyItem = ({ label, value, onChange }) => {
    const options = [
        { label: "Có", value: true },
        { label: "Không", value: false },
        { label: "Bỏ trống", value: null }
    ];

    return (
        <div className="w-full">
            <p className="font-semibold text-sm mb-2">{label}</p>
            <div className="flex items-center gap-4">
                {options.map((opt) => (
                    <button
                        key={opt.label}
                        onClick={() => onChange(opt.value)}
                        className={`
                            px-4 py-1 border border-blue-500 text-blue-600 font-semibold rounded-sm text-sm transition
                            ${value === opt.value
                                ? "bg-blue-500 text-white border-blue-600"
                                : "hover:bg-gray-100"}
                        `}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

const StarRating = ({ rating, setRating }) => {
    const [hover, setHover] = useState(0);

    const display = hover || rating;

    const getRatingText = () => {
        if (!display) return "Chọn đánh giá của bạn";
        if (display <= 1) return "Rất tệ, không như mong đợi";
        if (display <= 2) return "Kém, khá thất vọng";
        if (display <= 3) return "Trung bình, lẽ ra có thể hay hơn";
        if (display <= 4) return "Tốt, khá ổn";
        return "Tuyệt vời, vượt mong đợi";
    };

    const getStarIcon = (value) => {
        if (display >= value) return <FaStar className="text-yellow-400" />;
        if (display >= value - 0.5) return <FaStarHalfAlt className="text-yellow-400" />;
        return <FaRegStar className="text-gray-300" />;
    };

    return (
        <div className="space-y-3">
            <p className="min-h-5 font-semibold text-gray-700 text-sm flex items-center justify-center">
                {getRatingText()}
            </p>

            <div
                className="flex gap-2 text-4xl"
                onMouseLeave={() => setHover(0)} 
            >
                {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="relative cursor-pointer">
                        
                        <div
                            className="absolute left-0 top-0 h-full w-1/2 z-10"
                            onMouseEnter={() => setHover(star - 0.5)}
                            onClick={() => setRating(star - 0.5)}
                        />
                        
                        <div
                            className="absolute right-0 top-0 h-full w-1/2 z-10"
                            onMouseEnter={() => setHover(star)}
                            onClick={() => setRating(star)}
                        />
                        <div>{getStarIcon(star)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewModal