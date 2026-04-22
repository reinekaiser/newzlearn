import UserBehavior from "../models/userBehavior.js";
import UserRecommendation from "../models/userRecommendation.js";
import { calculateRecommendations } from "../utils/recommendationCalculate.js";

export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    const behavior = await UserBehavior.findOne({ user: userId });
    const data = await UserRecommendation.findOne({ user: userId }).populate(
      "recommendedCourses.course"
    );
    res.json(data?.recommendedCourses || []);
    // chạy ngầm
    if (
      !behavior?.lastCalculated ||
      Date.now() - behavior?.lastCalculated > 1000 * 60 * 60 * 2 // 2 giờ
    ) {
      if (behavior?.calculating === true) return; // đang tính toán => tránh chạy trùng
      await UserBehavior.updateOne(
        { user: userId },
        { $set: { calculating: true } }
      );
      console.log(
        "Thông tin khuyến nghị đã cũ hoặc không tồn tại. Tiến hành tính toán lại."
      );

      calculateRecommendations(userId);
    }
  } catch (error) {
    console.error("getRecommendations error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
