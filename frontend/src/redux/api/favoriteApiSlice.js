import { FAVORITE_URL } from "../constants";
import { apiSlice } from "./apiSlice";

export const favoriteApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getMyFavorites: builder.query({
            query: () => FAVORITE_URL,
            providesTags: (result) =>
                result
                    ? [
                          ...result.map((course) => ({
                              type: "Favorites",
                              id: course._id,
                          })),
                          { type: "Favorites", id: "LIST" },
                      ]
                    : [{ type: "Favorites", id: "LIST" }],
        }),

        checkFavorite: builder.query({
            query: (courseId) => `${FAVORITE_URL}/check/${courseId}`,
            providesTags: (result, error, courseId) => [
                { type: "Favorites", id: courseId },
            ],
        }),

        addToFavorites: builder.mutation({
            query: (courseId) => ({
                url: FAVORITE_URL,
                method: "POST",
                body: { courseId },
            }),
            invalidatesTags: (result, error, courseId) => [
                { type: "Favorites", id: "LIST" },
                { type: "Favorites", id: courseId },
            ],
        }),

        removeFromFavorites: builder.mutation({
            query: (courseId) => ({
                url: `${FAVORITE_URL}/${courseId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, courseId) => [
                { type: "Favorites", id: "LIST" },
                { type: "Favorites", id: courseId },
            ],
        }),
    }),
});

export const {
    useGetMyFavoritesQuery,
    useCheckFavoriteQuery,
    useAddToFavoritesMutation,
    useRemoveFromFavoritesMutation,
} = favoriteApiSlice;

