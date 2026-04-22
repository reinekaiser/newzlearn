import { PERFORMANCE_URL } from "../constants";
import { apiSlice } from "../api/apiSlice";

export const performentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getLearningMinutesStats: builder.query({
            query: ({ range = "alltime", courseId = "" }) => {
                const params = new URLSearchParams();

                if (range) params.append("range", range);
                if (courseId) params.append("courseId", courseId);

                return `${PERFORMANCE_URL}/minutes-stats?${params.toString()}`;
            },
        }),
        getLearningItemsCountStats: builder.query({
            query: ({ range = "alltime", courseId = "" }) => {
                const params = new URLSearchParams();

                if (range) params.append("range", range);
                if (courseId) params.append("courseId", courseId);

                return `${PERFORMANCE_URL}/count-items-stats?${params.toString()}`;
            },
        }),
        getCourseStats: builder.query({
            query: (courseId) => ({
                url: `${PERFORMANCE_URL}/course/${courseId}`
            })
        }),
        getRevenueOverview: builder.query({
            query: ({ range = "alltime" } = {}) => {
                const params = new URLSearchParams();
                if (range) params.append("range", range);
                return `${PERFORMANCE_URL}/revenue-overview?${params.toString()}`;
            }
        }),
    }),
});

export const {
    useGetLearningMinutesStatsQuery,
    useGetLearningItemsCountStatsQuery,
    useGetCourseStatsQuery,
    useGetRevenueOverviewQuery,
} = performentApiSlice