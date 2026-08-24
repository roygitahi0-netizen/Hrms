import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const storedToken = localStorage.getItem('hrms_token');
const storedUser = localStorage.getItem('hrms_user')
  ? JSON.parse(localStorage.getItem('hrms_user'))
  : null;

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('hrms_token', token);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      if (!error.response) {
        return rejectWithValue('Network Error: Unable to connect to backend server. Please verify VITE_API_URL environment variable on Vercel.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (registerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', registerData);
      const { token, user } = response.data;
      localStorage.setItem('hrms_token', token);
      localStorage.setItem('hrms_user', JSON.stringify(user));
      return { token, user };
    } catch (error) {
      if (!error.response) {
        return rejectWithValue('Network Error: Unable to connect to backend server. Please verify VITE_API_URL environment variable on Vercel.');
      }
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed. Please check your details.'
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const user = response.data.user;
      localStorage.setItem('hrms_user', JSON.stringify(user));
      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Session expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: storedToken,
    user: storedUser,
    isAuthenticated: !!storedToken,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    setEmployeeData(state, action) {
      if (state.user) {
        state.user.employee = action.payload;
        localStorage.setItem('hrms_user', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch me
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        localStorage.removeItem('hrms_token');
        localStorage.removeItem('hrms_user');
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearAuthError, setEmployeeData } = authSlice.actions;
export default authSlice.reducer;
