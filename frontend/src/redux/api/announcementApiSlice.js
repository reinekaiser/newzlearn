// src/redux/api/announcementApiSlice.js

import { apiSlice } from "../api/apiSlice";
import { ANNOUNCEMENT_URL } from "../constants";

export const announcementApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendAnnouncement: builder.mutation({
      query: (data) => ({
        url: `${ANNOUNCEMENT_URL}/send`,
        method: "POST",
        body: data,
      }),
    }),

   
    getAnnouncementHistory: builder.query({
      query: () => ({
        url: `${ANNOUNCEMENT_URL}/history`,
        method: "GET",
      }),
      providesTags: ["AnnouncementHistory"],
    }),

    deleteAnnouncement: builder.mutation({
      query: (id) => ({
        url: `${ANNOUNCEMENT_URL}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AnnouncementHistory"],
    }),
  }),
});

export const {
  useSendAnnouncementMutation,
  useGetAnnouncementHistoryQuery,
  useDeleteAnnouncementMutation,
} = announcementApiSlice;
