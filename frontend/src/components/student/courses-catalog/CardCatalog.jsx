"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Check, Heart } from "lucide-react";
import {
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useCheckFavoriteQuery,
} from "@/redux/api/favoriteApiSlice";
import { toast } from "react-toastify";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
export function CardCatalog({ course, index, columns = 3 }) {
  const [popUp, setPopUp] = useState(false);
  const [cardLeave, setCardLeave] = useState(false);
  const [popUpLeave, setPopUpLeave] = useState(true);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [width, setWidth] = useState(300);
  const closeTimeoutRef = useRef(null);

  // Close popup when both card and popup are left (with delay)
  useEffect(() => {
    if (cardLeave && popUpLeave) {
      closeTimeoutRef.current = setTimeout(() => {
        setPopUp(false);
      }, 150); // 150ms delay để có thời gian di chuột sang popup
    } else {
      // Clear timeout nếu vào lại card hoặc popup
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [cardLeave, popUpLeave]);

  // Favorite functionality
  const [addToFavorites, { isLoading: isAddingFavorite }] = useAddToFavoritesMutation();
  const [removeFromFavorites, { isLoading: isRemovingFavorite }] = useRemoveFromFavoritesMutation();
  const { data: favoriteData, isLoading: isCheckingFavorite } = useCheckFavoriteQuery(course?._id, {
    skip: !course?._id,
  });
  const isFavorite = favoriteData?.isFavorite || false;
  const isLoading = isAddingFavorite || isRemovingFavorite;

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (isLoading) return;

    try {
      if (isFavorite) {
        await removeFromFavorites(course._id).unwrap();
        toast.success("Đã xóa khỏi yêu thích");
      } else {
        await addToFavorites(course._id).unwrap();
        toast.success("Đã thêm vào yêu thích");
      }
    } catch (error) {
      console.error("Error toggling favorites:", error);
      toast.error(isFavorite ? "Lỗi khi xóa khỏi yêu thích" : "Lỗi khi thêm vào yêu thích");
    }
  };

  const formatPrice = (price) => `₫${price.toLocaleString()}`;

  // card nằm ở cột phải => popup mở sang trái
  const isRightEdge = (index + 1) % columns === 0;

  const onEnter = (e) => {
    setCardLeave(false);
    setPopUpLeave(false);
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({
      x: rect.left,
      y: rect.top,
    });
    setWidth(rect.width);
    setPopUp(true);
  };

  const onLeave = () => {
    setCardLeave(true);
    setPopUpLeave(true);
  };

  return (
    <TooltipProvider>
      <div className="relative w-full h-full group cursor-pointer">
        {/* MAIN CARD */}
        <Tooltip key={course._id || course.id}>
          <TooltipTrigger asChild>
            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg hover:scale-105 transition-transform duration-300 h-full flex flex-col">
              <img
                src={course?.thumbnail?.publicURL || "/logo.png"}
                alt={course.title}
                className="w-full h-36 object-cover rounded-t-lg"
              />

              <div className="px-5 py-3 flex flex-col flex-1 space-y-1">
                <h3 className="text-base font-semibold line-clamp-2 group-hover:text-[#098be4]">
                  {course.title}
                </h3>

                <p className="text-xs text-gray-600">
                  {course.description.replace(/<[^>]+>/g, "").slice(0, 110)}
                  {course.description.replace(/<[^>]+>/g, "").length > 110 && "..."}
                </p>

                <div className="flex items-center gap-1 text-xs">
                  <span className="text-yellow-500">{course.averageRating}</span>
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold group-hover:text-[#098be4]">
                    {formatPrice(course.price)}
                  </span>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            align="center"
            sideOffset={4}
            className="max-w-[300px] p-4 z-50 border-gray-200 bg-white shadow-md text-black [&>svg]:fill-white [&>svg]:bg-white"
            arrowClassName={"fill-white bg-white"}
          >
            {/* Nội dung popup - thay thế coursePopUp cũ */}
            <div>
              <p className="text-sm xl:text-base font-semibold text-black">{course.title}</p>
              <div className="flex space-x-2 w-full items-center h-8 ">
                {course.level && (
                  <span className="font-semibold text-xs px-2 py-1 bg-[#cee8fb] text-[#098be4] rounded max-w-1/2">
                    {course.level}
                  </span>
                )}
                <p className="text-xs py-1 italic max-w-1/2">
                  Cập nhật:{" "}
                  {(course.updatedAt ? new Date(course.updatedAt) : new Date()).toLocaleDateString(
                    "vi",
                  )}
                </p>
              </div>

              <div className="text-xs/5 text-gray-800 py-2 space-y-2">
                <p>{course?.subtitle}</p>
                <ul className="list-disc  px-6 ">
                  {course?.learningOutcomes?.map((outcome, idx) => {
                    return <li key={idx}>{outcome}</li>;
                  })}
                </ul>
              </div>

              <button
                className={`mt-2 w-full py-2 rounded transition flex items-center justify-center gap-2 ${
                  isFavorite
                    ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                    : "bg-[#098be4] text-white hover:bg-[#087ac7]"
                }`}
                onClick={handleToggleFavorite}
                disabled={isLoading || isCheckingFavorite}
              >
                {isLoading ? (
                  isFavorite ? (
                    "Đang xóa..."
                  ) : (
                    "Đang thêm..."
                  )
                ) : isFavorite ? (
                  <>
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    Đã thêm vào yêu thích
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Thêm vào yêu thích
                  </>
                )}
              </button>
            </div>
          </TooltipContent>
        </Tooltip>
        {/* POPUP */}
        {/* <div
          className="absolute top-0 z-50"
          style={{
            top: "-10px",
            left: isRightEdge ? `calc(-100% - 25px)` : `calc(100% + 25px)`,
            width: width,
            backgroundColor: "white",
            padding: "1rem",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            opacity: popUp ? 1 : 0,
            transform: popUp ? "scale(1)" : "scale(0.95)",
            transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out",
            pointerEvents: popUp ? "auto" : "none",
          }}
          onMouseEnter={() => setPopUpLeave(false)}
          onMouseLeave={() => setPopUpLeave(true)}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              width: 0,
              height: 0,
              ...(isRightEdge
                ? {
                    right: "-10px",
                    borderTop: "12px solid transparent",
                    borderBottom: "12px solid transparent",
                    borderLeft: "12px solid white",
                  }
                : {
                    left: "-10px",
                    borderTop: "12px solid transparent",
                    borderBottom: "12px solid transparent",
                    borderRight: "12px solid white",
                  }),
            }}
          />

          <div>
            <p className="text-sm xl:text-base font-semibold">{course.title}</p>
            <div className="flex space-x-2 w-full items-center h-8">
              {course.level && (
                <span className="font-semibold text-xs px-2 py-1 bg-[#cee8fb] text-[#098be4] rounded max-w-1/2">
                  {course.level}
                </span>
              )}
              <p className="text-xs py-1 italic max-w-1/2">
                Cập nhật:{" "}
                {(course.updatedAt ? new Date(course.updatedAt) : new Date()).toLocaleDateString(
                  "vi",
                )}
              </p>
            </div>

            <div className="text-xs/5 text-gray-800 py-2 space-y-2">
              <p>{course?.subtitle}</p>
              <ul className="list-disc px-6">
                {course?.learningOutcomes?.slice(0, 3).map((outcome, idx) => (
                  <li key={idx}>{outcome}</li>
                ))}
              </ul>
            </div>

            <button
              className={`mt-2 w-full py-2 rounded transition flex items-center justify-center gap-2 ${
                isFavorite
                  ? "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                  : "bg-[#098be4] text-white hover:bg-[#087ac7]"
              }`}
              onClick={handleToggleFavorite}
              disabled={isLoading || isCheckingFavorite}
            >
              {isLoading ? (
                isFavorite ? (
                  "Đang xóa..."
                ) : (
                  "Đang thêm..."
                )
              ) : isFavorite ? (
                <>
                  <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  Đã thêm vào yêu thích
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Thêm vào yêu thích
                </>
              )}
            </button>
          </div>
        </div> */}
      </div>
    </TooltipProvider>
  );
}
