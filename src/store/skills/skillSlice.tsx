import { createSlice } from "@reduxjs/toolkit";

import {
  createSkillApi,
  getSkillsApi,
} from "./services";

interface SkillState {
  createSkillData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };

  getSkillsData: {
    data: any[];
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
}

const initialState: SkillState = {
  createSkillData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },

  getSkillsData: {
    data: [],
    loading: false,
    error: null,
    dataFetched: false,
  },
};

const skillSlice = createSlice({
  name: "skills",

  initialState,

  reducers: {},

  extraReducers: (builder) => {
    builder

      // =========================
      // CREATE SKILL
      // =========================

      .addCase(
        createSkillApi.pending,
        (state) => {
          state.createSkillData.loading = true;
          state.createSkillData.error = null;
        }
      )

      .addCase(
        createSkillApi.fulfilled,
        (state, action) => {
          state.createSkillData.loading = false;

          state.createSkillData.data =
            action.payload;

          state.createSkillData.dataFetched = true;
        }
      )

      .addCase(
        createSkillApi.rejected,
        (state, action) => {
          state.createSkillData.loading = false;

          state.createSkillData.error =
            (action.payload as string) ||
            action.error.message ||
            "Something went wrong";
        }
      )


      // =========================
      // GET SKILLS
      // =========================

      .addCase(
        getSkillsApi.pending,
        (state) => {
          state.getSkillsData.loading = true;
          state.getSkillsData.error = null;
        }
      )

      .addCase(
        getSkillsApi.fulfilled,
        (state, action) => {
          state.getSkillsData.loading = false;

          state.getSkillsData.data =
            Array.isArray(action.payload)
              ? action.payload
              : action.payload?.data || [];

          state.getSkillsData.dataFetched = true;
        }
      )

      .addCase(
        getSkillsApi.rejected,
        (state, action) => {
          state.getSkillsData.loading = false;

          state.getSkillsData.error =
            (action.payload as string) ||
            action.error.message ||
            "Failed to fetch skills";
        }
      );
  },
});

export const skillReducer =
  skillSlice.reducer;