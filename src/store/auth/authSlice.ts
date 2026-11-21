
import { createSlice } from "@reduxjs/toolkit";
import { signupApi, loginApi } from "./services";

interface AuthState {
  signupData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };

  loginData: {
    data: any;
    loading: boolean;
    error: string | null;
    dataFetched: boolean;
  };
}

const initialState: AuthState = {
  signupData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },

  loginData: {
    data: null,
    loading: false,
    error: null,
    dataFetched: false,
  },
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    // We can add logout here later
  },

  extraReducers: (builder) => {
    builder

      // =========================
      // SIGNUP - PENDING
      // =========================
      .addCase(signupApi.pending, (state) => {
        state.signupData.loading = true;
        state.signupData.error = null;
      })

      // =========================
      // SIGNUP - SUCCESS
      // =========================
      .addCase(signupApi.fulfilled, (state, action) => {
        state.signupData.loading = false;
        state.signupData.data = action.payload;
        state.signupData.dataFetched = true;
      })

      // =========================
      // SIGNUP - ERROR
      // =========================
      .addCase(signupApi.rejected, (state, action) => {
        state.signupData.loading = false;
        state.signupData.error =
          action.payload?.toString() ||
          action.error.message ||
          "Something went wrong";
      })

      // =========================
      // LOGIN - PENDING
      // =========================
      .addCase(loginApi.pending, (state) => {
        state.loginData.loading = true;
        state.loginData.error = null;
      })

      // =========================
      // LOGIN - SUCCESS
      // =========================
      .addCase(loginApi.fulfilled, (state, action) => {
        state.loginData.loading = false;
        state.loginData.data = action.payload;
        state.loginData.dataFetched = true;
      })

      // =========================
      // LOGIN - ERROR
      // =========================
      .addCase(loginApi.rejected, (state, action) => {
        state.loginData.loading = false;
        state.loginData.error =
          action.payload?.toString() ||
          action.error.message ||
          "Login failed";
      });
  },
});

export const authReducer = authSlice.reducer;
