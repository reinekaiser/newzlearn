import Progress from "../models/progress.js";
import CourseProgress from "../models/courseProgress.js";
import Lecture from "../models/lecture.js";
import Quiz from "../models/quiz.js";
import Course from "../models/course.js";
import Submission from "../models/submission.js";
import mongoose from "mongoose";
import Section from "../models/section.js";
import Order from "../models/order.js";
import Review from "../models/review.js";

const getSectionStats = async (sectionId) => {
  const section = await Section.findById(sectionId)
    .select("curriculumItems")
    .lean();
  if (!section) return [];
  const itemIds = section.curriculumItems.map((ci) => ci.itemId);

  const lectures = await Lecture.find({ _id: { $in: itemIds } })
    .select("_id title content.duration")
    .lean();
  const quizzes = await Quiz.find({ _id: { $in: itemIds } })
    .select("_id title questions")
    .lean();

  const progressMap = new Map();
  const progresses = await Progress.find({
    sectionId,
    itemId: { $in: itemIds },
  }).lean();
  progresses.forEach((p) => {
    const key = p.itemId.toString();
    if (!progressMap.has(key)) progressMap.set(key, []);
    progressMap.get(key).push(p);
  });

  const lectureMap = Object.fromEntries(
    lectures.map((l) => [l._id.toString(), l]),
  );
  const quizMap = Object.fromEntries(quizzes.map((q) => [q._id.toString(), q]));

  return section.curriculumItems
    .map((ci) => {
      const idStr = ci.itemId.toString();
      const related = progressMap.get(idStr) || [];

      if (ci.itemType === "Lecture") {
        const lecture = lectureMap[idStr];
        const watched = related.length; //số lượt xem item
        const amountWatched = watched
          ? Math.ceil(
              (related.reduce(
                (sum, p) =>
                  sum +
                  (p.totalSeconds ? p.watchedSeconds / p.totalSeconds : 0),
                0,
              ) /
                watched) *
                100,
            )
          : 0;
        const rawDuration = Math.round(lecture.content?.duration || 0);
        const minutes = Math.floor(rawDuration / 60);
        const seconds = rawDuration % 60;
        const durationStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        return {
          id: idStr,
          title: lecture.title,
          duration: durationStr,
          watched,
          amountWatched,
          type: "Lecture",
        };
      } else if (ci.itemType === "Quiz") {
        const quiz = quizMap[idStr];
        const watched = related.length;
        const amountWatched = watched
          ? Math.ceil(
              related.reduce((sum, p) => sum + (p.progressPercent || 0), 0) /
                watched,
            )
          : 0;
        const duration = quiz.questions.length.toString();
        return {
          id: idStr,
          title: quiz.title,
          duration,
          watched,
          amountWatched,
          type: "Quiz",
        };
      }
      return null;
    })
    .filter(Boolean);
};

