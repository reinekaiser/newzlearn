import Button from "@/components/Button";
import { useCheckFavoriteQuery } from "@/redux/api/favoriteApiSlice";
import { Heart } from "lucide-react";


export default function FavoriteButton({ courseId, onAddToFavorite, onRemoveFromFavorite, isAddLoading, isRemoveLoading }) {
    const { data: favoriteData, isLoading: isChecking } = useCheckFavoriteQuery(courseId, {
      skip: !courseId,
    });
    const isFavorite = favoriteData?.isFavorite || false;
    const isLoading = isAddLoading || isRemoveLoading;
  
    if (!courseId) return null;
  
    const handleClick = (e) => {
      if (isFavorite) {
        onRemoveFromFavorite(e, courseId);
      } else {
        onAddToFavorite(e, courseId);
      }
    };
  
    return (
      <Button
        variant={isFavorite ? "outline" : "reverse"}
        className="w-full mt-2 flex items-center justify-center gap-2"
        onClick={handleClick}
        disabled={isLoading || isChecking}
      >
        {isLoading ? (
          isFavorite ? "Đang xóa..." : "Đang thêm..."
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
      </Button>
    );
  }