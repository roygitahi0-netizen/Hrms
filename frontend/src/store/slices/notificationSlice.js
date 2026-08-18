import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markNotificationsRead = createAsyncThunk(
  'notifications/markNotificationsRead',
  async (notificationId = null, { rejectWithValue }) => {
    try {
      await api.post('/notifications/mark-read', { notification_id: notificationId });
      return notificationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.list = action.payload.notifications;
        state.unreadCount = action.payload.unread_count;
      })
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        if (action.payload) {
          const item = state.list.find((n) => n.id === action.payload);
          if (item && !item.is_read) {
            item.is_read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        } else {
          state.list.forEach((n) => (n.is_read = true));
          state.unreadCount = 0;
        }
      });
  },
});

export default notificationSlice.reducer;
