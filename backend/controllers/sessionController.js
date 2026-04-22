import mongoose from "mongoose";
import Course from "../models/course.js";
import Session from "../models/session.js";
import { generateRTCToken } from "../utils/agoraToken.js";

const createSession = async (req, res) => {
    try {
        const {
            course: courseId,
            sessionName,
            sessionDescription,
            scheduledStart,
            scheduledEnd,
        } = req.body;
        const course = Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học",
            });
        }

        const startDate = new Date(scheduledStart);
        const endDate = new Date(scheduledEnd);
        const now = new Date();

        if (startDate < now) {
            return res.status(400).json({
                success: false,
                error: "Thời gian bắt đầu không thể ở quá khứ",
            });
        }

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                error: "Thời gian kết thúc phải sau thời gian bắt đầu",
            });
        }

        const overlappingSession = await Session.findOne({
            course: courseId,
            status: { $in: ["scheduled", "live"] },
            $or: [
                {
                    scheduledStart: { $lt: endDate },
                    scheduledEnd: { $gt: startDate },
                },
            ],
        });

        if (overlappingSession) {
            return res.status(400).json({
                success: false,
                error: "Đã có buổi học khác trong khoảng thời gian này",
            });
        }

        const session = await Session.create({
            course: courseId,
            sessionName,
            sessionDescription,
            scheduledStart: startDate,
            scheduledEnd: endDate,
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi tạo buổi học",
            error: error.message,
        });
    }
};

const getSessionsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy lớp học",
            });
        }

        const sessions = await Session.find({ course: courseId });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách buổi học",
            error: error.message,
        });
    }
};

const getSessions = async (req, res) => {
    try {
        const {
            courseId,
            status,
            page = 1,
            limit = 10,
            sortBy = "scheduledStart",
            sortOrder = "asc",
            fromDate,
            toDate,
        } = req.query;

        const filter = {};
        if (courseId) {
            if (!mongoose.Types.ObjectId.isValid(courseId)) {
                return res.status(400).json({
                    success: false,
                    message: "ID khoá học không hợp lệ",
                });
            }
            filter.course = courseId;
        }
        if (status) {
            const validStatuses = ["scheduled", "live", "ended", "cancelled"];
            if (validStatuses.includes(status)) {
                filter.status = status;
            }
        }

        if (fromDate || toDate) {
            filter.scheduledStart = {};
            if (fromDate) {
                filter.scheduledStart.$gte = new Date(fromDate);
            }

            if (toDate) {
                filter.scheduledStart.$lte = new Date(toDate);
            }
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const sessions = await Session.find(filter)
            .populate("course", "title")
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .lean();

        const total = await Session.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNum);

        return res.status(200).json({
            sessions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách buổi học",
            error: error.message,
        });
    }
};

const startSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy buổi học",
            });
        }
        if (session.status === "live") {
            return res.status(400).json({
                success: false,
                message: "Buổi học đang diễn ra",
            });
        }
        session.status = "live";
        session.actualStart = new Date();
        await session.save();

        res.json({
            data: session,
            message: "Đã bắt đầu buổi học",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi bắt đầu buổi học",
            error: error.message,
        });
    }
};

const endSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy buổi học",
            });
        }

        session.status = "ended";
        session.actualEnd = new Date();
        await session.save();

        res.status(200).json({
            success: true,
            data: session,
            message: "Đã kết thúc buổi học",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi kết thúc buổi học",
            error: error.message,
        });
    }
};

const joinSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy buổi học",
            });
        }

        const alreadyJoined = session.participants.find(
            (p) => p.user.toString() === req.user._id && !p.leftAt,
        );

        if (alreadyJoined) {
            return res.status(400).json({
                success: false,
                message: "Bạn đã tham gia buổi học này rồi",
            });
        }

        session.participants.push({
            user: req.user._id,
            joinedAt: new Date(),
        });

        await session.save();
        res.status(200).json({
            success: true,
            message: "Đã tham gia buổi học",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi tham gia buổi học",
            error: error.message,
        });
    }
};

const leaveSession = async (req, res) => {
    try {

        console.log(req.user._id)
        const session = await Session.findById(req.params.sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy buổi học",
            });
        }

        const participantIndex = session.participants.findIndex(
            (p) => p.user.toString() === req.user._id.toString() && !p.leftAt,
        );

        if (participantIndex === -1) {
            return res.status(400).json({
                success: false,
                message: "Bạn chưa tham gia buổi học này",
            });
        }

        const leftAt = new Date();
        session.participants[participantIndex].leftAt = leftAt;
        const joinedAt = session.participants[participantIndex].joinedAt;
        const duration = Math.floor((leftAt - joinedAt) / 1000);

        await session.save();
        res.status(200).json({
            success: true,
            message: "Đã rời buổi học",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi rời buổi học",
            error: error.message,
        });
    }
};

