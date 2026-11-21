import { createSlice } from "@reduxjs/toolkit";
import { getDashboardApi } from "./services";

interface DashboardState {
  getDashboardData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
}

const initialState: DashboardState = {
  getDashboardData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },
};

const dashboardSlice = createSlice({
  name: "dashboard",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      // =========================
      // GET DASHBOARD
      // =========================

      .addCase(
        getDashboardApi.pending,
        (state) => {
          state.getDashboardData.loading = true;
          state.getDashboardData.error = null;
        }
      )

      .addCase(
        getDashboardApi.fulfilled,
        (state, action) => {
          state.getDashboardData.loading = false;

          state.getDashboardData.data =
            action.payload?.data ||
            action.payload;

          state.getDashboardData.dataFetched = true;
        }
      )

      .addCase(
        getDashboardApi.rejected,
        (state, action) => {
          state.getDashboardData.loading = false;

          state.getDashboardData.error =
            (action.payload as string) ||
            action.error.message ||
            "Failed to fetch dashboard";
        }
      );
  },
});

export const dashboardReducer =
  dashboardSlice.reducer;