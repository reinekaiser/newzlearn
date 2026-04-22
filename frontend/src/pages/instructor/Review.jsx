import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAllCoursesInfoQuery } from '@/redux/api/coursePublicApiSlice';
import { Spinner } from '@/components/ui/spinner';
import { useGetReviewsQuery } from '@/redux/api/reviewSlice';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { IoMdCheckmark } from "react-icons/io";
import ReviewStats from '@/components/instructor/review/ReviewStats';
import MetricCard from '@/components/instructor/course-engagement/MetricCard';
import { CourseComboBox } from '@/components/instructor/course-qa/CourseComboBox';

const Review = () => {
    const { data: courses, isLoading: isLoadingCourses } = useGetAllCoursesInfoQuery();
    const [selectedCourse, setSelectedCourse] = useState({ _id: "all", title: "Tất cả khóa học",});
    const [avgRating, setAvgRating] = useState('all');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState("review");
    const limit = 5;

    const { data: reviews, isLoading: isLoadingReviews } = useGetReviewsQuery({
        courseId: selectedCourse !== "all" ? selectedCourse._id : undefined,
        rating: avgRating !== "all" ? Number(avgRating) : undefined,
        sortBy: sort,
        page,
        limit,
    });

    const handlePageChange = (newPage) => setPage(newPage);

    if (isLoadingCourses) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="size-12" color="#098ce9" />
            </div>
        );
    }

    return (
        <div className="bg-background mb-20">
            <div className="container mx-auto px-6 py-4 flex items-center gap-4 ">
                <h1 className="text-2xl font-bold text-foreground">Đánh giá khóa học</h1>
                <CourseComboBox value={selectedCourse} setValue={setSelectedCourse}></CourseComboBox>
            </div>

            <div className="flex border-b border-gray-200 container mx-auto px-6">
                {["review", "stats"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 -mb-px font-medium text-sm transition-colors
                            ${activeTab === tab ? "border-b-2 border-black text-black" : "text-gray-500 hover:text-black"}`}
                    >
                        {tab === "review" ? "Reviews" : "Thống kê"}
                    </button>
                ))}
            </div>

            <div className="container mx-auto px-6 mt-6">
                {activeTab === "review" && (
                    <div>
                        <div className="flex items-center justify-end gap-5 mb-6">
                            <div className="flex items-center gap-2">
                                <p className="text-gray-600 text-sm">Rating: </p>
                                <Select value={avgRating} onValueChange={setAvgRating} defaultValue="all">
                                    <SelectTrigger className="font-semibold w-[100px] border-none shadow-none">
                                        <SelectValue placeholder="Tất cả" />
                                    </SelectTrigger>
                                    <SelectContent className="border-none">
                                        <SelectItem value="all" className="border-none data-[state=checked]:font-bold">Tất cả</SelectItem>
                                        {[5, 4, 3, 2, 1].map(r => (
                                            <SelectItem key={r} value={r.toString()} className="border-none data-[state=checked]:font-bold">
                                                {r} sao
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-gray-600 text-sm">Sắp xếp: </p>
                                <Select value={sort} onValueChange={setSort} defaultValue="newest">
                                    <SelectTrigger className="font-semibold w-40 border-none shadow-none">
                                        <SelectValue placeholder="Mới nhất" />
                                    </SelectTrigger>
                                    <SelectContent className="border-none">
                                        <SelectItem value="newest" className="border-none data-[state=checked]:font-bold">Mới nhất</SelectItem>
                                        <SelectItem value="oldest" className="border-none data-[state=checked]:font-bold">Cũ nhất</SelectItem>
                                        <SelectItem value="highest" className="border-none data-[state=checked]:font-bold">Rating cao nhất</SelectItem>
                                        <SelectItem value="lowest" className="border-none data-[state=checked]:font-bold">Rating thấp nhất</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {isLoadingReviews ? (
                                <Spinner className="size-12" color="#098ce9" />
                            ) : reviews?.reviews?.length > 0 ? (
                                reviews.reviews.map(review => <ReviewCard key={review._id} review={review} />)
                            ) : (
                                <p className="text-gray-500">Chưa có đánh giá nào</p>
                            )}
                        </div>

                        {reviews?.totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <Pagination currentPage={page} totalPages={reviews.totalPages} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className='ml-4'>
                        <p className='text-2xl font-semibold mb-4'>Tổng quan đánh giá khóa học từ học viên</p>
                        <ReviewStats courseId={selectedCourse._id}/>
                    </div>
                )}
            </div>
        </div>
    );
};

const ReviewCard = ({ review }) => {
    const { rating, comment, survey, userId } = review;
    console.log('Review data:', review);

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

    const formatSurveyKey = (key) => {
        switch (key) {
            case 'valuableInfo': return 'Thông tin hữu ích';
            case 'clearExplanation': return 'Giải thích rõ ràng';
            case 'engagingDelivery': return 'Truyền đạt thu hút';
            case 'helpfulPractice': return 'Bài tập hữu ích';
            case 'accurateCourse': return 'Khóa học chính xác';
            case 'knowledgeableTeacher': return 'Giáo viên kinh nghiệm';
            default: return key;
        }
    };

    const surveyTags = survey
        ? Object.entries(survey)
            .filter(([_, value]) => value === true)
            .map(([key]) => (
                <span
                    key={key}
                    className="w-full flex items-center justify-start text-sm py-1"
                >
                    <IoMdCheckmark className="text-green-500 mr-1 text-base" />
                    {formatSurveyKey(key)}
                </span>
            ))
        : [];

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

    return (
        <div className="border rounded-lg p-4 bg-white flex flex-col w-full hover:shadow-md transition-shadow">
            <div className="flex items-center mb-2">
                <img
                    src={userId?.profilePicture?.url || "/logo.png"}
                    alt={`${userId?.firstName} ${userId?.lastName}`}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                />
                <div className="flex-1">
                    <div className="font-semibold text-gray-700 mb-1">{userId?.firstName} {userId?.lastName}</div>
                    <div className="text-gray-500 text-sm">Cập nhật {updatedAgo()}</div>
                </div>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                Khoá học: <span className='font-semibold ml-1'>{review.courseId?.title}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                <span className='text-sm pt-0.5 text-blue-700 font-semibold mr-0'>{review.rating}</span>
                <span className='text-sm pt-0.5'>/5.0</span>
                {renderStars()}
            </div>
            {surveyTags.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                    {surveyTags}
                </div>
            )}
            {comment && (
                <p className="text-gray-600 text-sm font-medium mt-2">{comment}</p>
            )}
        </div>
    );
};

export default Review;