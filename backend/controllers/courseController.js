import mongoose from "mongoose";
import Course from "../models/course.js";
import User from "../models/user.js";
import Lecture from "../models/lecture.js";
import cloudinary from "../config/cloudinary.js";
import Section from "../models/section.js";
import Quiz from "../models/quiz.js";
import { ObjectId } from "mongodb";

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import VideoConversion from "../models/videoConvertion.js";
import TranscriptionBatch from "../models/transcriptionBatch.js";
import { deleteS3File, s3Client } from "./uploadController.js";
import slugify from "slugify";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { generateVTT, parseVTT, streamToString } from "../utils/chatbot/contentProcessor.js";
import UserBehavior from "../models/userBehavior.js";

const lambda = new LambdaClient({
    region: process.env.AWS_REGION || "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const getCourseByAlias = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const userId = req.user ? req.user._id : null;
        const course = await Course.findOne({ alias: courseAlias })
            .populate("sections.sectionId")
            .lean();

        if (!course) return res.status(404).json({ message: "Course not found" });
        if (course.status !== "published") {
            return res.status(403).json({ message: "Course is not published" });
        }

        const lectureIds = [];
        const quizIds = [];
        course.sections.forEach(({ sectionId }) => {
            sectionId?.curriculumItems?.forEach(({ itemType, itemId }) => {
                if (itemType === "Lecture") lectureIds.push(itemId);
                else if (itemType === "Quiz") quizIds.push(itemId);
            });
        });
        const [lectures, quizzes] = await Promise.all([
            Lecture.find({ _id: { $in: lectureIds } }).lean(),
            Quiz.find({ _id: { $in: quizIds } }).lean(),
        ]);

        const lectureMap = Object.fromEntries(lectures.map((l) => [l._id.toString(), l]));
        const quizMap = Object.fromEntries(quizzes.map((q) => [q._id.toString(), q]));

        const sections = course.sections
            .filter((s) => s.sectionId)
            .map(({ sectionId, order }) => ({
                ...sectionId,
                order,
                curriculumItems:
                    sectionId.curriculumItems
                        ?.map(({ itemType, itemId }) => {
                            const itemData =
                                itemType === "Lecture"
                                    ? lectureMap[itemId.toString()]
                                    : quizMap[itemId.toString()];
                            if (!itemData) return null;
                            return {
                                itemType,
                                ...itemData,
                            };
                        })
                        .filter(Boolean) || [],
            }));

        if (userId) {
            // đảm bảo document tồn tại
            await UserBehavior.updateOne(
                { user: userId },
                { $setOnInsert: { user: userId } },
                { upsert: true },
            );
            // tăng count
            const incResult = await UserBehavior.updateOne(
                { user: userId, "viewed.course": course._id },
                {
                    $inc: { "viewed.$.count": 1 },
                    $set: { "viewed.$.lastView": new Date() },
                },
            );
            // push mới
            if (incResult.matchedCount === 0) {
                await UserBehavior.updateOne(
                    { user: userId },
                    {
                        $push: {
                            viewed: {
                                course: course._id,
                                count: 1,
                                lastView: new Date(),
                            },
                        },
                    },
                );
            }
        } else {
            console.log("User not logged in, skipping behavior tracking.");
        }
        res.status(200).json({ ...course, sections });
    } catch (error) {
        console.error("getCourseByAlias error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getCourseInfo = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const course = await Course.findOne({ alias: courseAlias });

        if (!course) return res.status(404).json({ message: "Course not found" });

        res.status(200).json(course);
    } catch (error) {
        console.error("getCourseByAlias error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getInstructorCourses = async (req, res) => {
    try {
        const courses = await Course.find({});
        res.status(200).json(courses);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const createCourse = async (req, res) => {
    try {
        // const instructorId = req.user._id;
        const { title, category } = req.body;

        const baseSlug = slugify(title, {
            lower: true,
            strict: true,
            locale: "vi",
        });

        const alias = `${baseSlug}-${Date.now()}`;

        const course = await Course.create({
            title,
            category,
            alias,
        });
        res.status(201).json(course);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const updateCourse = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const course = await Course.findOne({ alias: courseAlias });

        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }

        const courseId = course._id;
        const fields = [
            "learningOutcomes",
            "requirements",
            "intendedLearners",
            "title",
            "subtitle",
            "description",
            "language",
            "level",
            "category",
            "subcategory",
            "price",
            "isPublished",
            "thumbnail",
            "promoVideo",
            "sections",
        ];
        const updateData = {};
        fields.forEach((key) => {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        });

        if (updateData.price !== undefined) {
            updateData.isFree = updateData.price > 0 ? false : true;
        }
        const updatedCourse = await Course.findByIdAndUpdate(courseId, updateData, {
            new: true,
        });
        res.status(200).json(updatedCourse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const course = await Course.findOne({ alias: courseAlias })
            .populate("sections.sectionId")
            .lean();
        if (!course) return res.status(404).json({ message: "Course not found" });
        for (const section of course.sections) {
            for (const item of section.curriculumItems) {
                if (item.itemType === "Lecture") {
                    await Lecture.findByIdAndDelete(item.itemId);
                } else if (item.itemType === "Quiz") {
                    await Quiz.findByIdAndDelete(item.itemId);
                }
            }
            await Section.findByIdAndDelete(section._id);
        }
        if (course.thumbnail?.public_id) {
            await cloudinary.uploader.destroy(course.thumbnail.public_id);
        }
        await Course.findByIdAndDelete(courseId);
        res.status(200).json({ message: "Course and associated content deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const checkCoursePublishRequirements = async (course) => {
    const errors = [];

    if (!course.title || course.title.trim() === "") {
        errors.push("Tiêu đề khóa học là bắt buộc");
    }

    if (!course.description || course.description.replace(/<(.|\n)*?>/g, "").trim() === "") {
        errors.push("Mô tả khóa học là bắt buộc");
    }

    if (!course.level) {
        errors.push("Cấp độ khóa học là bắt buộc");
    }

    if (!course.category || course.category.trim() === "") {
        errors.push("Danh mục khóa học là bắt buộc");
    }

    if (!course.learningOutcomes || course.learningOutcomes.length < 4) {
        errors.push("Cần ít nhất 4 mục tiêu học tập");
    } else {
        const validOutcomes = course.learningOutcomes.filter(
            (outcome) => outcome && outcome.trim() !== "",
        );
        if (validOutcomes.length < 4) {
            errors.push("Cần ít nhất 4 mục tiêu học tập hợp lệ");
        }
    }

    if (!course.requirements || course.requirements.length < 1) {
        errors.push("Cần ít nhất 1 yêu cầu cho khóa học");
    } else {
        const validRequirements = course.requirements.filter((req) => req && req.trim() !== "");
        if (validRequirements.length < 1) {
            errors.push("Cần ít nhất 1 yêu cầu hợp lệ cho khóa học");
        }
    }

    if (!course.intendedLearners || course.intendedLearners.length < 1) {
        errors.push("Cần ít nhất 1 đối tượng học viên");
    } else {
        const validLearners = course.intendedLearners.filter(
            (learner) => learner && learner.trim() !== "",
        );
        if (validLearners.length < 1) {
            errors.push("Cần ít nhất 1 đối tượng học viên hợp lệ");
        }
    }

    if (!course.sections || course.sections.length === 0) {
        errors.push("Khóa học cần có ít nhất 1 chương");
    } else {
        for (const section of course.sections) {
            const sectionDetail = await Section.findById(section.sectionId);
            if (
                !sectionDetail ||
                !sectionDetail.curriculumItems ||
                sectionDetail.curriculumItems.length === 0
            ) {
                errors.push(
                    `Chương ${section.order}: "${
                        sectionDetail?.title || section.sectionId
                    }" cần có ít nhất 1 bài học hoặc quiz`,
                );
                break;
            }
        }
    }

    // const hasVideo = await checkHasAtLeastOneVideo(course);
    // if (!hasVideo) {
    //     errors.push("Khóa học cần có ít nhất 1 video bài giảng");
    // }

    if (course.isFree === false && (!course.price || course.price <= 0)) {
        errors.push("Khóa học trả phí cần có giá hợp lệ");
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
    };
};

const checkHasAtLeastOneVideo = async (courseId) => {
    const result = await Section.aggregate([
        { $match: { course: new ObjectId(courseId) } },
        { $unwind: "$curriculumItems" },
        { $match: { "curriculumItems.itemType": "Lecture" } },
        {
            $lookup: {
                from: "lectures",
                localField: "curriculumItems.itemId",
                foreignField: "_id",
                as: "lecture",
            },
        },
        { $unwind: "$lecture" },
        {
            $match: {
                "lecture.type": "video",
                "lecture.content.publicURL": { $exists: true, $ne: null },
            },
        },
        { $limit: 1 },
    ]);

    return result.length > 0;
};

const getAllVideoS3KeysByCourse = async (courseId) => {
    try {
        const result = await Section.aggregate([
            { $match: { course: new ObjectId(courseId) } },
            { $unwind: "$curriculumItems" },
            { $match: { "curriculumItems.itemType": "Lecture" } },
            {
                $lookup: {
                    from: "lectures",
                    localField: "curriculumItems.itemId",
                    foreignField: "_id",
                    as: "lecture",
                },
            },
            { $unwind: "$lecture" },
            {
                $match: {
                    "lecture.type": "video",
                    "lecture.content.s3Key": { $exists: true, $nin: [null, ""] },
                    "lecture.content.hlsURL": { $exists: false },
                },
            },
            {
                $project: {
                    _id: 0,
                    s3Key: "$lecture.content.s3Key",
                },
            },
        ]);

        return result.map((r) => r.s3Key);
    } catch (error) {
        console.error("Lỗi khi lấy S3 keys:", error);
        return null;
    }
};

const processCourse = async (req, res) => {
    try {
        const courseAlias = req.params.courseAlias;
        const course = await Course.findOne({ alias: courseAlias });

        if (!course) {
            return res.json({
                success: false,
                message: "Không tìm thấy khóa học",
            });
        }

        const courseId = course._id;
        const checkResult = await checkCoursePublishRequirements(course);

        if (!checkResult.isValid) {
            return res.json({
                success: false,
                message: "Không thể phát hành khóa học",
                errors: checkResult.errors,
            });
        }

        const s3Keys = await getAllVideoS3KeysByCourse(courseId);

        if (s3Keys.length === 0) {
            course.status = "published";
            await course.save();

            return res.json({
                success: true,
                message: "Khóa học đã được phát hành thành công",
            });
        }

        await VideoConversion.deleteMany({ courseId: courseId });

        // 2. Tạo batches
        const BATCH_SIZE = 10;
        const batchDocs = [];

        for (let i = 0; i < s3Keys.length; i += BATCH_SIZE) {
            const batchVideoS3Keys = s3Keys.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log("s3Keys", batchVideoS3Keys);
            const batch = new VideoConversion({
                courseId: courseId,
                batchNumber: batchNumber,
                totalVideos: batchVideoS3Keys.length,
                completedVideos: 0,
                failedVideos: 0,
                status: "pending",
                videoS3Keys: batchVideoS3Keys,
            });

            await batch.save();

            batchDocs.push(batch);

            console.log(`📦 Created batch ${batchNumber} with ${batchVideoS3Keys.length} videos`);
        }

        console.log(`✅ Created ${batchDocs.length} batches`);

        // 3. Launch batch đầu tiên
        await launchNextVideoBatch(courseId);

        course.status = "processing";
        await course.save();

        return res.json({
            success: true,
            state: "processing",
            message: "Các video trong khóa học đang được xử lý",
        });
    } catch (error) {
        console.error("Lỗi khi phát hành khóa học:", error);
        return res.status(500).json({
            success: false,
            message: "Đã có lỗi xảy ra khi phát hành khóa học",
        });
    }
};

const launchNextVideoBatch = async (courseId) => {
    try {
        const nextBatch = await VideoConversion.findOne({
            courseId: courseId,
            status: "pending",
        }).sort({ batchNumber: 1 });

        if (!nextBatch) {
            console.log(`✅ No more batches for course ${courseId}`);
            return null;
        }

        console.log(`🚀 Launching batch ${nextBatch.batchNumber}`);

        const s3Keys = nextBatch.videoS3Keys;

        const payload = {
            s3Keys: s3Keys,
            bucket: process.env.AWS_S3_BUCKET_NAME,
            outputPrefix: "hls-output",
            jobId: nextBatch._id.toString(),
        };

        const command = new InvokeCommand({
            FunctionName: "video-hls-orchestrator",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify(payload),
        });

        const lambdaResponse = await lambda.send(command);

        const responsePayload = JSON.parse(Buffer.from(lambdaResponse.Payload).toString());

        if (responsePayload.statusCode !== 200) {
            throw new Error(`Lambda failed: ${responsePayload.body}`);
        }

        nextBatch.status = "processing";
        await nextBatch.save();

        console.log(`✅ Batch ${nextBatch.batchNumber} launched (${s3Keys.length} videos)`);

        return nextBatch;
    } catch (error) {
        console.error(`❌ Error launching batch:`, error);
        throw error;
    }
};

const handleVideoWebhook = async (req, res) => {
    const { jobId, s3Key, status, hlsURL, error } = req.body;

    console.log("webhookData: ", req.body);
    console.log(`Webhook: Job ${jobId}): ${status}`);

    try {
        const batch = await VideoConversion.findById(jobId);

        if (!batch) {
            console.error(`Job not found: ${jobId}`);
            return res.status(404).json({
                error: "Job not found",
            });
        }

        const course = await Course.findById(batch.courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Không tìm thấy course" });
        }

        const lecture = await Lecture.findOne({ "content.s3Key": s3Key });

        if (!lecture) {
            console.error(`Lecture not found: ${s3Key}`);
            return res.status(404).json({
                error: "Video not found",
            });
        }

        if (status === "success") {
            await Lecture.findByIdAndUpdate(lecture._id, { "content.hlsURL": hlsURL });
            console.log(`Video ${lecture._id} converted successfully`);
            batch.completedVideos += 1;
        } else if (status === "error") {
            batch.failedVideos += 1;
            console.log(error);
        }

        await batch.save();

        const totalProcessed = batch.completedVideos + batch.failedVideos;
        const progress = Math.round((totalProcessed / batch.totalVideos) * 100);

        console.log(
            `📊 Batch ${batch.batchNumber}: ${totalProcessed}/${batch.totalVideos} (${progress}%)`,
        );

        if (totalProcessed === batch.totalVideos) {
            console.log(`🎉 Batch ${batch.batchNumber} completed!`);

            batch.status = "completed";
            await batch.save();

            console.log(`Launching next batch...`);
            const nextBatch = await launchNextVideoBatch(batch.courseId);

            if (!nextBatch) {
                console.log(`🎊 Course ${batch.courseId} completed!`);
                course.status = "published";
                await course.save();
                return res.json({ success: true });
            }
        }
        return res.json({ success: true });
    } catch (error) {
        console.error(`❌ Error handling webhook:`, error);
        return res.status(500).json({ error: error.message });
    }
};

const getCourses = async (req, res) => {
    try {
        const { sort, search, page = 1, limit = 9 } = req.query;

        let sortOption = {};
        switch (sort) {
            case "Mới nhất":
                sortOption = { createdAt: -1 };
                break;
            case "Cũ nhất":
                sortOption = { createdAt: 1 };
                break;
            case "A-Z":
                sortOption = { title: 1 };
                break;
            case "Z-A":
                sortOption = { title: -1 };
                break;
            default:
                sortOption = {};
        }

        const filter = {};
        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        /* -------- QUERY -------- */
        const [courses, totalCourses] = await Promise.all([
            Course.find(filter).sort(sortOption).skip(skip).limit(limitNumber),
            Course.countDocuments(filter),
        ]);

        res.status(200).json({
            courses,
            pagination: {
                total: totalCourses,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalCourses / limitNumber),
            },
        });

    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getAllCourses = async (req, res) => {
    try {
        const {
            courseDuration,
            level,
            category,
            subcategory,
            language,
            isFree,
            minPrice,
            maxPrice,
            avarageRating,
            sort,
            page,
            limit,
        } = req.query;

        const pageNumber = Number(page) || 1;
        const pageSize = Number(limit) || 6;
        const skip = (pageNumber - 1) * pageSize;

        let filter = { isPublished: true };
        if (courseDuration) {
            const durations = courseDuration.split(",");
            const durationFilters = durations
                .map((d) => {
                    switch (d.trim()) {
                        case "0-3":
                            return { courseDuration: { $gte: 0, $lte: 3 } };
                        case "3-6":
                            return { courseDuration: { $gte: 3, $lte: 6 } };
                        case "6-17":
                            return { courseDuration: { $gte: 6, $lte: 17 } };
                        case "17-more":
                            return { courseDuration: { $gte: 17 } };
                        default:
                            return null;
                    }
                })
                .filter(Boolean);
            if (durationFilters.length > 0) {
                filter.$or = durationFilters;
            }
        }
        if (level) {
            const levelArr = level.split(",");
            if (!levelArr.includes("All Level")) {
                filter.level = { $in: levelArr };
            }
        }
        if (category) {
            filter.category = { $in: category.split(",") };
        }
        if (subcategory) {
            filter.subcategory = { $in: subcategory.split(",") };
        }
        if (language) {
            filter.language = { $in: language.split(",") };
        }
        if (isFree) {
            filter.isFree = isFree === "true";
        }
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        if (avarageRating) {
            filter.averageRating = { $gte: parseFloat(avarageRating) };
        }

        let sortOption = {};
        if (sort) {
            switch (sort) {
                case "newest":
                    sortOption = { createdAt: -1 };
                    break;
                case "oldest":
                    sortOption = { createdAt: 1 };
                    break;
                case "priceLowToHigh":
                    sortOption = { price: 1 };
                    break;
                case "priceHighToLow":
                    sortOption = { price: -1 };
                    break;
                case "ratingHighToLow":
                    sortOption = { averageRating: -1 };
                    break;
                case "A-Z":
                    sortOption = { title: 1 };
                    break;
                case "Z-A":
                    sortOption = { title: -1 };
                    break;
                default:
                    sortOption = {};
            }
        }
        const courses = await Course.find(filter).sort(sortOption).skip(skip).limit(pageSize);

        const totalCourses = await Course.countDocuments(filter);

        res.status(200).json({
            totalCourses,
            totalPages: Math.ceil(totalCourses / pageSize),
            currentPage: pageNumber,
            pageSize,
            data: courses,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getSearchCourseSuggestion = async (req, res) => {
    try {
        const { q } = req.query;
        const normalizedQuery = (q || "").trim().toLowerCase();
        if (!q) return res.json({ keywords: [], courses: [] });

        const coursePipeline = [
            {
                $search: {
                    index: "course_search",
                    text: {
                        query: normalizedQuery,
                        path: ["title", "category"],
                        fuzzy: {},
                    },
                },
            },
            {
                $match: { status: "published" },
            },
            {
                $limit: 4,
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    alias: 1,
                    thumbnail: 1,
                    language: 1,
                    level: 1,
                    category: 1,
                    subcategory: 1,
                },
            },
        ];

        const keywordPipeline = [
            {
                $search: {
                    index: "course_search",
                    text: {
                        query: normalizedQuery,
                        path: [
                            "title",
                            "subtitle",
                            "description",
                            "learningOutcomes",
                            "intendedLearners",
                            "category",
                            "subcategory",
                            "requirements",
                        ],
                        fuzzy: {},
                    },
                },
            },
            {
                $match: { status: "published" },
            },
            {
                $limit: 10,
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    subtitle: 1,
                    category: 1,
                    subcategory: 1,
                },
            },
        ];

        const [courseResults, keywordResults] = await Promise.all([
            Course.aggregate(coursePipeline),
            Course.aggregate(keywordPipeline),
        ]);

        const keywordSet = new Set();
        keywordSet.add(normalizedQuery);
        keywordResults.forEach((item) => {
            if (item.category && item.category.toLowerCase().includes(normalizedQuery)) {
                keywordSet.add(item.category.toLowerCase());
            }

            if (item.subcategory && item.subcategory.toLowerCase().includes(normalizedQuery)) {
                keywordSet.add(item.subcategory.toLowerCase());
            }

            if (item.title) {
                const normalizedTitle = item.title.toLowerCase();
                if (normalizedTitle.startsWith(normalizedQuery)) {
                    keywordSet.add(normalizedTitle);
                }
            }
        });
        const keywords = Array.from(keywordSet).slice(0, 6);

        res.status(200).json({
            keywords: keywords,
            courses: courseResults,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server Error" });
    }
};

const getSearchCourseResults = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        const { q, courseDuration, level, category, language, selectedPrices, sort, page, limit } =
            req.query;
        console.log(q);
        const normalizedQuery = (q || "").trim().toLowerCase();
        console.log(normalizedQuery);
        let matchStage = [];
        if (q) {
            matchStage = [
                {
                    $search: {
                        index: "course_search",
                        text: {
                            query: normalizedQuery,
                            path: ["title", "category"],
                            fuzzy: {},
                        },
                    },
                },
            ];
            // thêm từ khóa (q) vào searched của userBehavior
            if (userId && normalizedQuery) {
                // Chắc chắn tồn tại
                await UserBehavior.updateOne(
                    { user: userId },
                    { $setOnInsert: { user: userId } },
                    { upsert: true },
                );
                // Tăng count
                const updated = await UserBehavior.updateOne(
                    {
                        user: userId,
                        "searched.normalized": normalizedQuery,
                    },
                    {
                        $inc: { "searched.$.count": 1 },
                        $set: { "searched.$.lastSearch": new Date() },
                    },
                );
                // Push mới
                if (updated.matchedCount === 0) {
                    await UserBehavior.updateOne(
                        { user: userId },
                        {
                            $push: {
                                searched: {
                                    keyword: q,
                                    normalized: normalizedQuery,
                                    count: 1,
                                    lastSearch: new Date(),
                                },
                            },
                        },
                    );
                }
            }
        }

        let filterStage = {
            $match: { status: "published" },
        };

        if (selectedPrices) {
            const prices = selectedPrices.split(",");
            const priceFilters = [];
            prices.forEach((p) => {
                switch (p) {
                    case "free":
                        priceFilters.push({ isFree: true });
                        break;
                    case "paid":
                        priceFilters.push({ isFree: false });
                        break;
                    case "under-300k":
                        priceFilters.push({ price: { $lte: 300000 } });
                        break;
                    case "300k-500k":
                        priceFilters.push({ price: { $gte: 300000, $lte: 500000 } });
                        break;
                    default:
                        break;
                }
            });

            if (priceFilters.length > 0) {
                filterStage.$match.$or = priceFilters;
            }
        }
        console.log("decoded:", decodeURIComponent(category).trim());
        if (category)
            filterStage.$match.category = { $in: decodeURIComponent(category).trim().split(",") };
        if (language) filterStage.$match.language = { $in: language.split(",") };
        if (level) filterStage.$match.level = { $in: level.split(",") };

        if (courseDuration) {
            const ONE_HOUR_IN_SECONDS = 3600;

            switch (courseDuration) {
                case "0-3": {
                    filterStage.$match.courseDuration = {
                        $gte: 0,
                        $lte: 3 * ONE_HOUR_IN_SECONDS,
                    };
                    break;
                }
                case "3-6": {
                    filterStage.$match.courseDuration = {
                        $gt: 3 * ONE_HOUR_IN_SECONDS,
                        $lte: 6 * ONE_HOUR_IN_SECONDS,
                    };
                    break;
                }
                case "6-17": {
                    filterStage.$match.courseDuration = {
                        $gt: 6 * ONE_HOUR_IN_SECONDS,
                        $lte: 17 * ONE_HOUR_IN_SECONDS,
                    };
                    break;
                }
                case "17-more": {
                    filterStage.$match.courseDuration = {
                        $gt: 17 * ONE_HOUR_IN_SECONDS,
                    };
                    break;
                }
                default:
                    break;
            }
        }

        const sortOptions = {
            default: [
                { $addFields: { score: { $meta: "searchScore" } } },
                { $sort: { score: -1 } },
            ],
            new: [{ $sort: { createdAt: -1 } }],
            rating: [{ $sort: { averageRating: -1 } }],
            priceUp: [{ $sort: { price: 1 } }],
            priceDown: [{ $sort: { price: -1 } }],
        };
        const sortStage = sortOptions[sort] || sortOptions.relevance;

        const pageNumber = Number(page) || 1;
        const pageSize = Number(limit) || 6;
        1;
        const skip = (pageNumber - 1) * pageSize;
        const pipeline = [
            ...matchStage,
            filterStage,
            ...sortStage,
            {
                $facet: {
                    results: [
                        { $skip: skip },
                        { $limit: pageSize },
                        {
                            $project: {
                                _id: 1,
                                title: 1,
                                alias: 1,
                                subtitle: 1,
                                thumbnail: 1,
                                description: 1,
                                category: 1,
                                subcategory: 1,
                                level: 1,
                                language: 1,
                                learningOutcomes: 1,
                                price: 1,
                                averageRating: 1,
                                courseDuration: 1,
                                updatedAt: 1,
                            },
                        },
                    ],
                    totalCount: [{ $count: "total" }],
                },
            },
        ];

        const aggResult = await Course.aggregate(pipeline);

        const results = aggResult[0].results;
        const totalCourse = aggResult[0].totalCount[0]?.total || 0;
        const totalPage = Math.ceil(totalCourse / pageSize);

        res.status(200).json({
            results,
            totalCourse,
            totalPage,
            currentPage: pageNumber,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getAllCoursesInfo = async (req, res) => {
    try {
        const courses = await Course.find({ status: "published" }, { _id: 1, title: 1 });
        return res.status(200).json(courses);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const searchCourses = async (req, res) => {
    try {
        const keyword = (req.query.keyword || "").trim();

        if (!keyword) {
            return res.json([]);
        }

        const courses = await Course.find({
            title: { $regex: keyword, $options: "i" },
        })
            .select("_id title")
            .lean();

        return res.json(courses);
    } catch (err) {
        console.error("Search Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

const generateCaption = async (req, res) => {
    const { courseId } = req.params;
    try {
        // 1. Lấy videos chưa có caption
        const videoLectures = await Lecture.find({
            courseId: courseId,
            type: "video",
            $or: [
                { "content.captions": { $exists: false } },
                { "content.captions": null },
                { "content.captions": { $eq: [] } },
                {
                    $and: [
                        { "content.captions": { $size: 1 } },
                        { "content.captions.language": "vi" },
                    ],
                },
            ],
        });

        const course = await Course.findById(courseId, "promoVideo language");
        const courseS3Keys = [];

        if (
            course?.promoVideo?.s3Key &&
            (!course.promoVideo.captions || course.promoVideo.captions?.length === 0)
        ) {
            courseS3Keys.push(course.promoVideo.s3Key);
        }

        const videoLectureS3Keys = videoLectures
            .map((video) => video.content.s3Key)
            .filter(Boolean);

        const allVideoS3Keys = [...videoLectureS3Keys, ...courseS3Keys];

        console.log(`📹 Found ${allVideoS3Keys.length} videos without captions`);

        console.log("allVideoS3Keys", allVideoS3Keys);

        if (allVideoS3Keys.length === 0) {
            return res.json({
                success: true,
                message: "Không có video nào để xử lý",
            });
        }

        await TranscriptionBatch.deleteMany({ courseId: courseId });

        // 2. Tạo batches
        const BATCH_SIZE = 10;
        const batchDocs = [];

        for (let i = 0; i < allVideoS3Keys.length; i += BATCH_SIZE) {
            const batchVideoS3Keys = allVideoS3Keys.slice(i, i + BATCH_SIZE);
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

            console.log("batchVideoS3Keys", batchVideoS3Keys);
            const batch = new TranscriptionBatch({
                courseId: courseId,
                batchNumber: batchNumber,
                totalVideos: batchVideoS3Keys.length,
                completedVideos: 0,
                failedVideos: 0,
                status: "pending",
                videoS3Keys: batchVideoS3Keys,
            });

            await batch.save();

            batchDocs.push(batch);

            console.log(`📦 Created batch ${batchNumber} with ${batchVideoS3Keys.length} videos`);
        }

        console.log(`✅ Created ${batchDocs.length} batches`);

        // 3. Launch batch đầu tiên
        await launchNextTranscriptionBatch(courseId, course.language);

        return res.json({
            success: true,
            totalVideos: allVideoS3Keys.length,
            totalBatches: batchDocs.length,
            message: "Transcription started",
        });
    } catch (error) {
        console.error(`❌ Error starting transcription:`, error);
        res.status(500).json({ error: error.message });
    }
};

const launchNextTranscriptionBatch = async (courseId, language) => {
    try {
        const languageMap = {
            vi: "Tiếng Việt",
            en: "Tiếng Anh",
        };
        const nextBatch = await TranscriptionBatch.findOne({
            courseId: courseId,
            status: "pending",
        }).sort({ batchNumber: 1 });

        if (!nextBatch) {
            console.log(`✅ No more batches for course ${courseId}`);
            return null;
        }

        console.log(`🚀 Launching batch ${nextBatch.batchNumber}`);

        // Get S3 keys
        const s3Keys = nextBatch.videoS3Keys;

        // Invoke Lambda với AWS SDK v3
        const command = new InvokeCommand({
            FunctionName: "video-caption-orchestrator",
            InvocationType: "RequestResponse",
            Payload: JSON.stringify({
                s3Bucket: process.env.AWS_S3_BUCKET_NAME,
                s3Keys: s3Keys,
                language: Object.keys(languageMap).find((key) => languageMap[key] === language),
                batchId: nextBatch._id.toString(),
            }),
        });

        const lambdaResponse = await lambda.send(command);

        const responsePayload = JSON.parse(Buffer.from(lambdaResponse.Payload).toString());

        if (responsePayload.statusCode !== 200) {
            throw new Error(`Lambda failed: ${responsePayload.body}`);
        }

        // Update batch
        nextBatch.status = "processing";
        await nextBatch.save();

        console.log(`✅ Batch ${nextBatch.batchNumber} launched (${s3Keys.length} videos)`);

        return nextBatch;
    } catch (error) {
        console.error(`❌ Error launching batch:`, error);
        throw error;
    }
};

const handleCaptionWebhook = async (req, res) => {
    const {
        batch_id: batchId,
        s3_key: s3Key,
        status,
        generated_captions: generatedCaptions,
        error,
        language,
    } = req.body;

    console.log("webhookData: ", req.body);
    console.log(`Webhook: batch ${batchId}): ${status}`);

    const captions = Object.entries(generatedCaptions).map(([language, data]) => ({
        s3Key: data.s3_key,
        publicURL: data.public_url,
        language: language,
        isTranslation: data.is_translation,
        status: "auto-generated",
    }));

    try {
        const batch = await TranscriptionBatch.findById(batchId);

        if (!batch) {
            console.error(`Batch not found: ${batchId}`);
            return;
        }

        const lecture = await Lecture.findOne({ "content.s3Key": s3Key });

        const course = await Course.findOne({ "promoVideo.s3Key": s3Key });

        if (!lecture && !course) {
            console.error(`Video not found: ${s3Key}`);
            return;
        }

        if (lecture) {
            const existingLanguages = lecture.content.captions.map((caption) => caption.language);

            const captionsToAdd = captions.filter((newCaption) => {
                const isLanguageExists = existingLanguages.includes(newCaption.language);

                return !isLanguageExists;
            });

            if (captionsToAdd.length > 0) {
                lecture.content.captions.push(...captionsToAdd);
                await lecture.save();
            }

            console.log(`Updated lecture ${lecture._id}: ${status}`);
        }

        if (course) {
            const existingLanguages = course.promoVideo.captions.map((caption) => caption.language);

            const captionsToAdd = captions.filter((newCaption) => {
                const isLanguageExists = existingLanguages.includes(newCaption.language);

                return !isLanguageExists;
            });

            if (captionsToAdd.length > 0) {
                course.promoVideo.captions.push(...captionsToAdd);
                await course.save();
            }

            console.log(`Updated course ${course._id}: ${status}`);
        }

        if (status === "success") {
            batch.completedVideos += 1;
        } else if (status === "error") {
            batch.failedVideos += 1;
            console.log(error);
        }

        await batch.save();

        const totalProcessed = batch.completedVideos + batch.failedVideos;
        const progress = Math.round((totalProcessed / batch.totalVideos) * 100);

        console.log(
            `📊 Batch ${batch.batchNumber}: ${totalProcessed}/${batch.totalVideos} (${progress}%)`,
        );

        if (totalProcessed === batch.totalVideos) {
            console.log(`🎉 Batch ${batch.batchNumber} completed!`);

            batch.status = "completed";
            await batch.save();

            // 4. Launch next batch
            console.log(`Launching next batch...`);
            const nextBatch = await launchNextTranscriptionBatch(batch.courseId, language);

            if (!nextBatch) {
                console.log(` Course ${batch.courseId} completed!`);
                return res.json({ success: true });
            }
        }
        return res.json({ success: true });
    } catch (error) {
        console.error(`❌ Error handling webhook:`, error);
        return res.status(500).json({ error: error.message });
    }
};

const getCaptionVideoStatus = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const course = await Course.findOne({ alias: courseAlias });
        if (!course) return res.status(404).json({ message: "Course not found" });

        const courseId = course._id;

        const promoVideoSection = {
            sectionTitle: "Video giới thiệu",
            items: [
                {
                    itemType: "promoVideo",
                    title: "Video giới thiệu",
                    content: course.promoVideo,
                },
            ],
        };

        const sections = await Section.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $lookup: {
                    from: "courses",
                    let: { sectionId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                _id: new mongoose.Types.ObjectId(courseId),
                            },
                        },
                        {
                            $unwind: "$sections",
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$sections.sectionId", "$$sectionId"],
                                },
                            },
                        },
                        {
                            $project: {
                                order: "$sections.order",
                            },
                        },
                    ],
                    as: "orderInfo",
                },
            },
            {
                $unwind: {
                    path: "$orderInfo",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: "$curriculumItems",
            },
            {
                $match: {
                    "curriculumItems.itemType": "Lecture",
                },
            },
            {
                $lookup: {
                    from: "lectures",
                    localField: "curriculumItems.itemId",
                    foreignField: "_id",
                    as: "lectureInfo",
                },
            },
            {
                $unwind: {
                    path: "$lectureInfo",
                    preserveNullAndEmptyArrays: false, // Chỉ lấy những item có lecture tương ứng
                },
            },
            {
                $match: {
                    "lectureInfo.type": "video",
                    "lectureInfo.content": { $exists: true, $ne: null },
                },
            },
            {
                $group: {
                    _id: "$_id",
                    sectionTitle: { $first: "$title" },
                    order: { $first: "$orderInfo.order" },
                    items: {
                        $push: {
                            _id: "$lectureInfo._id",
                            title: "$lectureInfo.title",
                            content: "$lectureInfo.content",
                            itemType: "lectureVideo",
                        },
                    },
                },
            },
            {
                $sort: {
                    order: 1, // Sắp xếp sections theo order tăng dần
                },
            },
            {
                $project: {
                    _id: 1,
                    sectionTitle: 1,
                    items: 1,
                },
            },
        ]);

        res.json({
            defaultLanguage: course.language,
            captions: [promoVideoSection, ...sections],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const addCaptionVideo = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const { videoType, itemId, caption } = req.body;

        const course = await Course.findOne({ alias: courseAlias });
        if (!course) return res.status(404).json({ message: "Course not found" });

        if (videoType === "promoVideo") {
            course.promoVideo.captions.push(caption);

            await course.save();
        } else {
            const lecture = await Lecture.findById(itemId);
            if (!lecture) return res.status(404).json({ message: "Lecture not found" });

            if (!lecture.content.captions) {
                lecture.content.captions = [];
            }

            const existingCaptionIndex = lecture.content.captions.findIndex(
                (c) => c.language === caption.language,
            );

            if (existingCaptionIndex !== -1) {
                await deleteS3File(lecture.content.captions[existingCaptionIndex].s3Key);
                lecture.content.captions[existingCaptionIndex] = caption;
            } else {
                lecture.content.captions.push(caption);
            }
            await lecture.save();
        }
        return res.json({
            success: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const deleteCaptionVideo = async (req, res) => {
    try {
        const { courseAlias } = req.params;
        const { videoType, itemId, caption } = req.body;
        console.log(req.body);
        const course = await Course.findOne({ alias: courseAlias });
        if (!course) return res.status(404).json({ message: "Course not found" });

        if (videoType === "promoVideo") {
            const deleteCaption = course.promoVideo.captions.id(caption._id);
            if (!deleteCaption) return res.status(404).json({ message: "Caption not found" });
            await deleteS3File(deleteCaption.s3Key);
            deleteCaption.deleteOne();
            await course.save();
        } else {
            const lecture = await Lecture.findById(itemId);
            if (!lecture) return res.status(404).json({ message: "Lecture not found" });
            const deleteCaption = lecture.content.captions.id(caption._id);
            if (!deleteCaption) return res.status(404).json({ message: "Caption not found" });
            await deleteS3File(deleteCaption.s3Key);
            deleteCaption.deleteOne();
            await lecture.save();
        }
        return res.json({
            success: true,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getCaptionContent = async (req, res) => {
    try {
        const { courseId, lectureId, language, itemType } = req.params;

        let caption = null;
        if (itemType === "lectureVideo") {
            const lecture = await Lecture.findById(lectureId).select("content.captions");
            if (!lecture) {
                return res.status(404).json({ message: "Lecture not found" });
            }
            caption = lecture.content.captions.find((cap) => cap.language === language);
        } else if (itemType === "promoVideo") {
            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: "Course not found" });
            }
            caption = course.promoVideo.captions.find((cap) => cap.language === language);
        }

        if (!caption || !caption.s3Key) {
            return res.status(404).json({ message: "Caption not found" });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: caption.s3Key,
        });

        const response = await s3Client.send(command);
        const vttContent = await streamToString(response.Body);
        const parsedCaptions = parseVTT(vttContent);

        res.json({
            parsed: parsedCaptions,
        });
    } catch (error) {
        console.error("Error getting caption content:", error);
        res.status(500).json({
            error: error.message,
        });
    }
};

const updateCaption = async (req, res) => {
    try {
        const { courseId, lectureId, language, itemType } = req.params;
        const { captions } = req.body;

        if (!Array.isArray(captions) || captions.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid captions format",
            });
        }

        for (const caption of captions) {
            if (
                typeof caption.start !== "number" ||
                typeof caption.end !== "number" ||
                !caption.text
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Each caption must have start, end, and text fields",
                });
            }

            if (caption.start >= caption.end) {
                return res.status(400).json({
                    success: false,
                    message: "Caption start time must be before end time",
                });
            }
        }

        let lecture = null;
        let course = null;
        let captionIndex = null;
        let oldS3Key = null;
        let oldCaption = null;
        if (itemType === "lectureVideo") {
            lecture = await Lecture.findById(lectureId);
            if (!lecture) {
                return res.status(404).json({ message: "Lecture not found" });
            }

            captionIndex = lecture.content.captions.findIndex((cap) => cap.language === language);

            if (captionIndex === -1) {
                return res.status(404).json({ message: "Caption not found" });
            }

            oldCaption = lecture.content.captions[captionIndex];
            console.log(oldCaption);
            oldS3Key = oldCaption.s3Key;
        } else if (itemType === "promoVideo") {
            course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: "Course not found" });
            }

            captionIndex = course.promoVideo.captions.findIndex((cap) => cap.language === language);

            if (captionIndex === -1) {
                return res.status(404).json({ message: "Caption not found" });
            }

            oldCaption = course.promoVideo.captions[captionIndex];
            oldS3Key = oldCaption.s3Key;
        }

        const newVttContent = generateVTT(captions);

        const timestamp = Date.now();
        let newS3Key = "";
        if (itemType === "lectureVideo") {
            newS3Key = `${courseId}/lecture-video/captions/${language}/${lectureId}_${timestamp}.vtt`;
        } else {
            newS3Key = `${courseId}/course-promo-video/captions/${language}/${courseId}_${timestamp}.vtt`;
        }

        try {
            const putCommand = new PutObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: newS3Key,
                Body: newVttContent,
                ContentType: "text/vtt",
            });

            await s3Client.send(putCommand);

            const newPublicURL = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${newS3Key}`;

            if (itemType === "lectureVideo") {
                console.log(1636, oldCaption.toObject());
                lecture.content.captions[captionIndex] = {
                    ...oldCaption.toObject(),
                    s3Key: newS3Key,
                    publicURL: newPublicURL,
                    status: "edited",
                };
                await lecture.save();
            } else {
                course.promoVideo.captions[captionIndex] = {
                    ...oldCaption.toObject(),
                    s3Key: newS3Key,
                    publicURL: newPublicURL,
                    status: "edited",
                };

                await course.save();
            }

            if (oldS3Key) {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: oldS3Key,
                });

                await s3Client.send(deleteCommand);
                console.log(`Deleted old caption file: ${oldS3Key}`);
            }

            return res.json({ success: true });
        } catch (error) {
            console.error("Error updating caption:", error);

            // Nếu có lỗi, cố gắng xóa file mới đã upload (cleanup)
            try {
                const deleteCommand = new DeleteObjectCommand({
                    Bucket: process.env.AWS_S3_BUCKET_NAME,
                    Key: newS3Key,
                });
                await s3Client.send(deleteCommand);
            } catch (cleanupError) {
                console.error("Error cleaning up new file:", cleanupError);
            }

            res.status(500).json({
                success: false,
                message: "Failed to update caption",
                error: error.message,
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update caption",
            error: error.message,
        });
    }
};

export {
    getCourseByAlias,
    getCourses,
    getAllCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseInfo,
    processCourse,
    getSearchCourseSuggestion,
    getSearchCourseResults,
    getAllCoursesInfo,
    generateCaption,
    handleCaptionWebhook,
    getCaptionVideoStatus,
    addCaptionVideo,
    getInstructorCourses,
    searchCourses,
    deleteCaptionVideo,
    handleVideoWebhook,
    getCaptionContent,
    updateCaption,
};
