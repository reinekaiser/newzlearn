// testLectureChatAgent.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import { lectureChatAgent } from "./agent.js";

dotenv.config();

async function testAgent() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: "elearning",
        });
        console.log("✅ Connected to MongoDB\n");

        const lectureId = "6937c77a9cf791c389292302"; // Thay bằng ID thực

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("TEST 1: Hỏi về nội dung cụ thể");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        const result1 = await lectureChatAgent(
            lectureId,
            "Những nội dung chính của bài giảng."
        );

        console.log("🤖 Answer:");
        console.log(result1.answer);
        console.log(`\n📊 Thread ID: ${result1.threadId}`);
        console.log(`📊 Messages: ${result1.messageCount}\n`);

        // Test 2: Follow-up question (same thread)
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("TEST 2: Follow-up question (cùng thread)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // const result2 = await lectureChatAgent(
        //     lectureId,
        //     "Giải thích rõ hơn về điểm đầu tiên được",
        //     result1.threadId // Dùng cùng threadId
        // );

        // console.log(" Answer:");
        // console.log(result2.answer);
        // console.log(`\n📊 Thread ID: ${result2.threadId}`);
        // console.log(`📊 Messages: ${result2.messageCount}\n`);

        // // Test 3: Hỏi về metadata
        // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        // console.log("TEST 3: Cho ví dụ");
        // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // const result3 = await lectureChatAgent(lectureId, "Cho ví dụ liên quan", result1.threadId);

        // console.log("🤖 Answer:");
        // console.log(result3.answer);
        // console.log(`\n📊 Messages: ${result3.messageCount}\n`);

        // // Test 4: Câu hỏi không liên quan
        // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        // console.log("TEST 4: Câu hỏi ngoài scope");
        // console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // const result4 = await lectureChatAgent(lectureId, "Thời tiết hôm nay thế nào?");

        // console.log("Answer:");
        // console.log(result4.answer);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await mongoose.connection.close();
        console.log("\n✅ MongoDB connection closed");
    }
}

testAgent();
