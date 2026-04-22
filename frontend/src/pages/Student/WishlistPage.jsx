"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteCourseCard from "@/components/student/courses-catalog/FavoriteCourseCard";
import { HeartOff } from "lucide-react";
import { useGetMyFavoritesQuery, useRemoveFromFavoritesMutation } from "@/redux/api/favoriteApiSlice";
import { useNavigate } from "react-router-dom";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { data: favorites = [], isLoading, error } = useGetMyFavoritesQuery();
  const [removeFromFavorites, { isLoading: isRemoving }] = useRemoveFromFavoritesMutation();

  const removeFavorite = async (courseId) => {
    try {
      await removeFromFavorites(courseId).unwrap();
      toast.success("Đã xóa khỏi yêu thích");
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

   const onClickCourse = (courseId, courseAlias) => {
    navigate(`/course/${courseAlias}`);
  }

  return (
    <>
      <Header />

      <main className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-10">
          {/* TITLE */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              Danh sách yêu thích
            </h1>
            <span className="text-sm text-gray-500">
              {favorites.length} khóa học
            </span>
          </div>

          {/* LOADING STATE */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#098be4] mb-4"></div>
              <p className="text-gray-500 text-lg">Đang tải danh sách yêu thích...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <HeartOff className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Có lỗi xảy ra khi tải danh sách yêu thích</p>
            </div>
          ) : favorites.length === 0 ? (
            /* EMPTY STATE */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <HeartOff className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                Bạn chưa có khóa học yêu thích nào
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Hãy khám phá và thêm khóa học bạn quan tâm vào danh sách yêu thích
              </p>
            </div>
          ) : (
            /* GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {favorites.map((course) => (
                <div
                  key={course._id}
                  className="h-full cursor-pointer" 
                  onClick={() => onClickCourse(course._id, course.alias)}
                >
                <FavoriteCourseCard
                  key={course._id}
                  course={course}
                  onRemove={removeFavorite}
                />
                 </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
