import { useState } from "react";
import { useNavigate } from "react-router-dom";
const getCaptionStatus = (status) => {
    switch (status) {
        case "draft":
            return "Nháp";
        case "processing":
            return "Đang xử lý";
        case "published":
            return "Đã phát hành";
        default:
            return "Nháp";
    }
};

const InstructorCourseCard = ({ course }) => {
    const [isHovered, setIsHovered] = useState(false);

    const navigate = useNavigate();

    const handleManageClick = () => {
        navigate(`/instructor/courses/${course.alias}/manage`);
    };

    return (
        <div
            className="relative bg-white rounded-xl shadow-lg overflow-hidden  cursor-pointer h-82 flex flex-col"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Phần hình ảnh khóa học */}
            <div className="relative h-48 overflow-hidden">
                <img
                    src={
                        course.thumbnail?.publicURL ||
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                    }
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
            </div>

            <div className="p-3 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1">
                    {course.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">{course.subtitle}</p>

                <div className="flex items-center justify-between mt-auto text-primary">
                    <div className="font-semibold ">{getCaptionStatus(course.status)}</div>
                </div>
            </div>

            {/* Overlay khi hover */}
            <div
                onClick={handleManageClick}
                className={`absolute inset-0 bg-white/60 flex items-center justify-center transition-all duration-500 ${
                    isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
                }`}
            >
                <span className=" text-primary font-bold text-lg">Quản lý / Chỉnh sửa</span>
            </div>
        </div>
    );
};

export default InstructorCourseCard;
