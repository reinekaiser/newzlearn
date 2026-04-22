import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { useGetMyCoursesProgressQuery } from '@/redux/api/progressApiSlice';
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import React from 'react'
import { BsPlayCircleFill } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';
import ReviewButton from '@/components/student/my-course/ReviewButton';

const MyCourses = () => {
    const { data: myCourses, isLoading: isMyCoursesLoading } = useGetMyCoursesProgressQuery();

    return (
        <div>
            <Header />

            <div className='py-8 px-20 bg-[#002040]'>
                <p className='text-4xl font-extrabold text-white'>Khoá học của tôi</p>
            </div>

            <div className='container min-h-[60vh] py-8'>

                {isMyCoursesLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white border rounded-lg flex flex-col h-full">
                                <Skeleton className="w-full h-36 rounded-t-lg" />
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                                <div className="p-4 flex justify-between items-center mt-auto">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}


                {!isMyCoursesLoading && myCourses?.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myCourses.map(course => (
                            <CourseCard key={course.courseId._id} course={course} />
                        ))}
                    </div>
                )}

                {!isMyCoursesLoading && (!myCourses || myCourses.length === 0) && (
                    <p className="text-gray-500 text-center">Bạn chưa có khóa học nào.</p>
                )}

            </div>

            <Footer />
        </div>
    )
}


const CourseCard = ({ course }) => {
    const navigate = useNavigate();

    const handleClickCourse = (courseAlias) => {
        navigate(`/student/learning/${courseAlias}`);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-transform duration-300 flex flex-col h-full">
            <div
                className="cursor-pointer group pointer-events-auto"
                onClick={() => handleClickCourse(course.courseId.alias)}
            >
                <div className="relative w-full h-36">
                    <img
                        src={course.courseId.thumbnail.publicURL || "/logo.png"}
                        alt={course.courseId.title}
                        className="w-full h-full object-cover rounded-t-lg"
                    />

                    <div className="
                        absolute inset-0 flex items-center justify-center
                        bg-black/40 opacity-0 group-hover:opacity-100
                        transition-opacity duration-500 rounded-t-lg"
                    >
                        <BsPlayCircleFill className="text-white text-5xl" />
                    </div>
                </div>

                <div className="w-full px-4 py-3 pointer-events-none">
                    <div className="text-xl font-semibold">
                        {course.courseId.title}
                    </div>

                    <Progress value={course.percentage} className="h-2 mt-1" />
                </div>
            </div>

            <div className='w-full px-4 flex justify-between items-center mt-auto mb-2'>
                <div className="text-sm text-gray-500">
                    {course.percentage}% hoàn thành
                </div>
                <div className="pointer-events-auto">
                    <ReviewButton courseId={course.courseId._id} />
                </div>
            </div>

        </div>
    );
};
export default MyCourses