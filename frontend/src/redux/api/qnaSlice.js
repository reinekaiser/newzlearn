import { QNA_URL } from "../constants";
import { apiSlice } from "../api/apiSlice";

export const questionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createQnA: builder.mutation({
      query: (body) => ({
        url: `${QNA_URL}/createQnA`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error) => [
        { type: "QnA", id: "LIST" },
      ],
    }),
    updateQnA: builder.mutation({
      query: ({ qnaId, body }) => ({
        url: `${QNA_URL}/${qnaId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
        { type: "QnA", id: "LIST" },
      ],
    }),
    deleteQnA : builder.mutation({
      query: ({ qnaId }) => ({
        url: `${QNA_URL}/${qnaId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
        { type: "QnA", id: "LIST" },
      ],
    }),
    getQnAById: builder.query({
      query: (id) => ({
        url: `${QNA_URL}/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "QnA", id }],
    }),
    getQnAByPage: builder.query({
      query: ({lectureId, page = 1}) => ({
        url: `${QNA_URL}?page=${page}&lectureId=${lectureId}`,
      }),
      providesTags: (result, error, id) => [{ type: "QnA", id: "LIST" }],
    }),
    createComment: builder.mutation({
      query: ({ qnaId, body }) => ({
        url: `${QNA_URL}/${qnaId}/comment`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    updateComment: builder.mutation({
      query: ({ qnaId, commentId,  body }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    deleteComment: builder.mutation({
      query: ({ qnaId, commentId }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    createReply: builder.mutation({
      query: ({ qnaId, commentId, body }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}/reply`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    updateReply: builder.mutation({
      query: ({ qnaId, commentId, replyId, body }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}/reply/${replyId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    deleteReply: builder.mutation({
      query: ({ qnaId, commentId, replyId }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}/reply/${replyId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    updateReactionComment: builder.mutation({
      query: ({ qnaId, commentId, body }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}/reaction`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    updateReactionReply: builder.mutation({
      query: ({ qnaId, commentId, replyId, body }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}/reply/${replyId}/reaction`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { qnaId }) => [
        { type: "QnA", id: qnaId },
      ],
    }),
    getQnAByCourseId: builder.query({
      query: (courseId) => ({
        url: `${QNA_URL}/course/${courseId}`,
      }),
      providesTags: (result, error, courseId) => [
        { type: "QnA", id: `course-${courseId}` }
      ],
    }),
    getQnAByInstructor: builder.query({
      query: () => ({
        url: `${QNA_URL}/instructor`,
      }),
      providesTags: (result, error, id) => [{ type: "QnA", id: "instructor" }],
    }),
    updateIsRead: builder.mutation({
      query: ({ qnaId, body }) => ({
        url: `${QNA_URL}/${qnaId}/isRead`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "QnA", id: `course-${courseId}` },
        { type: "QnA", id: "instructor" },
      ],
    }),
    updateAnswer:builder.mutation({
      query: ({ qnaId, body }) => ({
        url: `${QNA_URL}/${qnaId}/answer`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { qnaId, courseId }) => [
        { type: "QnA", id: qnaId },
        { type: "QnA", id: `course-${courseId}` },
        { type: "QnA", id: "instructor" },
      ],
    }),
    createInstructorReply: builder.mutation({
      query: ({ qnaId, commentId, body }) => ({
        url: `${QNA_URL}/${qnaId}/comment/${commentId}/reply`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { qnaId, courseId }) => [
        { type: "QnA", id: qnaId },
        { type: "QnA", id: `course-${courseId}` },
        { type: "QnA", id: "instructor" },
      ],
    }),
    upvoteComment: builder.mutation({
      query: ({ qnaId, commentId }) => ({
        url: `${QNA_URL}/${qnaId}/upvote/${commentId}`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "QnA", id: qnaId },
        { type: "QnA", id: `course-${courseId}` },
        { type: "QnA", id: "instructor" },
      ],
    }),
  }),
});

export const {
  useCreateQnAMutation,
  useUpdateQnAMutation,
  useDeleteQnAMutation,
  useGetQnAByIdQuery,
  useGetQnAByPageQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useCreateReplyMutation,
  useUpdateReplyMutation,
  useDeleteReplyMutation,
  useUpdateReactionCommentMutation,
  useUpdateReactionReplyMutation,
  useGetQnAByCourseIdQuery,
  useGetQnAByInstructorQuery,
  useUpdateIsReadMutation,
  useUpdateAnswerMutation,
  useCreateInstructorReplyMutation,
  useUpvoteCommentMutation
} = questionApiSlice;
