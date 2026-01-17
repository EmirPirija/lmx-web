"use client";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userBadges: {
    data: null,
    loading: false,
    error: null,
  },
  userPoints: {
    data: null,
    loading: false,
    error: null,
  },
  leaderboard: {
    data: null,
    loading: false,
    error: null,
    filter: "weekly", // weekly, monthly, all-time
  },
  allBadges: {
    data: null,
    loading: false,
    error: null,
  },
  pointsHistory: {
    data: null,
    loading: false,
    error: null,
  },
};

const gamificationSlice = createSlice({
  name: "gamification",
  initialState,
  reducers: {
    // User Badges
    setUserBadgesLoading: (state, action) => {
      state.userBadges.loading = action.payload;
    },
    setUserBadges: (state, action) => {
      state.userBadges.data = action.payload;
      state.userBadges.loading = false;
      state.userBadges.error = null;
    },
    setUserBadgesError: (state, action) => {
      state.userBadges.error = action.payload;
      state.userBadges.loading = false;
    },

    // User Points
    setUserPointsLoading: (state, action) => {
      state.userPoints.loading = action.payload;
    },
    setUserPoints: (state, action) => {
      state.userPoints.data = action.payload;
      state.userPoints.loading = false;
      state.userPoints.error = null;
    },
    setUserPointsError: (state, action) => {
      state.userPoints.error = action.payload;
      state.userPoints.loading = false;
    },
    incrementUserPoints: (state, action) => {
      if (state.userPoints.data) {
        state.userPoints.data.total_points += action.payload;
      }
    },

    // Leaderboard
    setLeaderboardLoading: (state, action) => {
      state.leaderboard.loading = action.payload;
    },
    setLeaderboard: (state, action) => {
      state.leaderboard.data = action.payload;
      state.leaderboard.loading = false;
      state.leaderboard.error = null;
    },
    setLeaderboardError: (state, action) => {
      state.leaderboard.error = action.payload;
      state.leaderboard.loading = false;
    },
    setLeaderboardFilter: (state, action) => {
      state.leaderboard.filter = action.payload;
    },

    // All Badges (for badge catalog)
    setAllBadgesLoading: (state, action) => {
      state.allBadges.loading = action.payload;
    },
    setAllBadges: (state, action) => {
      state.allBadges.data = action.payload;
      state.allBadges.loading = false;
      state.allBadges.error = null;
    },
    setAllBadgesError: (state, action) => {
      state.allBadges.error = action.payload;
      state.allBadges.loading = false;
    },

    // Points History
    setPointsHistoryLoading: (state, action) => {
      state.pointsHistory.loading = action.payload;
    },
    setPointsHistory: (state, action) => {
      state.pointsHistory.data = action.payload;
      state.pointsHistory.loading = false;
      state.pointsHistory.error = null;
    },
    setPointsHistoryError: (state, action) => {
      state.pointsHistory.error = action.payload;
      state.pointsHistory.loading = false;
    },

    // Add new badge to user badges
    addUserBadge: (state, action) => {
      if (state.userBadges.data) {
        state.userBadges.data.badges.push(action.payload);
      }
    },

    // Clear all gamification data
    clearGamificationData: (state) => {
      state.userBadges = initialState.userBadges;
      state.userPoints = initialState.userPoints;
      state.leaderboard = initialState.leaderboard;
      state.pointsHistory = initialState.pointsHistory;
    },
  },
});

export const {
  setUserBadgesLoading,
  setUserBadges,
  setUserBadgesError,
  setUserPointsLoading,
  setUserPoints,
  setUserPointsError,
  incrementUserPoints,
  setLeaderboardLoading,
  setLeaderboard,
  setLeaderboardError,
  setLeaderboardFilter,
  setAllBadgesLoading,
  setAllBadges,
  setAllBadgesError,
  setPointsHistoryLoading,
  setPointsHistory,
  setPointsHistoryError,
  addUserBadge,
  clearGamificationData,
} = gamificationSlice.actions;

export default gamificationSlice.reducer;
