import { apiSlice } from "./apiSlice";
import { PROFILE_URL } from "../constants";

export const profileApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Lấy thông tin profile
        getProfile: builder.query({
            query: () => ({
                url: PROFILE_URL,
                method: "GET",
            }),
            providesTags: ["Profile"],
        }),

        // Cập nhật profile (bao gồm ảnh đại diện)
        updateProfile: builder.mutation({
            query: (data) => ({
                url: PROFILE_URL,
                method: "PUT",
                body: data,
            }),
            invalidatesTags: ["Profile"],
        }),

        // Đổi mật khẩu
        changePassword: builder.mutation({
            query: (data) => ({
                url: `${PROFILE_URL}/change-password`,
                method: "PUT",
                body: data,
            }),
        }),
    }),
});

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
} = profileApiSlice;

