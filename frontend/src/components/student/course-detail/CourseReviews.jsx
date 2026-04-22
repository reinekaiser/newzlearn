import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetAllReviewsQuery } from '@/redux/api/reviewSlice'
import React, { useState, useMemo } from 'react'
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { RxDotFilled } from "react-icons/rx";
import { cn } from "@/lib/utils";

const CourseReviews = ({ courseId, avg }) => {
    const [isOpen, setIsOpen] = useState(false);

    const { data: initialData, isLoading: loadingInitial } = useGetAllReviewsQuery({
        courseId: courseId ? courseId : undefined,
        rating: undefined,
        sortBy: 'newest',
    });

    const [modalRating, setModalRating] = useState('all');
    const [modalSort, setModalSort] = useState('newest');

    const { data: modalData, isLoading: loadingModal } = useGetAllReviewsQuery({
        courseId: courseId ? courseId : undefined,
        rating: modalRating !== "all" ? Number(modalRating) : undefined,
        sortBy: modalSort,
    });

    const starCounts = useMemo(() => {
        const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        if (initialData?.reviews) {
            initialData.reviews.forEach(review => {
                const star = Math.floor(review.rating);
                if (counts[star] !== undefined) {
                    counts[star]++;
                }
            });
        }
        return counts;
    }, [initialData]);

    if (loadingInitial) {
        return (
            <div className="flex items-center justify-center h-20">
                <Spinner className="size-8" color="#098ce9" />
            </div>
        );
    }

    const totalReviews = initialData?.totalReviews || 0;
    const initialReviewsList = initialData?.reviews || [];
    const modalReviewsList = modalData?.reviews || [];

    const displayedReviews = initialReviewsList.slice(0, 4);

    return (
        <div>
            <div className='flex items-center gap-2 mb-8'>
                <FaStar className="text-yellow-500 text-2xl mr-1" />
                <p className='text-2xl font-semibold'>{avg} xếp hạng khóa học</p>
                <RxDotFilled className='text-xl' />
                <p className='text-2xl font-semibold'>{totalReviews} đánh giá</p>
            </div>

            {displayedReviews.length > 0 ? (
                <div className='grid grid-cols-2 gap-10 mb-6'>
                    {displayedReviews.map((review, index) => (
                        <ReviewCard
                            key={index}
                            review={review}
                            onReadMore={() => setIsOpen(true)}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">Chưa có đánh giá nào</p>
            )}


            {initialReviewsList.length > 0 && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    
                    {initialReviewsList.length > 4 && (
                        <DialogTrigger asChild>
                            <Button variant="outline" className="mt-4 font-semibold border-black text-black hover:bg-gray-100">
                                Xem tất cả các đánh giá
                            </Button>
                        </DialogTrigger>
                    )}

                    <DialogContent className="min-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
                        <DialogHeader className="px-6 py-4 border-b shrink-0">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FaStar className="text-yellow-500" />
                                <span>{avg} xếp hạng khóa học</span>
                                <RxDotFilled />
                                <span>{totalReviews} đánh giá</span>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="px-6 bg-white flex flex-col md:flex-row gap-8 shrink-0">
                            
                            <div className="flex-1 space-y-1">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const count = starCounts[star];
                                    const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                                    const isSelected = modalRating.toString() === star.toString();

                                    return (
                                        <button
                                            key={star}
                                            onClick={() => setModalRating(isSelected ? 'all' : star.toString())}
                                            className={cn(
                                                "flex items-center w-full gap-3 group hover:opacity-80 transition-opacity",
                                                isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"
                                            )}
                                        >
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-500 ease-out",
                                                        "bg-gray-500"
                                                    )}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center gap-1 min-w-[100px]">
                                                <div className="flex">
                                                    {[...Array(5)].map((_, i) => (
                                                        <FaStar
                                                            key={i}
                                                            className={cn(
                                                                "text-sm",
                                                                i < star ? "text-yellow-500" : "text-gray-300"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="text-sm text-gray-500 w-10">
                                                    ({count})
                                                </div>
                                                <span className="text-xs text-red-500 min-w-2.5">{isSelected ? "✕" : ""}</span>

                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="w-full md:w-[200px] flex flex-col gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sắp xếp theo</label>
                                    <Select value={modalSort} onValueChange={setModalSort}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sắp xếp" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Mới nhất</SelectItem>
                                            <SelectItem value="oldest">Cũ nhất</SelectItem>
                                            <SelectItem value="highest">Cao đến thấp</SelectItem>
                                            <SelectItem value="lowest">Thấp đến cao</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-6 bg-gray-50/50 flex-1">
                            {loadingModal ? (
                                <div className="flex justify-center py-10">
                                    <Spinner className="size-8" color="#098ce9" />
                                </div>
                            ) : modalReviewsList.length > 0 ? (
                                <div className="space-y-5">
                                    {modalReviewsList.map(review => (
                                        <ReviewCard
                                            key={`modal-${review._id}`}
                                            review={review}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                    <p className="mb-2 text-lg">Không tìm thấy đánh giá nào.</p>
                                    <Button variant="outline" onClick={() => { setModalRating('all'); setModalSort('newest') }}>
                                        Xóa bộ lọc
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

const ReviewCard = ({ review, onReadMore }) => {
    const { rating, comment, userId } = review;
    const [isExpanded, setIsExpanded] = useState(false);
    const MAX_LENGTH = 150;

    const renderStars = () => {
        const stars = [];
        let remaining = rating;
        for (let i = 1; i <= 5; i++) {
            if (remaining >= 1) stars.push(<FaStar key={i} className="text-yellow-500" />);
            else if (remaining >= 0.5) stars.push(<FaStarHalfAlt key={i} className="text-yellow-500" />);
            else stars.push(<FaRegStar key={i} className="text-yellow-500" />);
            remaining -= 1;
        }
        return stars;
    };

    const updatedAgo = () => {
        const now = Date.now();
        const updated = new Date(review.updatedAt).getTime();
        const diffMs = now - updated;
        const days = Math.floor(diffMs / 86400000);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);
        if (days < 1) return "hôm nay";
        if (days === 1) return "1 ngày trước";
        if (days < 30) return `${days} ngày trước`;
        if (months === 1) return "1 tháng trước";
        if (months < 12) return `${months} tháng trước`;
        if (years === 1) return "1 năm trước";
        return `${years} năm trước`;
    };

    const getInitials = (firstName = "", lastName = "") => {
        const first = firstName.trim().charAt(0);
        const last = lastName.trim().charAt(0);
        return `${first}${last}`.toUpperCase();
    };

    const shouldTruncate = comment && comment.length > MAX_LENGTH;
    const displayedComment = isExpanded || !shouldTruncate
        ? comment
        : `${comment.slice(0, MAX_LENGTH)}...`;

    const handleReadMore = () => {
        if (onReadMore) {
            onReadMore();
        } else {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className="border-t pt-4 bg-white flex flex-col w-full">
            <div className="flex items-center mb-2">
                {userId?.profilePicture?.url ? (
                    <img
                        src={userId.profilePicture.url}
                        alt={`${userId?.firstName} ${userId?.lastName}`}
                        className="w-10 h-10 rounded-full object-cover mr-3"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-semibold mr-3">
                        {getInitials(userId?.firstName, userId?.lastName)}
                    </div>
                )}

                <div className="flex-1">
                    <div className="font-semibold text-gray-700 mb-1">
                        {userId?.firstName} {userId?.lastName}
                    </div>

                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                        {renderStars()}
                        <span className='text-xs text-gray-400 ml-2'>{updatedAgo()}</span>
                    </div>
                </div>
            </div>

            {comment && (
                <div className="mt-2">
                    <p className="text-gray-600 text-sm font-medium leading-relaxed inline">
                        {displayedComment}
                    </p>

                    {shouldTruncate && (
                        <button
                            onClick={handleReadMore}
                            className="ml-1 text-sm font-bold text-blue-600 hover:underline focus:outline-none"
                        >
                            {/* Logic hiển thị text nút */}
                            {onReadMore
                                ? "Xem thêm"
                                : (isExpanded ? "Thu gọn" : "Xem thêm")
                            }
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseReviews;