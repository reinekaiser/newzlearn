import { useGetCourseInfoQuery } from "@/redux/api/courseApiSlice";
import { Link, useParams } from "react-router-dom";
import CourseInfo from "../../pages/instructor/CourseInfo";

const CourseInfoWrapper = () => {
    const { courseAlias } = useParams();
    const { data: course, isLoading } = useGetCourseInfoQuery(courseAlias);

    if (isLoading) {
        return (
            <div className="fixed w-full min-h-[50px] py-[10px] top-0 left-0 bg-gray-800 z-50">
                <div className="container flex items-center justify-between text-white font-semibold">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/instructor/courses"
                            className="px-2 py-1 rounded hover:bg-gray-600"
                        >
                            Quay lại
                        </Link>
                    </div>
                    <div className="items-center flex gap-3"></div>
                </div>
            </div>
        );
    }
    return <CourseInfo course={course}></CourseInfo>;
};

export default CourseInfoWrapper;
