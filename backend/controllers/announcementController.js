import User from "../models/user.js";
import Order from "../models/order.js";
import CourseProgress from "../models/courseProgress.js";
import nodemailer from "nodemailer";

/**
 * Dynamically create transporter (Gmail hoặc SMTP)
 */
const createTransporter = () => {
  if (
    process.env.MAIL_SERVICE === "gmail" ||
    (!process.env.MAIL_HOST && process.env.EMAIL_USER?.includes("@gmail.com"))
  ) {
    console.log("[MAIL] Using Gmail service");
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });
  }

  const host = process.env.MAIL_HOST || "127.0.0.1"; // ép IPv4 tránh ::1
  const port = Number(process.env.MAIL_PORT) || 587;
  const secure = port === 465;

  console.log("[MAIL] Using SMTP", host, port);

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: process.env.EMAIL_USER
      ? {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      : undefined,
  });
};

/**
 * Helper: send in batches (to avoid too many concurrent SMTP connections)
 * users: array of { email, ... }
 * sendFn: async function(user) => result
 */
const sendInBatches = async (users, sendFn, batchSize = 10) => {
  const sent = [];
  const failed = [];

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (user) => {
        try {
          const info = await sendFn(user);
          sent.push({
            email: user.email,
            messageId: info?.messageId || null,
            info,
          });
          console.log(
            `[MAIL][OK] ${new Date().toISOString()} — Sent to ${
              user.email
            } messageId=${info?.messageId}`
          );
        } catch (err) {
          failed.push({
            email: user.email,
            error: err?.message || String(err),
          });
          console.error(
            `[MAIL][ERR] ${new Date().toISOString()} — Failed to ${
              user.email
            }:`,
            err
          );
        }
      })
    );
  }

  return { sent, failed };
};

export const sendAnnouncementMail = async (req, res) => {
  try {
    const { title, description, filters } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Thiếu title hoặc description.",
      });
    }

    // ------------------------------
    // (0) LỌC BẮT BUỘC: USER THUỘC KHÓA ĐÃ CHỌN
    // ------------------------------
    // mustInCourses = "ALL" hoặc array []
    if (
      !filters?.mustInCourses ||
      (filters.mustInCourses !== "ALL" &&
        (!Array.isArray(filters.mustInCourses) ||
          filters.mustInCourses.length === 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Thiếu danh sách khóa học bắt buộc (mustInCourses).",
      });
    }

    let mustOrders = [];

    if (filters.mustInCourses === "ALL") {
      // Lấy toàn bộ đơn đã thanh toán
      mustOrders = await Order.find({ isPaid: true }).lean();
    } else {
      const mustCourseIds = filters.mustInCourses.map((id) => String(id));

      mustOrders = await Order.find({
        courseId: { $in: mustCourseIds },
        isPaid: true,
      }).lean();
    }

    const mustUserIds = new Set(mustOrders.map((o) => String(o.userId)));

    if (mustUserIds.size === 0) {
      return res.json({
        success: false,
        message: "Không có user nào thuộc các khóa đã chọn.",
      });
    }

    // lấy danh sách user thuộc khóa
    let filteredUsers = await User.find({
      _id: { $in: Array.from(mustUserIds) },
    }).lean();

    // ------------------------------
    // (1) LỌC THEO NGÀY ĐĂNG KÝ
    // ------------------------------
    if (filters?.enrollmentDate) {
      const { after, before } = filters.enrollmentDate;

      filteredUsers = filteredUsers.filter((u) => {
        const created = new Date(u.createdAt);
        if (after && created < new Date(after)) return false;
        if (before && created > new Date(before)) return false;
        return true;
      });
    }

    // ------------------------------
    // (2) LỌC THEO TIẾN ĐỘ KHÓA HỌC
    // ------------------------------
    if (
      Array.isArray(filters?.courseProgress) &&
      filters.courseProgress.length > 0
    ) {
      // Parse filter ranges
      const conditions = filters.courseProgress.map((range) => {
        if (range.includes("-")) {
          const [min, max] = range.split("-").map(Number);
          return { min, max };
        }
        return { exact: Number(range) };
      });

      const mustCourseIds =
        filters.mustInCourses === "ALL"
          ? null
          : filters.mustInCourses.map((id) => String(id));

      // Lấy progress CHỈ của user + CHỈ của khóa nằm trong mustInCourses
      const progresses = await CourseProgress.find({
        userId: { $in: filteredUsers.map((u) => u._id) },
        ...(mustCourseIds ? { courseId: { $in: mustCourseIds } } : {}),
      }).lean();

      // Map userId → percentage (nếu không có thì 0%)
      const progressMap = {};
      progresses.forEach((p) => {
        const uid = String(p.userId);
        // Chúng ta chỉ lấy progress lớn nhất nếu user học nhiều khóa trong nhóm
        progressMap[uid] = Math.max(progressMap[uid] || 0, p.percentage || 0);
      });

      // Lọc user theo điều kiện
      filteredUsers = filteredUsers.filter((u) => {
        const uid = String(u._id);
        const percentage = progressMap[uid] ?? 0; // nếu chưa học → 0%

        return conditions.some((c) => {
          if (c.exact !== undefined) return percentage === c.exact;
          return percentage >= c.min && percentage <= c.max;
        });
      });
    }

    // ------------------------------
    // (3) LOẠI TRỪ THEO KHÓA HỌC
    // ------------------------------
    if (
      Array.isArray(filters?.excludeByCourse) &&
      filters.excludeByCourse.length > 0
    ) {
      const excludedCourseIds = filters.excludeByCourse.map((id) => String(id));

      const orders = await Order.find({
        courseId: { $in: excludedCourseIds },
        isPaid: true,
      }).lean();

      const excludeUserIds = new Set(orders.map((o) => String(o.userId)));

      filteredUsers = filteredUsers.filter(
        (u) => !excludeUserIds.has(String(u._id))
      );
    }

    if (!filteredUsers.length) {
      return res.json({
        success: false,
        message: "Không còn user nào sau khi lọc.",
      });
    }

    // ------------------------------
    // 4. SMTP
    // ------------------------------
    const transporter = createTransporter();
    await transporter.verify();

    const sendFn = async (user) => {
      return transporter.sendMail({
        from: `"NewZLearn Thông báo" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: title,
        html: `
                    <h2>${title}</h2>
                    <p>${description}</p>
                `,
      });
    };

    const { sent, failed } = await sendInBatches(
      filteredUsers,
      sendFn,
      Number(process.env.MAIL_BATCH_SIZE) || 10
    );

    return res.json({
      success: true,
      totalRecipients: filteredUsers.length,
      sentCount: sent.length,
      failedCount: failed.length,
      sent,
      failed,
    });
  } catch (error) {
    console.error("Announcement sendMail error:", error);
    return res.status(500).json({
      success: false,
      message: "Server lỗi khi gửi thông báo email",
      error: error?.message,
    });
  }
};
