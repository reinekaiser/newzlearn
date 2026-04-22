import UserBehavior from "../models/userBehavior.js";
import UserRecommendation from "../models/userRecommendation.js";
import Course from "../models/course.js";

// Trọng số đề xuất
const WEIGHTS = {
  ORDERED: 5,
  VIEWED: 2,
  SEARCHED: 3,
  RECENT_VIEW: 1.5,
};

// Phương pháp content-based filtering kết hợp hành vi người dùng
// Thay vì sử dụng mô hình ML phức tạp như cosine similarity trên vector TF-IDF,
// ta áp dụng các luật chấm điểm (heuristic scoring) dựa trên mức độ tương đồng nội dung, hành vi tương tác và tính thời gian
// => đơn giản, dễ triển khai, không cần ML phức tạp, phù hợp dữ liệu nhỏ - trung bình, muốn mở rộng sau này cũng dễ
export const calculateRecommendations = async (userId, limit = 10) => {
  console.log("Bắt đầu tính toán...");
  try {
    // 1. Lấy dữ liệu
    const behavior = await UserBehavior.findOne({ user: userId })
      .populate("ordered.course")
      .populate("viewed.course");

    if (!behavior) {
      console.log("Chưa tồn tại dữ liệu người dùng.");
      return [];
    }

    // 2. Thu thập dữ liệu
    const orderedCourseIds = behavior.ordered.map((o) =>
      o.course._id.toString()
    );
    const viewedCourses = behavior.viewed;
    const searchedKeywords = behavior.searched.map((s) => s.normalized);

    // 3. Lấy khoá học đề cử (chưa mua)
    const candidateCourses = await Course.find({
      status: "published",
      _id: { $nin: orderedCourseIds },
    });

    const scoreMap = new Map();
    const now = Date.now();

    // 4. Chấm điểm
    for (const course of candidateCourses) {
      let score = 0;

      const courseText = `
        ${course.title}
        ${course.subtitle}
        ${course.description}
        ${course.category}
        ${course.subcategory}
      `.toLowerCase();

      // 4.1 viewed
      const viewed = viewedCourses.find(
        (v) => v.course._id.toString() === course._id.toString()
      );
      if (viewed) {
        score += WEIGHTS.VIEWED * Math.log(viewed.count + 1);

        const daysAgo =
          (now - new Date(viewed.lastView)) / (1000 * 60 * 60 * 24);
        if (daysAgo < 7) score += WEIGHTS.RECENT_VIEW;
      }

      // 4.2 searched keywords
      for (const keyword of searchedKeywords) {
        if (courseText.includes(keyword)) {
          score += WEIGHTS.SEARCHED;
        }
      }

      // 4.3 ordered similarity (same category)
      for (const ordered of behavior.ordered) {
        if (ordered.course.category === course.category) {
          score += WEIGHTS.ORDERED;
          break;
        }
      }

      if (score > 0) {
        scoreMap.set(course._id.toString(), {
          course: course._id,
          score: Number(score.toFixed(2)),
        });
      }
    }

    // 5. Sắp xếp & lấy top
    const recommendations = Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // 6. Lưu kết quả
    await UserRecommendation.updateOne(
      { user: userId },
      {
        $set: {
          recommendedCourses: recommendations,
        },
      },
      { upsert: true }
    );

    // 7. cập nhật lastCalculated
    await UserBehavior.updateOne(
      { user: userId },
      { $set: { lastCalculated: new Date(), calculating: false } }
    );

    console.log("Đã tính toán khuyến nghị xong.");
    return recommendations;
  } catch (error) {
    console.log("Đã xảy ra lỗi khi tính toán khuyến nghị:", error);
    await UserBehavior.updateOne(
      { user: userId },
      { $set: { calculating: false } }
    );
    return [];
  }
};
