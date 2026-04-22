import crypto from "crypto";
import axios from "axios";
import Course from "../models/course.js";
import Order from "../models/order.js";
import { updateCourseProgress } from "./progressController.js";
import UserBehavior from "../models/userBehavior.js";
import dotenv from "dotenv";

export const createMoMoPayment = async (req, res) => {
  try {
    const { amount, courseAlias } = req.body;
    const userId = req.user._id;

    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const partnerCode = "MOMO";

    const requestId = `${partnerCode}_${Date.now()}`;
    const orderId = `${Date.now()}_${userId}_${courseAlias}`;
    const orderInfo = `Thanh toan khoa hoc ${courseAlias}`;
    const redirectUrl = `${process.env.BACKEND_URL}/api/checkout/momo/return`;
    const ipnUrl = `${process.env.BACKEND_URL}/api/checkout/momo/ipn`;
    const requestType = "payWithMethod";
    const extraData = "";

    // Chuỗi ký
    const rawSignature =
      `accessKey=${accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}` +
      `&requestId=${requestId}` +
      `&requestType=${requestType}`;

    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount: amount.toString(),
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
      paymentMethod: "ALL",
    };

    const momoRes = await axios.post(
      "https://test-payment.momo.vn/v2/gateway/api/create",
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );

    return res.json({
      payUrl: momoRes.data.payUrl,
    });
  } catch (err) {
    console.error("MOMO CREATE ERROR:", err);
    return res.status(500).json({ message: "Không tạo được link MoMo" });
  }
};

export const momoReturn = async (req, res) => {
  try {
    const { resultCode, orderId, message } = req.query;

    if (!orderId) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/?error=missing_order_id`
      );
    }

    // Parse orderId: {timestamp}_{userId}_{courseAlias}
    const parts = orderId.split("_");
    const userId = parts[1];
    const courseAlias = parts.slice(2).join("_");

    // ❌ Thanh toán thất bại / hủy
    // ❌ Chỉ coi là thất bại khi KHÔNG phải 0 hoặc 1006 hoặc 7002
    const SUCCESS_CODES = ["0", "1006", "7002"];

    if (!SUCCESS_CODES.includes(resultCode)) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/course/${courseAlias}/momo-success` +
          `?resultCode=${resultCode}&message=${encodeURIComponent(
            message || "Thanh toán MoMo thất bại hoặc bị hủy"
          )}`
      );
    }

    // ✅ Thành công
    const course = await Course.findOne({ alias: courseAlias });
    if (!course) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/course/${courseAlias}/momo-success` +
          `?resultCode=1&message=${encodeURIComponent(
            "Không tìm thấy khóa học"
          )}`
      );
    }

    const existingOrder = await Order.findOne({
      userId,
      courseId: course._id,
      isPaid: true,
    });

    if (!existingOrder) {
      await Order.create({
        userId,
        courseId: course._id,
        isPaid: true,
        totalPrice: course.price,
        paymentMethod: "MoMo",
        transactionId: orderId,
      });

      await updateCourseProgress(userId, course._id);
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
    }

    return res.redirect(
      `${process.env.FRONTEND_URL}/course/${courseAlias}/momo-success?resultCode=0`
    );
  } catch (err) {
    console.error("MOMO RETURN ERROR:", err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/momo-success?resultCode=1&message=server_error`
    );
  }
};

export const momoIPN = async (req, res) => {
  try {
    const { resultCode, orderId } = req.body;

    if (resultCode !== 0) {
      return res.status(200).json({ message: "Payment failed" });
    }

    // Có thể xử lý giống momoReturn
    console.log("MOMO IPN SUCCESS:", orderId);

    return res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("MOMO IPN ERROR:", err);
    return res.status(500).json({ message: "IPN error" });
  }
};
