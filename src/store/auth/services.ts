import { createAsyncThunk } from "@reduxjs/toolkit";
import { LOGIN_API, SIGNUP_API } from "./constraint";
import axios from "../../helper/api";
import { saveSession } from "../../helper/session";

export const signupApi = createAsyncThunk(
  "auth/signup",

  async (
    {
      data,
      onSuccess,
      onError,
    }: any,
    { rejectWithValue }
  ) => {
    try {
      

      const response = await axios.post(
        SIGNUP_API,
        data
      );

      

      onSuccess?.(response.data);

      return response.data;
    } catch (error: any) {
      console.error(
        "Error in signupApi:",
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

      onError?.(
        error.response?.data?.message ||
          "Signup failed"
      );

      return rejectWithValue(
        error.response?.data?.message ||
          "Signup failed"
      );
    }
  }
);

export const loginApi = createAsyncThunk(
  "auth/login",

  async (
    {
      data,
      onSuccess,
      onError,
    }: any,
    { rejectWithValue }
  ) => {
    try {
      

      const response = await axios.post(
        LOGIN_API,
        data
      );

      

      if (response.data?.token && response.data?.user) {
        saveSession(response.data.token, response.data.user);
      }

      // ==========================================
      // SUCCESS CALLBACK
      // ==========================================

      onSuccess?.(response.data);

      return response.data;

    } catch (error: any) {
      console.error(
        "Error in loginApi:",
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

      const message =
        error.response?.data?.message ||
        "Login failed";

      onError?.(message);

      return rejectWithValue(message);
    }
  }
);