const getItemCompletionRate = async (sectionId, totalStudents) => {
  const section = await Section.findById(sectionId)
    .select("curriculumItems")
    .lean();
  if (!section) return [];
  const itemIds = section.curriculumItems.map((ci) => ci.itemId);

  const lectures = await Lecture.find({ _id: { $in: itemIds } })
    .select("_id title content.duration")
    .lean();
  const quizzes = await Quiz.find({ _id: { $in: itemIds } })
    .select("_id title questions")
    .lean();

  const lectureMap = Object.fromEntries(
    lectures.map((l) => [l._id.toString(), l]),
  );
  const quizMap = Object.fromEntries(quizzes.map((q) => [q._id.toString(), q]));

  const progressStats = await Progress.aggregate([
    { $match: { itemId: { $in: itemIds } } },
    {
      $group: {
        _id: {
          itemId: "$itemId",
          userId: "$userId",
        },
        hasWatched: {
          $max: {
            $cond: [{ $gt: ["$progressPercent", 0] }, 1, 0],
          },
        },
        hasCompleted: {
          $max: {
            $cond: [{ $eq: ["$isCompleted", true] }, 1, 0],
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.itemId",
        completedCount: { $sum: "$hasCompleted" },
        watchedCount: { $sum: "$hasWatched" },
      },
    },
  ]);

  const progressMap = Object.fromEntries(
    progressStats.map((p) => [
      p._id.toString(),
      {
        watchedCount: p.watchedCount,
        completedCount: p.completedCount,
      },
    ]),
  );

  const items = section.curriculumItems
    .map((ci) => {
      const idStr = ci.itemId.toString();
      const watchedCount = progressMap[idStr]?.watchedCount || 0;
      const completedCount = progressMap[idStr]?.completedCount || 0;

      if (lectureMap[idStr]) {
        const lecture = lectureMap[idStr];
        const duration = lecture.content?.duration || 0;

        return {
          id: idStr,
          title: lecture.title,
          duration: duration
            ? `${Math.floor(Math.round(duration) / 60)}:${String(Math.round(duration) % 60).padStart(2, "0")}`
            : "0:00",
          watched: `${watchedCount}/${totalStudents}`,
          completedPercent: totalStudents
            ? Math.floor((completedCount / totalStudents) * 100)
            : 0,
          type: "Lecture",
        };
      }

      if (quizMap[idStr]) {
        const quiz = quizMap[idStr];

        return {
          id: idStr,
          title: quiz.title,
          duration: quiz.questions.length.toString(),
          watched: `${watchedCount}/${totalStudents}`,
          completedPercent: totalStudents
            ? Math.floor((completedCount / totalStudents) * 100)
            : 0,
          type: "Quiz",
        };
      }

      return null;
    })
    .filter(Boolean);

  return items;
};

export const getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (courseId == "all")
      return res.status(200).json({
        courseId: null,
        title: null,
        totalItems: null,
        totalStudents: null,
        sections: [],
      });

    if (!courseId)
      return res.status(400).json({ message: "courseId is required" });

    const course = await Course.findById(courseId)
      .populate("sections.sectionId", "title")
      .select("_id title sections")
      .lean();
    if (!course) return res.status(404).json({ message: "Course not found" });

    const totalStudentsSet = new Set(
      await Order.distinct("userId", { courseId: courseId }),
    );

    const sectionsStats = [];
    for (const section of course.sections) {
      // const sectionStats = await getSectionStats(section.sectionId);
      const itemCompletionRate = await getItemCompletionRate(
        section.sectionId,
        totalStudentsSet.size,
      );
      sectionsStats.push({
        sectionId: section.sectionId,
        sectionTitle: section.sectionId.title,
        sectionOrder: section.order,
        items: itemCompletionRate,
      });
    }

    return res.status(200).json({
      courseId: course._id,
      title: course.title,
      totalItems: sectionsStats.reduce((sum, s) => sum + s.items.length, 0),
      totalStudents: totalStudentsSet.size,
      sections: sectionsStats,
    });
  } catch (error) {
    console.error("Error getting course stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const handleMonthsStats = async (now, totalMonths, matchStage) => {
  const raw = await Progress.aggregate([
    { $match: { ...matchStage, watchedSeconds: { $gt: 0 } } },
    {
      $group: {
        _id: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
        },
        totalSeconds: { $sum: "$watchedSeconds" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthMap = {};
  raw.forEach((row) => {
    const mm = row._id.month.toString().padStart(2, "0");
    const yy = row._id.year.toString().slice(2);
    monthMap[`${mm}/${yy}`] = Number((row.totalSeconds / 60).toFixed(2));
  });

  const uniqueUsers = await Progress.distinct("userId", {
    ...matchStage,
    watchedSeconds: { $gt: 0 },
  });

  let result = [];
  for (let i = totalMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);

    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yy = d.getFullYear().toString().slice(2);
    const key = `${mm}/${yy}`;

    result.push({
      month: key,
      minutes: monthMap[key] || 0,
      current:
        mm === (now.getMonth() + 1).toString().padStart(2, "0") &&
        yy === now.getFullYear().toString().slice(2),
    });
  }

  return { totalStudents: uniqueUsers.length, result };
};

const handleWeekStats = async (now, totalDays, matchStage) => {
  const raw = await Progress.aggregate([
    { $match: { ...matchStage, watchedSeconds: { $gt: 0 } } },
    {
      $group: {
        _id: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
          day: { $dayOfMonth: "$updatedAt" },
        },
        totalSeconds: { $sum: "$watchedSeconds" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  const dayMap = {};
  raw.forEach((row) => {
    const dd = row._id.day.toString().padStart(2, "0");
    const mm = row._id.month.toString().padStart(2, "0");
    const yy = row._id.year.toString().slice(2);

    dayMap[`${dd}/${mm}/${yy}`] = Number((row.totalSeconds / 60).toFixed(2));
  });

  let result = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yy = d.getFullYear().toString().slice(2);
    const key = `${dd}/${mm}/${yy}`;

    result.push({
      month: key,
      minutes: dayMap[key] || 0,
      current:
        dd === now.getDate().toString().padStart(2, "0") &&
        mm === (now.getMonth() + 1).toString().padStart(2, "0"),
    });
  }
  const uniqueUsers = await Progress.distinct("userId", {
    ...matchStage,
    watchedSeconds: { $gt: 0 },
  });
  return { totalStudents: uniqueUsers.length, result };
};

const handleAllTimeStats = async (now, matchStage) => {
  const raw = await Progress.aggregate([
    { $match: { ...matchStage, watchedSeconds: { $gt: 0 } } },
    {
      $group: {
        _id: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
        },
        totalSeconds: { $sum: "$watchedSeconds" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const uniqueUsers = await Progress.distinct("userId", {
    ...matchStage,
    watchedSeconds: { $gt: 0 },
  });

  if (raw.length === 0) {
    return { totalStudents: uniqueUsers.length, result: [] };
  }

  const monthMap = {};
  raw.forEach((row) => {
    const mm = row._id.month.toString().padStart(2, "0");
    const yy = row._id.year.toString().slice(2);
    monthMap[`${mm}/${yy}`] = Number((row.totalSeconds / 60).toFixed(2));
  });

  let result = [];
  const first = raw[0]._id;
  const cursor = new Date(first.year, first.month - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  while (cursor <= end) {
    const mm = (cursor.getMonth() + 1).toString().padStart(2, "0");
    const yy = cursor.getFullYear().toString().slice(2);
    const key = `${mm}/${yy}`;

    result.push({
      month: key,
      minutes: monthMap[key] || 0,
      current:
        mm === (now.getMonth() + 1).toString().padStart(2, "0") &&
        yy === now.getFullYear().toString().slice(2),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { totalStudents: uniqueUsers.length, result };
};

export const getLearningMinutesStats = async (req, res) => {
  const { range = "alltime", courseId = null } = req.query;

  try {
    const now = new Date();
    let startDate = null;
    let totalMonths = null;
    let totalDays = null;

    if (range === "6months") totalMonths = 6;
    else if (range === "12months") totalMonths = 12;
    else if (range === "1week") {
      totalDays = 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (totalDays - 1));
    }

    const matchStage = {};
    if (courseId && courseId !== "all") {
      matchStage.courseId = new mongoose.Types.ObjectId(courseId);
    }
    if (startDate) matchStage.createdAt = { $gte: startDate };

    let data;
    if (range === "1week") {
      data = await handleWeekStats(now, totalDays, matchStage);
    } else if (totalMonths) {
      data = await handleMonthsStats(now, totalMonths, matchStage);
    } else {
      data = await handleAllTimeStats(now, matchStage);
    }

    return res.status(200).json({
      totalStudents: data.totalStudents,
      result: data.result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const handleMonthsCountStats = async (now, totalMonths, matchStage) => {
  const raw = await Progress.aggregate([
    { $match: { ...matchStage, progressPercent: { $gt: 0 } } },
    {
      $group: {
        _id: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
        },
        lectureCount: {
          $sum: { $cond: [{ $eq: ["$itemType", "Lecture"] }, 1, 0] },
        },
        quizCount: {
          $sum: { $cond: [{ $eq: ["$itemType", "Quiz"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthMap = {};
  raw.forEach((row) => {
    const mm = row._id.month.toString().padStart(2, "0");
    const yy = row._id.year.toString().slice(2);
    const key = `${mm}/${yy}`;

    monthMap[key] = {
      lectureCount: row.lectureCount,
      quizCount: row.quizCount,
    };
  });

  const uniqueUsers = await Progress.distinct("userId", {
    ...matchStage,
    progressPercent: { $gt: 0 },
  });

  let result = [];
  for (let i = totalMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yy = d.getFullYear().toString().slice(2);
    const key = `${mm}/${yy}`;

    result.push({
      month: key,
      lectureCount: monthMap[key]?.lectureCount || 0,
      quizCount: monthMap[key]?.quizCount || 0,
      current:
        mm === (now.getMonth() + 1).toString().padStart(2, "0") &&
        yy === now.getFullYear().toString().slice(2),
    });
  }

  return { totalStudents: uniqueUsers.length, result };
};

const handleAlltimeCountStats = async (now, matchStage) => {
  const raw = await Progress.aggregate([
    { $match: { ...matchStage, progressPercent: { $gt: 0 } } },
    {
      $group: {
        _id: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
        },
        lectureCount: {
          $sum: { $cond: [{ $eq: ["$itemType", "Lecture"] }, 1, 0] },
        },
        quizCount: {
          $sum: { $cond: [{ $eq: ["$itemType", "Quiz"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  if (raw.length === 0) {
    return { totalStudents: uniqueUsers.length, result: [] };
  }

  const monthMap = {};
  raw.forEach((row) => {
    const mm = row._id.month.toString().padStart(2, "0");
    const yy = row._id.year.toString().slice(2);
    const key = `${mm}/${yy}`;

    monthMap[key] = {
      lectureCount: row.lectureCount,
      quizCount: row.quizCount,
    };
  });

  const uniqueUsers = await Progress.distinct("userId", {
    ...matchStage,
    progressPercent: { $gt: 0 },
  });

  let result = [];
  const first = raw[0]._id;
  const firstDate = new Date(first.year, first.month - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let cursor = new Date(firstDate);
  while (cursor <= endDate) {
    const mm = (cursor.getMonth() + 1).toString().padStart(2, "0");
    const yy = cursor.getFullYear().toString().slice(2);
    const key = `${mm}/${yy}`;

    result.push({
      month: key,
      lectureCount: monthMap[key]?.lectureCount || 0,
      quizCount: monthMap[key]?.quizCount || 0,
      current:
        mm === (now.getMonth() + 1).toString().padStart(2, "0") &&
        yy === now.getFullYear().toString().slice(2),
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }
  return { totalStudents: uniqueUsers.length, result };
};

const handleWeekCountStats = async (now, totalDays, matchStage) => {
  const raw = await Progress.aggregate([
    { $match: { ...matchStage, progressPercent: { $gt: 0 } } },
    {
      $group: {
        _id: {
          year: { $year: "$updatedAt" },
          month: { $month: "$updatedAt" },
          day: { $dayOfMonth: "$updatedAt" },
        },
        lectureCount: {
          $sum: { $cond: [{ $eq: ["$itemType", "Lecture"] }, 1, 0] },
        },
        quizCount: {
          $sum: { $cond: [{ $eq: ["$itemType", "Quiz"] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);

  const dayMap = {};
  raw.forEach((row) => {
    const dd = row._id.day.toString().padStart(2, "0");
    const mm = row._id.month.toString().padStart(2, "0");
    const yy = row._id.year.toString().slice(2);
    const key = `${dd}/${mm}/${yy}`;
    dayMap[key] = {
      lectureCount: row.lectureCount,
      quizCount: row.quizCount,
    };
  });

  const uniqueUsers = await Progress.distinct("userId", {
    ...matchStage,
    progressPercent: { $gt: 0 },
  });

  let result = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yy = d.getFullYear().toString().slice(2);
    const key = `${dd}/${mm}/${yy}`;

    result.push({
      month: key,
      lectureCount: dayMap[key]?.lectureCount || 0,
      quizCount: dayMap[key]?.quizCount || 0,
      current:
        dd === now.getDate().toString().padStart(2, "0") &&
        mm === (now.getMonth() + 1).toString().padStart(2, "0"),
    });
  }

  return { totalStudents: uniqueUsers.length, result };
};

export const getLearningItemsCountStats = async (req, res) => {
  const { range = "alltime", courseId = null } = req.query;

  try {
    const now = new Date();
    let startDate = null;
    let totalMonths = null;
    let totalDays = null;

    if (range === "6months") totalMonths = 6;
    else if (range === "12months") totalMonths = 12;
    else if (range === "1week") {
      totalDays = 7;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (totalDays - 1));
    }

    const matchStage = {};
    if (courseId && courseId !== "all") {
      matchStage.courseId = new mongoose.Types.ObjectId(courseId);
    }

    let stats;
    if (totalMonths) {
      stats = await handleMonthsCountStats(now, totalMonths, matchStage);
    } else if (range === "alltime") {
      stats = await handleAlltimeCountStats(now, matchStage);
    } else if (range === "1week") {
      stats = await handleWeekCountStats(now, totalDays, matchStage);
    } else {
      return res.status(400).json({ message: "Invalid range" });
    }

    return res.status(200).json({
      totalStudents: stats.totalStudents,
      result: stats.result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Tổng quan doanh thu & đăng ký (overview)
export const getRevenueOverview = async (req, res) => {
  try {
    const { range = "alltime" } = req.query;
    const now = new Date();

    let startDate = null;
    let totalMonths = null;

    if (range === "6months") totalMonths = 6;
    else if (range === "12months") totalMonths = 12;

    if (totalMonths) {
      // tính từ đầu tháng cách đây (totalMonths - 1) tháng
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - (totalMonths - 1),
        1,
      );
    }

    // Match cho toàn bộ đơn hàng trong khoảng range (hoặc mọi thời điểm)
    const rangeMatchStage = {};
    if (startDate) {
      rangeMatchStage.createdAt = { $gte: startDate };
    }

    // Tổng doanh thu & lượt đăng ký trong range (ép kiểu totalPrice thành số, chống thiếu createdAt)
    const totalAgg = await Order.aggregate([
      { $match: rangeMatchStage },
      {
        $addFields: {
          createdAtSafe: { $ifNull: ["$createdAt", "$$NOW"] },
          priceNum: { $toDouble: "$totalPrice" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$priceNum" },
          totalEnrollments: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = totalAgg[0]?.totalRevenue || 0;
    const totalEnrollments = totalAgg[0]?.totalEnrollments || 0;

    // Rating giảng viên trong range
    const ratingMatchStage = {};
    if (startDate) {
      ratingMatchStage.createdAt = { $gte: startDate };
    }

    const ratingAgg = await Review.aggregate([
      {
        $match: ratingMatchStage,
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratingInfo = ratingAgg[0] || { avgRating: 0, count: 0 };

    // Dữ liệu biểu đồ theo tháng
    const matchStage = {};
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }

    const rawMonthly = await Order.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          createdAtSafe: { $ifNull: ["$createdAt", "$$NOW"] },
          priceNum: { $toDouble: "$totalPrice" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAtSafe" },
            month: { $month: "$createdAtSafe" },
          },
          revenue: { $sum: "$priceNum" },
          enrollments: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    if (rawMonthly.length === 0) {
      return res.status(200).json({
        summary: {
          totalRevenue,
          totalEnrollments,
          instructorRating: Number(ratingInfo.avgRating?.toFixed?.(2) || 0),
          ratingCount: ratingInfo.count || 0,
        },
        chart: [],
      });
    }

    const monthMap = {};
    rawMonthly.forEach((row) => {
      const mm = row._id.month.toString().padStart(2, "0");
      const yy = row._id.year.toString().slice(2);
      const key = `${mm}/${yy}`;
      monthMap[key] = {
        revenue: row.revenue,
        enrollments: row.enrollments,
      };
    });

    let result = [];

    if (range === "alltime") {
      const first = rawMonthly[0]._id;
      const cursor = new Date(first.year, first.month - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);

      while (cursor <= end) {
        const mm = (cursor.getMonth() + 1).toString().padStart(2, "0");
        const yy = cursor.getFullYear().toString().slice(2);
        const key = `${mm}/${yy}`;

        result.push({
          month: key,
          revenue: monthMap[key]?.revenue || 0,
          enrollments: monthMap[key]?.enrollments || 0,
          current:
            mm === (now.getMonth() + 1).toString().padStart(2, "0") &&
            yy === now.getFullYear().toString().slice(2),
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }
    } else if (totalMonths) {
      for (let i = totalMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mm = (d.getMonth() + 1).toString().padStart(2, "0");
        const yy = d.getFullYear().toString().slice(2);
        const key = `${mm}/${yy}`;

        result.push({
          month: key,
          revenue: monthMap[key]?.revenue || 0,
          enrollments: monthMap[key]?.enrollments || 0,
          current:
            mm === (now.getMonth() + 1).toString().padStart(2, "0") &&
            yy === now.getFullYear().toString().slice(2),
        });
      }
    }

    return res.status(200).json({
      summary: {
        totalRevenue,
        totalEnrollments,
        instructorRating: Number(ratingInfo.avgRating?.toFixed?.(2) || 0),
        ratingCount: ratingInfo.count || 0,
      },
      chart: result,
    });
  } catch (error) {
    console.error("Error getting revenue overview:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
