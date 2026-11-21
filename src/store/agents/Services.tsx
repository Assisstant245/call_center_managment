
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  CREATE_AGENT_API,
  GET_AGENTS_API,
} from "./constraint";
import axios from "./../../helper/api";

// =========================
// CREATE AGENT
// =========================

export const createAgentApi = createAsyncThunk(
  "create-agent",
  async ({ data, onSuccess, onError }: any) => {
    try {
      

      const response = await axios.post(
        CREATE_AGENT_API,
        data
      );

      

      onSuccess?.(response.data);

      return response.data;
    } catch (error: any) {
      console.error("Error in createAgentApi:", error);

      console.error(
        "Backend response:",
        error.response?.data
      );

      console.error(
        "Backend status:",
        error.response?.status
      );

      onError?.(error);

      throw error;
    }
  }
);

// =========================
// GET ALL AGENTS
// =========================

export const getAgentsApi = createAsyncThunk(
  "get-agents",
  async (_, { rejectWithValue }) => {
    try {
      

      const response = await axios.get(
        GET_AGENTS_API
      );

      

      return response.data;
    } catch (error: any) {
      console.error(
        "Error in getAgentsApi:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      console.error(
        "Backend status:",
        error.response?.status
      );

      return rejectWithValue(
        error.response?.data ??
          "Failed to fetch agents"
      );
    }
  }
);
