import { COURSE_URL } from "../constants";
import { apiSlice } from "../api/apiSlice";

export const coursePublicApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCourseById: builder.query({
            query: (courseId) => `${COURSE_URL}/${courseId}`,
        }),
        getCourseByAlias: builder.query({
            query: (courseAlias) => `${COURSE_URL}/alias/${courseAlias}`,
        }),
        getCurriculumItemById: builder.query({
            query: ({itemId, itemType}) => `${COURSE_URL}/item/${itemId}/type/${itemType}`
        }),
        getCourseSearchSuggestion: builder.query({
            query: (params) => ({
                url: `${COURSE_URL}/suggestion`,
                params
            })
        }),
        getCourseSearchResults: builder.query({
            query: (params) => ({
                url: `${COURSE_URL}/suggestion/results`,
                params
            })
        }),
        getAllCoursesInfo: builder.query({
            query: () => `${COURSE_URL}/getAllCoursesInfo`
        }),
    }),
});

export const {
    useGetCourseByIdQuery,
    useGetCourseByAliasQuery,
    useGetCurriculumItemByIdQuery,
    useGetCourseSearchSuggestionQuery,
    useGetCourseSearchResultsQuery,
    useGetAllCoursesInfoQuery,
} = coursePublicApiSlice