import QnA from "../models/qna.js";
import Course from "../models/course.js";
import { uploadBase64ImagesInContent } from "./uploadController.js";

export const createQNA = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, title, content, lectureId, courseId } = req.body;

    // Xử lý Base64 → upload lên S3 → thay link
    const processedContent = await uploadBase64ImagesInContent(
      courseId,
      content
    );

    // Lưu processedContent vào DB
    const newPost = await QnA.create({
      author: userId,
      type,
      title,
      lectureId,
      courseId,
      content: processedContent,
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updateQnA = async (req, res) => {
  try {
    const { qnaId } = req.params;
    const { type, title, content } = req.body;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    if (qna.author.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to update this QnA" });
    }
    const processedContent = await uploadBase64ImagesInContent(
      qna.courseId,
      content
    );
    qna.type = type;
    qna.title = title;
    qna.content = processedContent;
    await qna.save();
    res.status(200).json({ message: "QnA updated successfully" });
  } catch (error) {
    console.log("Error updating QnA:", error);
    res.status(500).json({ message: "Failed to update QnA" });
  }
};

export const deleteQnA = async (req, res) => {
  try {
    const { qnaId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    if (qna.author._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this QnA" });
    }
    await qna.deleteOne();
    res.status(200).json({ message: "QnA deleted successfully" });
  } catch (error) {
    console.log("Error deleting QnA:", error);
    res.status(500).json({ message: "Failed to delete QnA" });
  }
};

export const getQnAById = async (req, res) => {
  try {
    const { qnaId } = req.params;
    const qna = await QnA.findById(qnaId)
      .populate("courseId", "title")
      .populate("lectureId", "title")
      .populate("author", "firstName lastName profilePicture")
      .populate("comments.user", "firstName lastName profilePicture")
      .populate("comments.replies.user", "firstName lastName profilePicture");
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    qna.comments = qna.comments.sort((a, b) => {
      // 1. Prioritize isSolution
      if (a.isSolution && !b.isSolution) return -1;
      if (!a.isSolution && b.isSolution) return 1;

      // 2. Then prioritize isTopComment
      if (a.isTopComment && !b.isTopComment) return -1;
      if (!a.isTopComment && b.isTopComment) return 1;

      // 3. Otherwise sort by createdAt (oldest first)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    res.status(200).json(qna);
  } catch (error) {
    console.error("Error fetching QnA by ID:", error);
  }
};

export const getQnAByPage = async (req, res) => {
  try {
    const { lectureId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 7; // Số câu hỏi mỗi trang
    if (!lectureId) {
      return res.status(400).json({ message: "lectureId is required" });
    }
    const totalQuestions = await QnA.countDocuments({ lectureId });
    const totalPages = Math.ceil(totalQuestions / limit);
    const qnas = await QnA.find({ lectureId })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      totalQuestions,
      totalPages,
      data: qnas,
    });
  } catch (error) {
    console.error("Error fetching QnAs by page:", error);
    res.status(500).json({ message: "Failed to fetch QnAs" });
  }
};

export const createComment = async (req, res) => {
  try {
    const { qnaId } = req.params;
    const { content } = req.body;

    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }

    // Xử lý Base64 → upload lên S3 → thay link
    const processedContent = await uploadBase64ImagesInContent(
      qna.courseId,
      content
    );

    qna.comments.push({
      user: userId,
      content: processedContent,
    });
    await qna.save();
    res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { qnaId, commentId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    // Kiểm tra quyền xóa (chủ sở hữu phản hồi hoặc quản trị viên)
    if (comment.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to edit this comment" });
    }
    const { content } = req.body;
    const processedContent = await uploadBase64ImagesInContent(
      qna.courseId,
      content
    );
    comment.content = processedContent;
    await qna.save();
    res.status(200).json({ message: "Comment edited successfully" });
  } catch (error) {
    console.log("Error editing comment:", error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { qnaId, commentId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    // Kiểm tra quyền xóa (chủ sở hữu bình luận hoặc quản trị viên)
    if (comment.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this comment" });
    }
    if (comment.isSolution) qna.isSolved = false;
    comment.deleteOne();
    await qna.save();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.log("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
};

export const createReply = async (req, res) => {
  try {
    const { qnaId, commentId } = req.params;
    const { content } = req.body;

    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }

    const processedContent = await uploadBase64ImagesInContent(
      qna.courseId,
      content
    );

    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    comment.replies.push({
      user: userId,
      content: processedContent,
    });
    await qna.save();
    res.status(201).json({ message: "Reply added successfully" });
  } catch (error) {
    console.log("Error creating reply:", error);
    res.status(500).json({ message: "Failed to create reply" });
  }
};

export const updateReply = async (req, res) => {
  try {
    const { qnaId, commentId, replyId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    // Kiểm tra quyền xóa (chủ sở hữu phản hồi hoặc quản trị viên)
    if (reply.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to edit this reply" });
    }
    const { content } = req.body;
    const processedContent = await uploadBase64ImagesInContent(
      qna.courseId,
      content
    );
    reply.content = processedContent;
    await qna.save();
    res.status(200).json({ message: "Reply edited successfully" });
  } catch (error) {
    console.log("Error editing reply:", error);
    res.status(500).json({ message: "Failed to edit reply" });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { qnaId, commentId, replyId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    // Kiểm tra quyền xóa (chủ sở hữu phản hồi hoặc quản trị viên)
    if (reply.user._id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this reply" });
    }
    reply.deleteOne();
    await qna.save();
    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.log("Error deleting reply:", error);
    res.status(500).json({ message: "Failed to delete reply" });
  }
};

export const updateReactionComment = async (req, res) => {
  try {
    const { type } = req.body;
    const { qnaId, commentId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    // Kiểm tra nếu user đã react
    const existingReactionIndex = comment.likes.findIndex(
      (like) => like.userId.toString() === userId.toString()
    );
    if (existingReactionIndex !== -1) {
      // Nếu cùng loại reaction, bỏ reaction (unreact)
      if (comment.likes[existingReactionIndex].type === type) {
        comment.likes.splice(existingReactionIndex, 1);
      } else {
        // Cập nhật loại reaction
        comment.likes[existingReactionIndex].type = type;
      }
    } else {
      // Thêm reaction mới
      comment.likes.push({ userId, type });
    }
    await qna.save();
    res.status(200).json({ message: "Reaction updated successfully" });
  } catch (error) {
    console.log("Error updating reaction on comment:", error);
    res.status(500).json({ message: "Failed to update reaction on comment" });
  }
};

export const updateReactionReply = async (req, res) => {
  try {
    const { type } = req.body;
    const { qnaId, commentId, replyId } = req.params;
    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }
    // Kiểm tra nếu user đã react
    const existingReactionIndex = reply.likes.findIndex(
      (like) => like.userId.toString() === userId.toString()
    );
    if (existingReactionIndex !== -1) {
      // Nếu cùng loại reaction, bỏ reaction (unreact)
      if (reply.likes[existingReactionIndex].type === type) {
        reply.likes.splice(existingReactionIndex, 1);
      } else {
        // Cập nhật loại reaction
        reply.likes[existingReactionIndex].type = type;
      }
    } else {
      // Thêm reaction mới
      reply.likes.push({ userId, type });
    }
    await qna.save();
    res.status(200).json({ message: "Reaction updated successfully" });
  } catch (error) {
    console.log("Error updating reaction on reply:", error);
    res.status(500).json({ message: "Failed to update reaction on reply" });
  }
};

export const updateAnswer = async (req, res) => {
  try {
    const { qnaId } = req.params;
    const { content } = req.body;

    const userId = req.user._id;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }

    // Xử lý Base64 → upload lên S3 → thay link
    const processedContent = await uploadBase64ImagesInContent(
      qna.courseId,
      content
    );

    qna.comments.push({
      user: userId,
      content: processedContent,
      isSolution: true,
    });
    qna.isSolved = true;
    await qna.save();
    res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const getQnAByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const qnas = await QnA.find({ courseId }).populate({
      path: "author",
      select: "firstName lastName profilePicture",
    });
    return res.status(200).json(qnas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getQnAByInstructor = async (req, res) => {
  try {
    // const instructorId = req.user._id;
    const courses = await Course.find({});
    if (!courses || courses.length === 0) {
      return res.status(404).json({ message: "No courses found" });
    }
    const courseIds = courses.map((c) => c._id);
    const qnas = await QnA.find({
      courseId: { $in: courseIds },
    }).populate("author", "firstName lastName profilePicture");
    return res.status(200).json(qnas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateIsRead = async (req, res) => {
  try {
    const { qnaId } = req.params;
    const { isRead } = req.body;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    qna.isRead = isRead;
    await qna.save();
    return res.status(200).json({ message: "Update isRead successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const upvoteComment = async (req, res) => {
  try {
    const { qnaId, commentId } = req.params;
    const qna = await QnA.findById(qnaId);
    if (!qna) {
      return res.status(404).json({ message: "QnA not found" });
    }
    const comment = qna.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    comment.isTopComment = true;
    await qna.save();
    res.status(200).json({ message: "Reaction updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
