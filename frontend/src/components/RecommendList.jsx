import React, { useEffect, useRef, useState } from "react";
import Button from "./Button";
import CourseCard from "./CourseCard";
import Slider from "react-slick";
import FavoriteButton from "./student/home-page/FavoriteButton";
import {
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
} from "@/redux/api/favoriteApiSlice";
import { useGetRecommendCoursesQuery } from "@/redux/api/courseApiSlice";
import { useSelector } from "react-redux";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight, Star, Heart } from "lucide-react";

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

function RecommendList() {
  const {userInfo} = useSelector((state) => state.auth);
  const { data } = useGetRecommendCoursesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  console.log(data)
  const rcmdList = data?.map(item => item.course);
  const sliderRef = useRef(null);
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 4,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
  };

  // Favorite functionality
  const [addToFavorites, { isLoading: isAddingFavorite }] =
    useAddToFavoritesMutation();
  const [removeFromFavorites, { isLoading: isRemovingFavorite }] =
    useRemoveFromFavoritesMutation();

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
  if (rcmdList?.length === 0 || !userInfo?._id || !rcmdList) return null;
  return (
    <div className="py-8">
      <div className="font-bold text-3xl mx-20 my-5 px-6">Bạn có thể thích</div>
      <div className="text-lg text-gray-800/50 mx-20 my-5 px-6">
        Từ những khóa học bạn vừa xem và tìm kiếm gần đây.
      </div>
      <div className="py-5 px-20 bg-gray-100 ">
         <TooltipProvider >
            <Slider
            className={"overflow-visible bg-none"}
            ref={sliderRef}
            {...settings}
            >
              {rcmdList.map((course, index) => (
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
      </div>
    </div>
  );
}

export default RecommendList;
