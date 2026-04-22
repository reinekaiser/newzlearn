import { REVIEW_URL } from "@/redux/constants";
import { apiSlice } from "../api/apiSlice";

export const reviewApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getReviews: builder.query({
            query: (params) => {
                const queryString = new URLSearchParams(params).toString();
                return `${REVIEW_URL}/?${queryString}`;
            },
            providesTags: (result, error, arg) => [
                { type: "Reviews", id: "LIST" },
                ...((result && result.reviews)
                    ? result.reviews.map((r) => ({ type: "Reviews", id: r._id }))
                    : []),
            ],
        }),

        getAllReviews: builder.query({
            query: (params) => {
                const queryString = new URLSearchParams(params).toString();
                return `${REVIEW_URL}/all?${queryString}`;
            },
            providesTags: (result, error, arg) => [
                { type: "Reviews", id: "LIST" },
                ...((result && result.reviews)
                    ? result.reviews.map((r) => ({ type: "Reviews", id: r._id }))
                    : []),
            ],
        }),

        getMyReviews: builder.query({
            query: () => `${REVIEW_URL}/my-reviews`,
            providesTags: (result) =>
                result
                    ? [...result.map((r) => ({ type: "Reviews", id: r._id })),
                        { type: "Reviews", id: "LIST" },
                    ]
                    : [{ type: "Reviews", id: "LIST" }],
        }),

        getReviewsByCourse: builder.query({
            query: (courseId) => `${REVIEW_URL}/${courseId}`,
            providesTags: (result, error, courseId) => [
                { type: "Reviews", id: courseId },
                { type: "Reviews", id: "LIST" },
            ],
        }),

        createOrUpdateReview: builder.mutation({
            query: (data) => ({
                url: `${REVIEW_URL}/my-reviews`,
                method: "POST",
                body: data,
            }),
            invalidatesTags: [{ type: "Reviews", id: "LIST" }],
        }),

        deleteReview: builder.mutation({
            query: (id) => ({
                url: `${REVIEW_URL}/delete/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, courseId) => [
                { type: "Reviews", id: courseId },
                { type: "Reviews", id: "LIST" },
            ],
        }),

        getSurvetStats: builder.query({
            query: (courseId) => `${REVIEW_URL}/survey-stats/${courseId}`,

        }),
    }),
});

export const {
    useGetMyReviewsQuery,
    useGetReviewsByCourseQuery,
    useCreateOrUpdateReviewMutation,
    useDeleteReviewMutation,
    useGetReviewsQuery,
    useGetSurvetStatsQuery,
    useGetAllReviewsQuery
} = reviewApiSlice;