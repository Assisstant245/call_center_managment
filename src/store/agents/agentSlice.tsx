
import { createSlice } from "@reduxjs/toolkit";
import { createAgentApi, getAgentsApi } from "./Services";

interface AgentState {
  createAgentData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };

  getAgentsData: {
    data: any[];
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
}

const initialState: AgentState = {
  createAgentData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },

  getAgentsData: {
    data: [],
    loading: false,
    error: null,
    dataFetched: false,
  },
};

const agentSlice = createSlice({
  name: "agents",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      // =========================
      // CREATE AGENT
      // =========================

      .addCase(createAgentApi.pending, (state) => {
        state.createAgentData.loading = true;
        state.createAgentData.error = null;
      })

      .addCase(createAgentApi.fulfilled, (state, action) => {
        state.createAgentData.loading = false;
        state.createAgentData.data = action.payload;
        state.createAgentData.dataFetched = true;
      })

      .addCase(createAgentApi.rejected, (state, action) => {
        state.createAgentData.loading = false;
        state.createAgentData.error =
          action.error.message ?? "Something went wrong";
      })

      // =========================
      // GET AGENTS
      // =========================

      .addCase(getAgentsApi.pending, (state) => {
        state.getAgentsData.loading = true;
        state.getAgentsData.error = null;
      })

      .addCase(getAgentsApi.fulfilled, (state, action) => {
        state.getAgentsData.loading = false;

        // If API returns an array
        if (Array.isArray(action.payload)) {
          state.getAgentsData.data = action.payload;
        }

        // If API returns { data: [...] }
        else if (Array.isArray(action.payload?.data)) {
          state.getAgentsData.data = action.payload.data;
        }

        else {
          state.getAgentsData.data = [];
        }

        state.getAgentsData.dataFetched = true;
      })

      .addCase(getAgentsApi.rejected, (state, action) => {
        state.getAgentsData.loading = false;
        state.getAgentsData.error =
          action.error.message ?? "Failed to fetch agents";
      });
  },
});

export const agentReducer = agentSlice.reducer;
