import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Heart } from "lucide-react";
import Slider from "react-slick";
import Button from "./Button";
import CourseCard from "./CourseCard";
import { useGetCourseSearchResultsQuery } from "@/redux/api/coursePublicApiSlice";
import { useAddToFavoritesMutation, useRemoveFromFavoritesMutation, useCheckFavoriteQuery } from "@/redux/api/favoriteApiSlice";
import { toast } from "react-toastify";
import FavoriteButton from "./student/home-page/FavoriteButton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
function NextArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center absolute right-[15px] top-1/2 translate-x-1/2 -translate-y-1/2 bg-white shadow-xl rounded-full p-2 z-10 hover:bg-gray-200"
      style={{ ...style }}
    >
      <ChevronRight className="w-6 h-6" />
    </button>
  );
}

function PrevArrow(props) {
  const { className, style, onClick } = props;
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center absolute left-[15px] top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-xl rounded-full p-2 z-10 hover:bg-gray-200"
      style={{ ...style }}
    >
      <ChevronLeft className="w-6 h-6" />
    </button>
  );
}


export default function CoursesList() {
  const [activeTab, setActiveTab] = useState("Lập trình");
  const tabs = [
    "Lập trình",
    "Kinh doanh",
    "Thiết kế",
    "Tiếp thị",
    "CNTT & Phần mềm",
    "Phát triển cá nhân",
    "Nhiếp ảnh",
    "Âm nhạc",
  ];

  const { data: result } = useGetCourseSearchResultsQuery({
    q: "",
    courseDuration: "",
    level: "",
    category: activeTab,
    language: "",
    selectedPrices: "",
    sort: "default",
    page: 0,
    limit: 8,
  });
  const courses = result?.results || [];
  const handleAllCourseByCategory = () =>{
    window.location.href = `/courses?q=&category=${encodeURIComponent(activeTab)}`;
  }

  const filteredCourses =
    Array.isArray(courses) && courses.length > 0
      ? courses.filter((c) => c?.category === activeTab)
      : [];
  const sliderRef = useRef(null);
  
  // Favorite functionality
  const [addToFavorites, { isLoading: isAddingFavorite }] = useAddToFavoritesMutation();
  const [removeFromFavorites, { isLoading: isRemovingFavorite }] = useRemoveFromFavoritesMutation();
  
  const handleAddToFavorite = async (e, courseId) => {
    e.stopPropagation();
    try {
      await addToFavorites(courseId).unwrap();
      toast.success("Đã thêm vào yêu thích");
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast.error("Lỗi khi thêm vào yêu thích");
    }
  };

  const handleRemoveFromFavorite = async (e, courseId) => {
    e.stopPropagation();
    try {
      await removeFromFavorites(courseId).unwrap();
      toast.success("Đã xóa khỏi yêu thích");
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Lỗi khi xóa khỏi yêu thích");
    }
  };
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };
  return (
    <div className="py-12">
      <div className="font-bold text-3xl mx-20 my-5 px-6">
        Tất cả các kỹ năng bạn cần đều có tại một nơi
      </div>
      <div className="text-lg text-gray-800/50 mx-20 my-5 px-6">
        Từ các kỹ năng quan trọng đến các chủ đề kỹ thuật, NewZLearn hỗ trợ sự
        phát triển chuyên môn của bạn.
      </div>
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-300 text-gray-700 font-medium mx-20 px-2 xl:px-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (sliderRef.current) {
                sliderRef.current.slickGoTo(0); // reset về slide đầu
              }
              setActiveTab(tab);
            }}
            className={`pb-2 text-sm xl:text-base px-2 cursor-pointer ${
              activeTab === tab
                ? "border-b-2 border-[#098be4] text-[#098be4] font-bold"
                : "hover:text-[#098be4]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Course Carousel*/}
      <div className="py-5 px-20 bg-gray-100 ">
        {filteredCourses.length > 0 ? (
          <TooltipProvider >
            <Slider
            className={"overflow-visible bg-none"}
            ref={sliderRef}
            {...settings}
          >
            {/* {filteredCourses.map((course, index) => (
              <Button
                onMouseEnter={(e) => enterPopUp(e, index)}
                onMouseLeave={leavePopUp}
                key={course._id || course.id}
                className="flex justify-start bg-white/0 hover:bg-white/0 items-start hover:scale-105 transition-transform duration-200 ease-in-out"
              >
                <CourseCard course={course} isInSlider={true} />
              </Button>
            ))} */}
            
              {filteredCourses.map((course, index) => (
                <div key={index}>
                  <Tooltip key={course._id || course.id}>
                  <TooltipTrigger asChild>
                    <Button
                      className="flex justify-start bg-white/0 hover:bg-white/0 items-start w-full"
                    >
                      <CourseCard course={course} isInSlider={true} />
                    </Button>
                  </TooltipTrigger>
                  
                  <TooltipContent 
                    side="right" 
                    align="center"
                    sideOffset={-6}
                    className="max-w-[300px] p-4 z-50 border-gray-200 bg-white shadow-md text-black [&>svg]:fill-white [&>svg]:bg-white"
                    arrowClassName={"fill-white bg-white"}
                  >
                    {/* Nội dung popup - thay thế coursePopUp cũ */}
                    <div>
                      <p className="text-sm xl:text-base font-semibold text-black">
                        {course.title}
                      </p>
                      <div className="flex space-x-2 w-full items-center h-8 ">
                        {course.level && (
                          <span className="font-semibold text-xs px-2 py-1 bg-[#cee8fb] text-[#098be4] rounded max-w-1/2">
                            {course.level}
                          </span>
                        )}
                        <p className="text-xs py-1 italic max-w-1/2">
                          Cập nhật:{" "}
                          {(course.updatedAt
                            ? new Date(course.updatedAt)
                            : new Date()
                          ).toLocaleDateString("vi")}
                        </p>
                      </div>

                      <div className="text-xs/5 text-gray-800 py-2 space-y-2">
                        <p>{course?.subtitle}</p>
                        <ul className="list-disc  px-6 ">
                          {course?.learningOutcomes?.map((outcome, idx) => {return(
                            <li key={idx}>{outcome}</li>
                          )})}
                        </ul>
                      </div>

                      <FavoriteButton
                        courseId={course?._id}
                        onAddToFavorite={handleAddToFavorite}
                        onRemoveFromFavorite={handleRemoveFromFavorite}
                        isAddLoading={isAddingFavorite}
                        isRemoveLoading={isRemovingFavorite}
                      />
                    </div>
                  </TooltipContent>
                </Tooltip>
                </div>
              ))}
            
          </Slider>
          </TooltipProvider>
        ) : (
          <div className="w-full items-center justify-center flex flex-col gap-2 h-[300px]">
            <img src="/empty-course.png" alt="No courses" className="w-20 h-20 opacity-50" />
            <p className="text-[1.1rem] text-gray-500">Không có khóa học nào.</p>
          </div>
        )}

        <Button variant="outline" className="mt-5 mx-2" onClick={handleAllCourseByCategory}>
          Hiển thị toàn bộ khóa học {activeTab}
        </Button>
      </div>
    </div>
  );
}
