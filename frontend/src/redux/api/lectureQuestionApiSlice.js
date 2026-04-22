import { LECTURE_QUESTION_URL } from "@/redux/constants";
import { apiSlice } from "../api/apiSlice";

export const lectureQuestionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLectureQuestions: builder.query({
            query: (lectureId) => ({
                url: `${LECTURE_QUESTION_URL}/${lectureId}`,
                method: "GET",
            }),
            providesTags: (result, error, lectureId) => [{ type: "LectureQuestions", id: lectureId }],
        }),
        addLectureQuestion: builder.mutation({
            query: (data) => ({
                url: `${LECTURE_QUESTION_URL}/add`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: (result, error, { lectureId }) => [
                { type: "LectureQuestions", id: lectureId },
            ],
        }),
        updateLectureQuestion: builder.mutation({
            query: (data) => ({
                url: `${LECTURE_QUESTION_URL}/update`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { lectureId }) => [
                { type: "LectureQuestions", id: lectureId },
            ],
        }),
        deleteLectureQuestion: builder.mutation({
            query: ({ lectureId, questionId }) => ({
                url: `${LECTURE_QUESTION_URL}/delete/${lectureId}/${questionId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, { lectureId }) => [
                { type: "LectureQuestions", id: lectureId },
            ],
        }),
        getLectureResults: builder.query({
            query: ({ userId, lectureId }) => ({
                url: `${LECTURE_QUESTION_URL}/getAnswer`,
                params: { userId, lectureId },
            }),
            providesTags: (result, error, { lectureId }) => 
                [{ type: 'LectureResult', id: lectureId }],
        }),
        submitLectureAnswer: builder.mutation({
            query: (data) => ({
                url: `${LECTURE_QUESTION_URL}/submit`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: (result, error, { lectureId }) => 
                [{ type: 'LectureResult', id: lectureId }],
        }),
    }),
});

export const {
    useGetLectureQuestionsQuery,
    useAddLectureQuestionMutation,
    useUpdateLectureQuestionMutation,
    useDeleteLectureQuestionMutation,
    useGetLectureResultsQuery,
    useSubmitLectureAnswerMutation
} = lectureQuestionApiSlice;