import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTodayStatus = createAsyncThunk(
  'attendance/fetchTodayStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance/today');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch clock status');
    }
  }
);

export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/clock-in');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Clock in failed');
    }
  }
);

export const clockOut = createAsyncThunk(
  'attendance/clockOut',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post('/attendance/clock-out');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Clock out failed');
    }
  }
);

export const fetchAttendanceRecords = createAsyncThunk(
  'attendance/fetchAttendanceRecords',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/attendance', { params });
      return response.data.attendance_records;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance records');
    }
  }
);

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState: {
    todayRecord: null,
    hasClockedIn: false,
    hasClockedOut: false,
    records: [],
    loading: false,
    clockingLoading: false,
    error: null,
  },
  reducers: {
    clearAttendanceError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodayStatus.fulfilled, (state, action) => {
        state.hasClockedIn = action.payload.has_clocked_in;
        state.hasClockedOut = action.payload.has_clocked_out;
        state.todayRecord = action.payload.attendance;
      })
      .addCase(clockIn.pending, (state) => {
        state.clockingLoading = true;
        state.error = null;
      })
      .addCase(clockIn.fulfilled, (state, action) => {
        state.clockingLoading = false;
        state.hasClockedIn = true;
        state.todayRecord = action.payload.attendance;
      })
      .addCase(clockIn.rejected, (state, action) => {
        state.clockingLoading = false;
        state.error = action.payload;
      })
      .addCase(clockOut.pending, (state) => {
        state.clockingLoading = true;
        state.error = null;
      })
      .addCase(clockOut.fulfilled, (state, action) => {
        state.clockingLoading = false;
        state.hasClockedOut = true;
        state.todayRecord = action.payload.attendance;
      })
      .addCase(clockOut.rejected, (state, action) => {
        state.clockingLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAttendanceRecords.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAttendanceRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAttendanceRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;
