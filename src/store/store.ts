import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { agentReducer } from './agents/agentSlice';
import { skillReducer } from './skills/skillSlice';
import { shiftReducer } from './shifts/shiftSlice';
import { dashboardReducer } from './home/homeSlice'; // Import the dashboard reducer
import { authReducer } from './auth/authSlice'; // Import the auth reducer
const store = configureStore({
  reducer: {
    
    agents: agentReducer,
    skills: skillReducer,
    shifts: shiftReducer,
    dashboard: dashboardReducer, // Assuming you have a dashboardReducer, replace with the actual reducer
    auth: authReducer, // Assuming you have an authReducer, replace with the actual reducer
  }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export default store;
