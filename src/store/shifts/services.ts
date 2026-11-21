import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../helper/api";
import { CREATE_SHIFT_API } from "./constraint";
import { GET_SHIFTS_API } from "./constraint";


export const createShiftApi = createAsyncThunk(
  "create-shift",

  async (
    { data, onSuccess, onError }: any,
    { rejectWithValue }
  ) => {
    try {
      

      const response = await axios.post(
        CREATE_SHIFT_API,
        data
      );

      

      onSuccess?.(response.data);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error in createShiftApi:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      const message =
        error.response?.data?.message ||
        "Failed to create shift";

      onError?.(message);

      return rejectWithValue(message);
    }
  }
);
export const getShiftsApi = createAsyncThunk(
  "get-shifts",

  async (_, { rejectWithValue }) => {
    try {
      

      const response = await axios.get(
        GET_SHIFTS_API
      );

      

      return response.data;
    } catch (error: any) {
      console.error(
        "Error in getShiftsApi:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      const message =
        error.response?.data?.message ||
        "Failed to fetch shifts";

      return rejectWithValue(message);
    }
  }
);