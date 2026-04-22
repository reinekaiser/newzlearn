import { fetchBaseQuery, createApi } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../constants"

const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState, endpoint, body }) => {
        headers.set('Accept', 'application/json');
        // Don't set Content-Type for FormData, let browser set it with boundary
        if (body instanceof FormData) {
            // Remove Content-Type to let browser set it with proper boundary
            headers.delete('Content-Type');
            console.log('FormData detected, Content-Type header removed');
        }
        return headers;
    }
});

export const apiSlice = createApi({
    baseQuery: baseQuery,

    tagTypes: ["Course", "Section", "Progress", "Note", "QnA", "Profile", "Reviews", "Favorites", "LectureQuestions", "LectureResult", "Sessions"],

    endpoints: () => ({}),
})