const getSession = async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId).populate("course", "title");

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy buổi học",
            });
        }

        return res.json(session);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy thông tin buổi học",
            error: error.message,
        });
    }
};

const updateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updateData = req.body;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: "Không tìm thấy buổi học",
            });
        }

        // Kiểm tra trạng thái session
        if (session.status === "live") {
            return res.status(400).json({
                success: false,
                error: "Không thể chỉnh sửa buổi học đang diễn ra",
            });
        }

        if (session.status === "ended" || session.status === "cancelled") {
            return res.status(400).json({
                success: false,
                error: `Không thể chỉnh sửa buổi học đã ${session.status === "ended" ? "kết thúc" : "hủy"}`,
            });
        }

        // Kiểm tra thời gian sửa (chỉ cho phép sửa trước 30 phút khi bắt đầu)
        const now = new Date();
        const timeUntilStart = new Date(session.scheduledStart) - now;
        const canEdit = timeUntilStart > 30 * 60000; // 30 phút

        if (!canEdit) {
            return res.status(400).json({
                success: false,
                error: "Chỉ có thể chỉnh sửa buổi học trước 30 phút khi bắt đầu",
            });
        }

        if (updateData.scheduledStart || updateData.scheduledEnd) {
            const startDate = updateData.scheduledStart
                ? new Date(updateData.scheduledStart)
                : new Date(session.scheduledStart);

            const endDate = updateData.scheduledEnd
                ? new Date(updateData.scheduledEnd)
                : new Date(session.scheduledEnd);

            if (startDate < now) {
                return res.status(400).json({
                    success: false,
                    error: "Thời gian bắt đầu không thể ở quá khứ",
                });
            }

            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    error: "Thời gian kết thúc phải sau thời gian bắt đầu",
                });
            }

            const overlappingSession = await Session.findOne({
                _id: { $ne: id },
                status: { $in: ["scheduled", "live"] },
                $or: [
                    {
                        scheduledStart: { $lt: endDate },
                        scheduledEnd: { $gt: startDate },
                    },
                ],
            });

            if (overlappingSession) {
                return res.status(400).json({
                    success: false,
                    error: "Đã có buổi học khác trong khoảng thời gian này",
                });
            }
        }

        const restrictedFields = ["course", "status"];
        restrictedFields.forEach((field) => {
            if (updateData[field] && updateData[field] !== session[field]) {
                return res.status(400).json({
                    success: false,
                    error: `Không thể thay đổi ${field} của buổi học`,
                });
            }
        });

        Object.keys(updateData).forEach((key) => {
            if (key !== "course") {
                session[key] = updateData[key];
            }
        });

        await session.save();

        // Populate lại dữ liệu
        const updatedSession = await Session.findById(id).populate("course", "title").lean();

        res.status(200).json({
            success: true,
            message: "Buổi học đã được cập nhật thành công",
            session: updatedSession,
        });
    } catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({
            success: false,
            error: "Không thể cập nhật buổi học",
        });
    }
};

const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: "Không tìm thấy buổi học",
            });
        }

        if (session.status === "live") {
            return res.status(400).json({
                success: false,
                error: "Không thể xóa buổi học đang diễn ra",
            });
        }

        // Kiểm tra thời gian xóa (chỉ cho phép xóa trước 1 giờ khi bắt đầu)
        const now = new Date();
        const timeUntilStart = new Date(session.scheduledStart) - now;
        const canDelete = timeUntilStart > 60 * 60000; // 1 giờ

        if (!canDelete && req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                error: "Chỉ có thể xóa buổi học trước 1 giờ khi bắt đầu",
            });
        }

        await session.deleteOne();

        res.status(200).json({
            success: true,
            message: "Buổi học đã được xóa thành công",
            deletedSessionId: id,
        });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({
            success: false,
            error: "Không thể xóa buổi học",
        });
    }
};

const getRTCToken = async (req, res) => {
    try {
        const { channelName, uid, role } = req.body;

        if (!channelName) {
            return res.status(400).json({
                success: false,
                message: "Channel name is required",
            });
        }

        // Generate token
        const token = generateRTCToken(channelName, uid || 0, role || "publisher");

        res.status(200).json({
            success: true,
            data: {
                token,
                appId: process.env.AGORA_APP_ID,
                channelName,
                uid,
                expiresIn: 86400, // 24 hours
            },
        });
    } catch (error) {
        console.error("Error generating token:", error);
        res.status(500).json({
            success: false,
            message: "Error generating token",
            error: error.message,
        });
    }
};

export {
    createSession,
    getSessions,
    getSessionsByCourse,
    joinSession,
    leaveSession,
    startSession,
    endSession,
    getSession,
    updateSession,
    deleteSession,
    getRTCToken,
};
