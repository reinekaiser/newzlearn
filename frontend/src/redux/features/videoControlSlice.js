import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    seekTo: null,      // number (seconds)
    play: false,
    pause: false,
};

const videoControlSlice = createSlice({
    name: "videoControl",
    initialState,
    reducers: {
        seekVideo: (state, action) => {
            state.seekTo = action.payload; 
        },
        playVideo: (state) => {
            state.play = true;
            state.pause = false;
        },
        pauseVideo: (state) => {
            state.pause = true;
            state.play = false;
        },
        clearVideoCommand: (state) => {
            state.seekTo = null;
            state.play = false;
            state.pause = false;
        }
    }
});

export const {
    seekVideo,
    playVideo,
    pauseVideo,
    clearVideoCommand
} = videoControlSlice.actions;

export default videoControlSlice.reducer;