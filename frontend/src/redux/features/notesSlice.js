import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notes: [],
  isLoading: false,
  error: null,
  isModalOpen: false,
  isNotesPanelOpen: false,
  currentTimestamp: 0,
  currentItemId: null,
  currentCourseId: null,
  editingNote: null,
};

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    // Modal actions
    openAddNoteModal: (state, action) => {
      state.isModalOpen = true;
      state.currentTimestamp = action.payload.timestamp;
      state.currentItemId = action.payload.itemId;
      state.currentCourseId = action.payload.courseId;
      state.editingNote = null;
    },
    openEditNoteModal: (state, action) => {
      state.isModalOpen = true;
      state.editingNote = action.payload;
      state.currentTimestamp = action.payload.timestamp;
      state.currentItemId = action.payload.itemId;
      state.currentCourseId = action.payload.courseId;
    },
    closeNoteModal: (state) => {
      state.isModalOpen = false;
      state.editingNote = null;
    },
    
    // Notes panel actions
    openNotesPanel: (state) => {
      state.isNotesPanelOpen = true;
    },
    closeNotesPanel: (state) => {
      state.isNotesPanelOpen = false;
    },
    
    // Notes data actions
    setNotes: (state, action) => {
      state.notes = action.payload;
    },
    addNote: (state, action) => {
      state.notes.unshift(action.payload);
    },
    updateNote: (state, action) => {
      const index = state.notes.findIndex(note => note._id === action.payload._id);
      if (index !== -1) {
        state.notes[index] = action.payload;
      }
    },
    deleteNote: (state, action) => {
      state.notes = state.notes.filter(note => note._id !== action.payload);
    },
    
    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  openAddNoteModal,
  openEditNoteModal,
  closeNoteModal,
  openNotesPanel,
  closeNotesPanel,
  setNotes,
  addNote,
  updateNote,
  deleteNote,
  setLoading,
  setError,
} = notesSlice.actions;

export default notesSlice.reducer;

