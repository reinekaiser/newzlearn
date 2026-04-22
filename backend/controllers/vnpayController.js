import { VNPay } from "vnpay";
import moment from "moment";
import Course from "../models/course.js";
import Order from "../models/order.js";
import { updateCourseProgress } from "./progressController.js";
import UserBehavior from "../models/userBehavior.js";

/**
 * Khởi tạo VNPay
 */
const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMN_CODE,
  secureSecret: process.env.VNP_HASH_SECRET,
  vnpayHost: process.env.VNP_URL,
  testMode: true,
  hashAlgorithm: "SHA512",
});

/**
 * Tạo link thanh toán
 * TxnRef format: {timestamp}_{userId}_{courseAlias}
 */
export const createVNPayPayment = async (req, res) => {
  try {
    const { amount, courseAlias } = req.body;
    const userId = req.user._id;

    // TxnRef chứa userId và courseAlias để sau này parse ra
    const txnRef = `${Date.now()}_${userId}_${courseAlias}`;

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: amount * 100,
      vnp_IpAddr: req.ip || "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan khoa hoc ${courseAlias}`,
      vnp_OrderType: "education",
      vnp_ReturnUrl: `${process.env.BACKEND_URL}/api/checkout/vnpay/return`,
      vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
    });

    return res.json({ paymentUrl });
  } catch (err) {
    console.error("VNPAY ERROR:", err);
    return res.status(500).json({
      message: "Không tạo được link thanh toán",
    });
  }
};

/**
 * VNPAY redirect về - xử lý kết quả thanh toán
 * TxnRef format: {timestamp}_{userId}_{courseAlias}
 */
export const vnpayReturn = async (req, res) => {
  try {
    const result = vnpay.verifyReturnUrl(req.query);

    // Parse TxnRef để lấy userId và courseAlias
    const txnRef = req.query.vnp_TxnRef || "";
    const parts = txnRef.split("_");
    const userId = parts[1];
    const courseAlias = parts.slice(2).join("_"); // join lại phòng trường hợp alias có _

    // Sai chữ ký
    if (!result.isVerified) {
      console.error("VNPAY: Chữ ký không hợp lệ");
      return res.redirect(
        `${process.env.FRONTEND_URL}/course/${courseAlias}/vnpay-failed?error=invalid_signature`
      );
    }

    // Thanh toán thành công
    if (result.isSuccess) {
      // Tìm khóa học
      const course = await Course.findOne({ alias: courseAlias });
      if (!course) {
        console.error("VNPAY: Không tìm thấy khóa học:", courseAlias);
        return res.redirect(
          `${process.env.FRONTEND_URL}/course/${courseAlias}/vnpay-failed?error=course_not_found`
        );
      }

      // Kiểm tra xem đã có order chưa
      const existingOrder = await Order.findOne({
        userId: userId,
        courseId: course._id,
        isPaid: true,
      });

      if (!existingOrder) {
        // Tạo Order mới
        await Order.create({
          userId: userId,
          courseId: course._id,
          isPaid: true,
          totalPrice: course.price,
          paymentMethod: "VNPay",
          transactionId: txnRef,
        });

        // Enroll student vào khóa học
        await updateCourseProgress(userId, course._id);
        console.log(
          `VNPAY: Đã enroll user ${userId} vào khóa học ${courseAlias}`
        );
        await UserBehavior.updateOne(
          { user: userId },
          {
            $setOnInsert: {
              user: req.user._id,
            },
          },
          { upsert: true }
        );
        await UserBehavior.updateOne(
          { user: userId, "ordered.course": { $ne: course._id } },
          {
            $push: {
              ordered: {
                course: course._id,
                orderedAt: new Date(),
                price: course.price,
              },
            },
          }
        );    
      } else {
        console.log(
          `VNPAY: User ${userId} đã mua khóa học ${courseAlias} trước đó`
        );
      }

      return res.redirect(
        `${process.env.FRONTEND_URL}/course/${courseAlias}/vnpay-success`
      );
    }

    // Thanh toán thất bại
    return res.redirect(
      `${process.env.FRONTEND_URL}/course/${courseAlias}/vnpay-failed`
    );
  } catch (err) {
    console.error("VNPAY Return Error:", err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/vnpay-failed?error=server_error`
    );
  }
};
