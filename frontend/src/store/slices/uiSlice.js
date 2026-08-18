import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    activeModal: null, // 'employee', 'department', 'leave', 'profile', null
    modalData: null,
    toast: null, // { id, message, type: 'success' | 'error' | 'info' | 'warning' }
  },
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    openModal(state, action) {
      state.activeModal = action.payload.type;
      state.modalData = action.payload.data || null;
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalData = null;
    },
    showToast(state, action) {
      state.toast = {
        id: Date.now(),
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    hideToast(state) {
      state.toast = null;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openModal,
  closeModal,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
