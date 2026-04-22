import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.MONGO_URI;
//Newzlearn.123
export const connectDB = async () => {
    try {
        await mongoose.connect(url, {
            dbName: "elearning"
        });
        console.log("✅ MongoDB kết nối thành công");
    } catch (error) {
        console.error("❌ Lỗi kết nối MongoDB:", error);
    }
};
