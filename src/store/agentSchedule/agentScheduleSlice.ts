import { createSlice } from "@reduxjs/toolkit";

interface AgentScheduleState {
  getScheduleAgentData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
}

const initialState: AgentScheduleState = {
  getScheduleAgentData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },
};

const agentScheduleSlice = createSlice({
  name: "agentSchedules",

  initialState,

  reducers: {},
});

export const agentScheduleReducer =
  agentScheduleSlice.reducer;