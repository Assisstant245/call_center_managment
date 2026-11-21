import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../helper/api";
import {
  CREATE_SKILL_API,
  GET_SKILLS_API,
} from "./constraint";

export const createSkillApi = createAsyncThunk(
  "create-skill",
  async (data: any, { rejectWithValue }) => {
    try {
      

      const response = await axios.post(
        CREATE_SKILL_API,
        data
      );

      

      return response.data;
    } catch (error: any) {
      console.error("Error in createSkillApi:", error);

      console.error(
        "Backend response:",
        error.response?.data
      );

      const message =
        error.response?.data?.message ||
        "Failed to create skill";

      return rejectWithValue(message);
    }
  }
);

export const getSkillsApi = createAsyncThunk(
  "get-skills",
  async (_, { rejectWithValue }) => {
    try {
      

      const response = await axios.get(
        GET_SKILLS_API
      );

      

      return response.data;
    } catch (error: any) {
      console.error(
        "Error in getSkillsApi:",
        error
      );

      console.error(
        "Backend response:",
        error.response?.data
      );

      const message =
        error.response?.data?.message ||
        "Failed to fetch skills";

      return rejectWithValue(message);
    }
  }
);