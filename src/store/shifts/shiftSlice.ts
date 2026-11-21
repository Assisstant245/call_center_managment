
import { createSlice } from "@reduxjs/toolkit";
import { createShiftApi, getShiftsApi } from "./services";

interface ShiftState {
  createShiftData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };

  getShiftsData: {
    data: any[];
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
}

const initialState: ShiftState = {
  // Create Shift
  createShiftData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },

  // Get All Shifts
  getShiftsData: {
    data: [],
    loading: false,
    error: null,
    dataFetched: false,
  },
};

const shiftSlice = createSlice({
  name: "shifts",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    // =========================
    // CREATE SHIFT
    // =========================
    builder
      .addCase(createShiftApi.pending, (state) => {
        state.createShiftData.loading = true;
        state.createShiftData.error = null;
      })

      .addCase(createShiftApi.fulfilled, (state, action) => {
        state.createShiftData.loading = false;
        state.createShiftData.data = action.payload;
        state.createShiftData.dataFetched = true;
      })

      .addCase(createShiftApi.rejected, (state, action) => {
        state.createShiftData.loading = false;

        state.createShiftData.error =
          (action.payload as string) ||
          action.error.message ||
          "Something went wrong";
      });

    // =========================
    // GET ALL SHIFTS
    // =========================
    builder
      .addCase(getShiftsApi.pending, (state) => {
        state.getShiftsData.loading = true;
        state.getShiftsData.error = null;
      })

      .addCase(getShiftsApi.fulfilled, (state, action) => {
        state.getShiftsData.loading = false;

        // Backend response:
        // {
        //   status: "success",
        //   data: [...]
        // }

        state.getShiftsData.data =
          action.payload?.data || action.payload || [];

        state.getShiftsData.dataFetched = true;
      })

      .addCase(getShiftsApi.rejected, (state, action) => {
        state.getShiftsData.loading = false;

        state.getShiftsData.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to get shifts";
      });
  },
});

export const shiftReducer = shiftSlice.reducer;
