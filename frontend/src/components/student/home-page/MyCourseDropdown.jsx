import { useGetMyCoursesProgressQuery } from "@/redux/api/progressApiSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { setMyCoursesId } from "@/redux/features/authSlice";

const MyCourseDropdown = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const {
        data: myCourses,
        isLoading: isMyCoursesLoading,
    } = useGetMyCoursesProgressQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        if (!myCourses) return;

        const courseIds = myCourses.map(c => c.courseId._id);
        dispatch(setMyCoursesId(courseIds));
    }, [myCourses, dispatch]);


    if (isMyCoursesLoading) {
        return (
            <div className="space-y-3 w-80">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                ))}
            </div>
        );
    }

    const handleClickCourse = (courseAlias) => {
        navigate(`/student/learning/${courseAlias}`);
    }

    return (
        <div className="w-80 z-50">
            <div className="px-2 pt-2 font-semibold text-lg">Khóa học của tôi</div>
            {myCourses && myCourses.length > 0 ? (
                <div className="py-1">
                    {myCourses.slice(0, 3).map((course) => (
                        <div
                            key={course.courseId._id}
                            className="flex space-x-3 hover:bg-gray-100 px-3 py-2 mb-2 rounded-md cursor-pointer"
                            onClick={() => handleClickCourse(course.courseId.alias)}
                        >
                            <img
                                src={course.courseId.thumbnail.publicURL}
                                alt={course.courseId.title}
                                className="h-14 w-20 rounded-md object-cover"
                            />

                            <div className="w-full">
                                <div className="text-base font-semibold">
                                    {course.courseId.title}
                                </div>

                                <Progress
                                    value={course.percentage}
                                    className="h-2 mt-1"
                                />

                                <div className="text-xs text-gray-500 mt-1">
                                    {course.percentage}% hoàn thành
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-center border-t border-gray-200 w-full py-2">
                        <button
                            className="mt-2 w-full px-4 font-semibold py-2 border border-blue-600 hover:bg-blue-100 text-blue-600 rounded-md"
                            onClick={() => {
                                navigate('/student/my-courses')
                            }}
                        >
                            Xem tất cả khóa học
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-gray-500 text-sm py-2">
                    <span className="flex justify-center">
                        Bắt đầu học ngay hôm nay!
                    </span>
                    <div className="w-full">
                        <button
                            className="mt-5 w-full px-4 font-semibold py-2 border border-blue-600 hover:bg-blue-100 text-blue-600 rounded-md"
                            onClick={() => {
                                const param = new URLSearchParams()
                                param.set("q", "")
                                navigate(`/courses?${param.toString()}`)
                            }}
                        >
                            Khám phá khóa học
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCourseDropdown;