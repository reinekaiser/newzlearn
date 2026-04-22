import { COURSE_URL } from "@/redux/constants";
import { apiSlice } from "../api/apiSlice";

export const courseApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createCourse: builder.mutation({
            query: (data) => ({
                url: `${COURSE_URL}`,
                method: "POST",
                body: data,
            }),
        }),
        updateCourse: builder.mutation({
            query: ({ courseAlias, data }) => ({
                url: `${COURSE_URL}/${courseAlias}`,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: (result, error, { courseAlias }) => [
                { type: "Course", id: courseAlias },
            ],
        }),
        getCourseInfo: builder.query({
            query: (courseAlias) => ({
                url: `${COURSE_URL}/${courseAlias}/info`,
            }),
            providesTags: (result, error, courseAlias) => [{ type: "Course", id: courseAlias }],
        }),
        processCourse: builder.mutation({
            query: (courseAlias) => ({
                url: `${COURSE_URL}/${courseAlias}/process`,
                method: "POST",
            }),
        }),
        getCaptionStatus: builder.query({
            query: (courseAlias) => ({
                url: `${COURSE_URL}/${courseAlias}/captions`,
            }),
            providesTags: (result, error, courseAlias) => [
                { type: "Caption", id: courseAlias },
                { type: "Course", id: courseAlias },
                { type: "Caption" },
            ],
        }),
        addCaption: builder.mutation({
            query: ({ courseAlias, caption }) => ({
                url: `${COURSE_URL}/${courseAlias}/captions`,
                method: "POST",
                body: caption,
            }),
            invalidatesTags: (result, error, { courseAlias }) => [
                { type: "Caption", id: courseAlias },
            ],
        }),
        searchCourses: builder.query({
            query: (keyword) => ({
                url: `${COURSE_URL}/search`,
                method: "GET",
                params: { keyword },
            }),
        }),
        getInstructorCourses: builder.query({
            query: () => ({
                url: `${COURSE_URL}/instructor`,
            }),
        }),
        generateCaptions: builder.mutation({
            query: (courseId) => ({
                url: `${COURSE_URL}/${courseId}/generate-captions`,
                method: "POST",
            }),
        }),
        deleteCaption: builder.mutation({
            query: ({ courseAlias, ...data }) => ({
                url: `${COURSE_URL}/${courseAlias}/captions`,
                method: "DELETE",
                body: data,
            }),
            invalidatesTags: (result, error, { courseAlias }) => [
                { type: "Caption", id: courseAlias },
                "Caption",
            ],
        }),
        getCaptionContent: builder.query({
            query: ({ courseId, lectureId, language, itemType }) => ({
                url: `${COURSE_URL}/${courseId}/captions/${lectureId}/${language}/${itemType}`,
            }),
            providesTags: (result, error, { courseId, lectureId, language }) => [
                { type: "Caption", id: `${courseId}-${lectureId}-${language}` },
            ],
        }),
        updateCaption: builder.mutation({
            query: ({ courseId, lectureId, language, itemType, captions }) => ({
                url: `${COURSE_URL}/${courseId}/captions/${lectureId}/${language}/${itemType}`,
                method: "PUT",
                body: { captions },
            }),
            invalidatesTags: (result, error, { courseId, lectureId, language }) => [
                { type: "Caption", id: `${courseId}-${lectureId}-${language}` },
                { type: "Caption" },
            ],
        }),
        callChatBot: builder.mutation({
            query: ({ lectureId, question, threadId = null }) => ({
                url: `${COURSE_URL}/lectures/${lectureId}/chat/agent`,
                method: "POST",
                body: { question, threadId },
            }),
        }),
        getRecommendCourses: builder.query({
            query: () => ({
                url: `${COURSE_URL}/recommendation`,
            }),
        }),
        getManageCourses: builder.query({
            query: ({ page = 1, limit = 10, sort, search }) => {
                const params = new URLSearchParams();
                params.append("page", page);
                params.append("limit", limit);

                if (sort) params.append("sort", sort);
                if (search) params.append("search", search);

                return `${COURSE_URL}/manage?${params.toString()}`;
            },
        }),
    }),
});

export const {
    useCreateCourseMutation,
    useUpdateCourseMutation,
    useGetCourseInfoQuery,
    useProcessCourseMutation,
    useGetCaptionStatusQuery,
    useAddCaptionMutation,
    useSearchCoursesQuery,
    useGetInstructorCoursesQuery,
    useGenerateCaptionsMutation,
    useDeleteCaptionMutation,
    useGetCaptionContentQuery,
    useUpdateCaptionMutation,
    useCallChatBotMutation,
    useGetRecommendCoursesQuery,
    useGetManageCoursesQuery,
} = courseApiSlice;
