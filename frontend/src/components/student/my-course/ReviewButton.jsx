import React, { useState } from "react";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCreateOrUpdateReviewMutation, useDeleteReviewMutation, useGetMyReviewsQuery } from "@/redux/api/reviewSlice";
import ReviewModal from "@/components/student/my-course/ReviewModal";
import { toast } from "react-toastify";


const ReviewButton = ({ courseId }) => {
    const [open, setOpen] = useState(false);

    const { data: myReviews, isLoading: isReviewsLoading } = useGetMyReviewsQuery();
    const [createOrUpdateReview] = useCreateOrUpdateReviewMutation();
    const [deleteReview] = useDeleteReviewMutation();

    const myReview = myReviews?.find(r => r.courseId === courseId);
    const hasReview = !!myReview;
    const ratingValue = myReview?.rating || 0;

    const stars = Array.from({ length: 5 }, (_, i) => {
        const diff = ratingValue - i;
        if (diff >= 1) return 1;
        if (diff >= 0.5) return 0.5;
        return 0;
    });

    const handleReviewSubmitted = async (newReview) => {
        try {
            const res = await createOrUpdateReview(newReview).unwrap();
            toast.success("Đánh giá đã được gửi thành công!");
            console.log("Review submitted:", res);
        } catch (error) {
            console.error("Error submitting review:", error);
        }
    }

    const handleDeleteReview = async (reviewId) => {
        try {
            const res = await deleteReview(reviewId).unwrap();
            console.log("Review deleted:", res);
            toast.success("Đánh giá đã được xoá thành công!");
        } catch (error) {
            console.error("Error deleting review:", error);
        }
    }

    return (
        <TooltipProvider delayDuration={100}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className="group/review cursor-pointer"
                        onClick={() => setOpen(true)}
                    >
                        <div className="flex items-center space-x-1 text-sm">
                            {stars.map((v, idx) => {
                                if (v === 1)
                                    return <FaStar key={idx} className="text-yellow-400" size={16} />;

                                if (v === 0.5)
                                    return <FaStarHalfAlt key={idx} className="text-yellow-400" size={16} />;

                                return (
                                    <FaRegStar
                                        key={idx}
                                        size={16}
                                        className="text-gray-300 group-hover/review:text-yellow-400 transition-colors"
                                    />
                                );
                            })}
                        </div>
                    </div>
                </TooltipTrigger>

                <TooltipContent side="bottom" align="center" className="text-sm">
                    <p>{hasReview ? "Chỉnh sửa đánh giá của bạn" : "Đưa ra đánh giá của bạn"}</p>
                </TooltipContent>
            </Tooltip>

            <ReviewModal
                key={`${courseId}-${Date.now()}`}
                open={open}
                setOpen={setOpen}
                courseId={courseId}
                onReviewSubmitted={handleReviewSubmitted}
                editReview={myReview}
                onDeleteReview={handleDeleteReview}
            />
        </TooltipProvider>
    );
};

export default ReviewButton;