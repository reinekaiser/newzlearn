import Favorite from "../models/favorite.js";
import Course from "../models/course.js";
import Review from "../models/review.js";

// Thêm khóa học vào danh sách yêu thích
export const addToFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
    }

    // Kiểm tra khóa học có tồn tại không
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Kiểm tra đã yêu thích chưa
    const existingFavorite = await Favorite.findOne({ userId, courseId });
    if (existingFavorite) {
      return res.status(400).json({ message: "Course already in favorites" });
    }

    // Tạo favorite mới
    const favorite = new Favorite({
      userId,
      courseId,
    });
    await favorite.save();

    res.status(201).json({ message: "Added to favorites", favorite });
  } catch (error) {
    console.error("Error in addToFavorites:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Xóa khóa học khỏi danh sách yêu thích
export const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const favorite = await Favorite.findOneAndDelete({ userId, courseId });

    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Error in removeFromFavorites:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Lấy danh sách yêu thích của người dùng
export const getMyFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const favorites = await Favorite.find({ userId })
      .populate({
        path: "courseId",
        select:
          "title subtitle thumbnail price level averageRating category alias",
        populate: {
          path: "sections.sectionId",
          select: "lectures quizzes",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Lấy số lượng reviews cho mỗi khóa học
    const courseIds = favorites.map((f) => f.courseId?._id).filter(Boolean);

    const reviewCounts = await Review.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: "$courseId", count: { $sum: 1 } } },
    ]);

    const reviewCountMap = {};
    reviewCounts.forEach((item) => {
      reviewCountMap[item._id.toString()] = item.count;
    });

    // Thêm số lượng reviews vào mỗi khóa học
    const favoritesWithReviews = favorites
      .filter((f) => f.courseId) // Lọc các khóa học null
      .map((favorite) => {
        const course = favorite.courseId;
        return {
          ...course,
          _id: course._id,
          reviews: reviewCountMap[course._id.toString()] || 0,
        };
      });

    res.status(200).json(favoritesWithReviews);
  } catch (error) {
    console.error("Error in getMyFavorites:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Kiểm tra xem khóa học có trong danh sách yêu thích không
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.params;

    const favorite = await Favorite.findOne({ userId, courseId });

    res.status(200).json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Error in checkFavorite:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
