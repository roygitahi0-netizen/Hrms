import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/departments');
      return response.data.departments;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/createDepartment',
  async (deptData, { rejectWithValue }) => {
    try {
      const response = await api.post('/departments', deptData);
      return response.data.department;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

export const fetchPositions = createAsyncThunk(
  'departments/fetchPositions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/departments/positions');
      return response.data.positions;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch positions');
    }
  }
);

export const createPosition = createAsyncThunk(
  'departments/createPosition',
  async (posData, { rejectWithValue }) => {
    try {
      const response = await api.post('/departments/positions', posData);
      return response.data.position;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create position');
    }
  }
);

const departmentSlice = createSlice({
  name: 'departments',
  initialState: {
    departments: [],
    positions: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDepartmentError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.push(action.payload);
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.positions = action.payload;
      })
      .addCase(createPosition.fulfilled, (state, action) => {
        state.positions.push(action.payload);
      });
  },
});

export const { clearDepartmentError } = departmentSlice.actions;
export default departmentSlice.reducer;
