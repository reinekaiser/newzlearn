import { STUDENT_URL } from "../constants";
import { apiSlice } from "../api/apiSlice";

export const studentApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getStudentsInCourse: builder.query({
            query: (courseId) => ({
                url: `${STUDENT_URL}/course/${courseId}`,
            }),
        }),
        getStudentProfile: builder.query({
            query: (studentId) => ({
                url: `${STUDENT_URL}/${studentId}`,
            }),
        }),
    }),
});

export const {
    useGetStudentsInCourseQuery,
    useGetStudentProfileQuery
} = studentApiSlice;
