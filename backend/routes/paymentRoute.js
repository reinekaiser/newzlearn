import express from "express";
import { createOrder, completeOrder } from "../controllers/paypalController.js";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  createVNPayPayment,
  vnpayReturn,
} from "../controllers/vnpayController.js";
import {
  createMoMoPayment,
  momoReturn,
  momoIPN,
} from "../controllers/momoController.js";

const router = express.Router();

router.post("/paypal/create-order", protectRoute, createOrder);
router.post("/paypal/complete-order", protectRoute, completeOrder);
router.post("/vnpay/create", protectRoute, createVNPayPayment);
router.get("/vnpay/return", vnpayReturn);

router.post("/momo/create", protectRoute, createMoMoPayment);
router.get("/momo/return", momoReturn);
router.post("/momo/ipn", momoIPN);

export default router;
