import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import employeeReducer from './slices/employeeSlice';
import departmentReducer from './slices/departmentSlice';
import leaveReducer from './slices/leaveSlice';
import attendanceReducer from './slices/attendanceSlice';
import notificationReducer from './slices/notificationSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employees: employeeReducer,
    departments: departmentReducer,
    leaves: leaveReducer,
    attendance: attendanceReducer,
    notifications: notificationReducer,
    ui: uiReducer,
  },
});

export default store;
