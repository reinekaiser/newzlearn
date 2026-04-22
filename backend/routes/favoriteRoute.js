import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
    addToFavorites,
    removeFromFavorites,
    getMyFavorites,
    checkFavorite,
} from "../controllers/favoriteController.js";

const router = express.Router();

// Tất cả routes đều cần authentication
router.use(protectRoute);

router.post("/", addToFavorites);
router.get("/", getMyFavorites);
router.get("/check/:courseId", checkFavorite);
router.delete("/:courseId", removeFromFavorites);

export default router;

