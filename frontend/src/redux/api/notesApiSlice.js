import { apiSlice } from "./apiSlice";
import { NOTES_URL } from "../constants";

export const notesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Lấy danh sách ghi chú theo courseId
        getNotesByCourse: builder.query({
            query: (courseId) => ({
                url: `${NOTES_URL}/course/${courseId}`,
                method: "GET",
            }),
            providesTags: ["Note"],
        }),

        // Lấy danh sách ghi chú theo lectureId
        getNotesByLecture: builder.query({
            query: (lectureId) => ({
                url: `${NOTES_URL}/lecture/${lectureId}`,
                method: "GET",
            }),
            providesTags: ["Note"],
        }),

        // Lấy danh sách ghi chú theo sectionId
        getNotesBySection: builder.query({
            query: (sectionId) => ({
                url: `${NOTES_URL}/section/${sectionId}`,
                method: "GET",
            }),
            providesTags: ["Note"],
        }),

        // Lấy sectionId từ lectureId
        getSectionByLecture: builder.query({
            query: (lectureId) => ({
                url: `${NOTES_URL}/lecture/${lectureId}/section`,
                method: "GET",
            }),
        }),

        // Tạo ghi chú mới
        createNote: builder.mutation({
            query: (noteData) => ({
                url: `${NOTES_URL}`,
                method: "POST",
                body: noteData,
            }),
            invalidatesTags: ["Note"],
        }),

        // Cập nhật ghi chú
        updateNote: builder.mutation({
            query: ({ id, ...noteData }) => ({
                url: `${NOTES_URL}/${id}`,
                method: "PUT",
                body: noteData,
            }),
            invalidatesTags: ["Note"],
        }),

        // Xóa ghi chú
        deleteNote: builder.mutation({
            query: (id) => ({
                url: `${NOTES_URL}/${id}`,
                method: "DELETE",
            }),
            invalidatesTags: ["Note"],
        }),
    }),
});

export const {
    useGetNotesByCourseQuery,
    useGetNotesByLectureQuery,
    useGetNotesBySectionQuery,
    useGetSectionByLectureQuery,
    useCreateNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = notesApiSlice;
