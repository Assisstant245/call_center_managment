import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../helper/api";
import { GET_DASHBOARD_API } from "./constraint";

export const getDashboardApi = createAsyncThunk(
  "get-dashboard",
  async (
    {
      skill,
      date,
      channel,
    }: {
      skill?: string;
      date?: string;
      channel?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();

      if (skill) {
        params.append("skill", skill);
      }

      if (date) {
        params.append("date", date);
      }

      if (channel) {
        params.append("channel", channel);
      }

      const queryString = params.toString();

      const response = await axios.get(
        queryString
          ? `${GET_DASHBOARD_API}?${queryString}`
          : GET_DASHBOARD_API
      );

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to fetch dashboard"
      );
    }
  }
);