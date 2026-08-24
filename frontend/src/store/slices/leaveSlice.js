import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLeaveTypes = createAsyncThunk(
  'leaves/fetchLeaveTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/types');
      return response.data.leave_types;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave types');
    }
  }
);

export const fetchLeaveBalances = createAsyncThunk(
  'leaves/fetchLeaveBalances',
  async (employeeId = null, { rejectWithValue }) => {
    try {
      const params = employeeId ? { employee_id: employeeId } : {};
      const response = await api.get('/leaves/balances', { params });
      return response.data.balances;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave balances');
    }
  }
);

export const fetchLeaveRequests = createAsyncThunk(
  'leaves/fetchLeaveRequests',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves', { params });
      return response.data.leave_requests;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave requests');
    }
  }
);

export const submitLeaveRequest = createAsyncThunk(
  'leaves/submitLeaveRequest',
  async (leaveData, { rejectWithValue }) => {
    try {
      const response = await api.post('/leaves', leaveData);
      return response.data.leave_request;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit leave request');
    }
  }
);

export const updateLeaveStatus = createAsyncThunk(
  'leaves/updateLeaveStatus',
  async ({ id, status, comment }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/${id}/status`, { status, comment });
      return response.data.leave_request;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave status');
    }
  }
);

export const createLeaveType = createAsyncThunk(
  'leaves/createLeaveType',
  async (typeData, { rejectWithValue }) => {
    try {
      const response = await api.post('/leaves/types', typeData);
      return response.data.leave_type;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create leave type');
    }
  }
);

export const updateLeaveType = createAsyncThunk(
  'leaves/updateLeaveType',
  async ({ id, ...typeData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/types/${id}`, typeData);
      return response.data.leave_type;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave type');
    }
  }
);

export const deleteLeaveType = createAsyncThunk(
  'leaves/deleteLeaveType',
  async (payload, { rejectWithValue }) => {
    try {
      const id = typeof payload === 'object' ? payload.id : payload;
      const force = typeof payload === 'object' ? payload.force : false;
      const url = force ? `/leaves/types/${id}?force=true` : `/leaves/types/${id}`;
      await api.delete(url);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete leave type');
    }
  }
);

const leaveSlice = createSlice({
  name: 'leaves',
  initialState: {
    types: [],
    balances: [],
    requests: [],
    loading: false,
    error: null,
    statusFilter: 'ALL',
  },
  reducers: {
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    clearLeaveError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.types = action.payload;
      })
      .addCase(fetchLeaveBalances.fulfilled, (state, action) => {
        state.balances = action.payload;
      })
      .addCase(fetchLeaveRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchLeaveRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitLeaveRequest.fulfilled, (state, action) => {
        state.requests.unshift(action.payload);
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const index = state.requests.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(createLeaveType.fulfilled, (state, action) => {
        state.types.push(action.payload);
      })
      .addCase(updateLeaveType.fulfilled, (state, action) => {
        const index = state.types.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.types[index] = action.payload;
        }
      })
      .addCase(deleteLeaveType.fulfilled, (state, action) => {
        state.types = state.types.filter((t) => t.id !== action.payload);
      });
  },
});

export const { setStatusFilter, clearLeaveError } = leaveSlice.actions;
export default leaveSlice.reducer;

