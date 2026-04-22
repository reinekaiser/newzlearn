import { SESSION_URL } from "../constants";
import { apiSlice } from "../api/apiSlice";

export const sessionApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getSession: builder.query({
            query: (sessionId) => `${SESSION_URL}/${sessionId}`,
            providesTags: (result, error, sessionId) => [{ type: "Sessions", id: sessionId }],
        }),
        joinSession: builder.mutation({
            query: (sessionId) => ({
                url: `${SESSION_URL}/${sessionId}/join`,
                method: "POST",
            }),
            invalidatesTags: (result, error, sessionId) => [{ type: "Sessions", id: sessionId }],
        }),
        leaveSession: builder.mutation({
            query: (sessionId) => ({
                url: `${SESSION_URL}/${sessionId}/leave`,
                method: "POST",
            }),
            invalidatesTags: (result, error, sessionId) => [{ type: "Sessions", id: sessionId }],
        }),
        startSession: builder.mutation({
            query: (sessionId) => ({
                url: `${SESSION_URL}/${sessionId}/start`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, sessionId) => [{ type: "Sessions", id: sessionId }],
        }),
        endSession: builder.mutation({
            query: (sessionId) => ({
                url: `${SESSION_URL}/${sessionId}/end`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, sessionId) => [{ type: "Sessions", id: sessionId }],
        }),
        getSessions: builder.query({
            query: (params = {}) => {
                const queryString = new URLSearchParams(params).toString();
                return `${SESSION_URL}/?${queryString}`;
            },
            providesTags: (result, error, arg) => [
                { type: "Sessions", id: "LIST" },
                ...(result && result.sessions
                    ? result.sessions.map((s) => ({ type: "Sessions", id: s._id }))
                    : []),
            ],
        }),
        getSessionsByCourse: builder.query({
            query: (courseId) => ({
                url: `${SESSION_URL}/course/${courseId}/sessions`,
            }),
            providesTags: (result, error, arg) => [
                ...(result ? result.map((s) => ({ type: "Sessions", id: s._id })) : []),
            ],
        }),
        createSession: builder.mutation({
            query: (sessionData) => ({
                url: `${SESSION_URL}/`,
                method: "POST",
                body: sessionData,
            }),
            invalidatesTags: [{ type: "Sessions", id: "LIST" }],
        }),
        updateSession: builder.mutation({
            query: ({ sessionId, ...sessionData }) => ({
                url: `${SESSION_URL}/${sessionId}`,
                method: "PUT",
                body: sessionData,
            }),
            invalidatesTags: (result, error, { sessionId }) => [
                { type: "Sessions", id: sessionId },
            ],
        }),
        deleteSession: builder.mutation({
            query: (sessionId) => ({
                url: `${SESSION_URL}/${sessionId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, arg) => [{ type: "Sessions", id: arg }],
        }),
        getRTCToken: builder.mutation({
            query: ({ channelName, uid, role }) => ({
                url: `${SESSION_URL}/token/rtc`,
                method: "POST",
                body: { channelName, uid, role },
            }),
        }),
    }),
});

export const {
    useCreateSessionMutation,
    useDeleteSessionMutation,
    useUpdateSessionMutation,
    useGetSessionQuery,
    useGetSessionsQuery,
    useGetSessionsByCourseQuery,
    useJoinSessionMutation,
    useLeaveSessionMutation,
    useStartSessionMutation,
    useEndSessionMutation,
    useGetRTCTokenMutation
} = sessionApiSlice;
