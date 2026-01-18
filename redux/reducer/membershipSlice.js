"use client";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userMembership: {
    data: null,
    loading: false,
    error: null,
  },
  membershipTiers: {
    data: null,
    loading: false,
    error: null,
  },
  upgradingMembership: {
    loading: false,
    error: null,
  },
};

const membershipSlice = createSlice({
  name: "membership",
  initialState,
  reducers: {
    // User Membership Status
    setUserMembershipLoading: (state, action) => {
      state.userMembership.loading = action.payload;
    },
    setUserMembership: (state, action) => {
      state.userMembership.data = action.payload;
      state.userMembership.loading = false;
      state.userMembership.error = null;
    },
    setUserMembershipError: (state, action) => {
      state.userMembership.error = action.payload;
      state.userMembership.loading = false;
    },

    // Membership Tiers (Pro, Shop packages)
    setMembershipTiersLoading: (state, action) => {
      state.membershipTiers.loading = action.payload;
    },
    setMembershipTiers: (state, action) => {
      state.membershipTiers.data = action.payload;
      state.membershipTiers.loading = false;
      state.membershipTiers.error = null;
    },
    setMembershipTiersError: (state, action) => {
      state.membershipTiers.error = action.payload;
      state.membershipTiers.loading = false;
    },

    // Upgrading Membership
    setUpgradingMembershipLoading: (state, action) => {
      state.upgradingMembership.loading = action.payload;
    },
    setUpgradingMembershipError: (state, action) => {
      state.upgradingMembership.error = action.payload;
      state.upgradingMembership.loading = false;
    },
    clearUpgradingError: (state) => {
      state.upgradingMembership.error = null;
      state.upgradingMembership.loading = false;
    },

    // Clear all membership data
    clearMembershipData: (state) => {
      state.userMembership = initialState.userMembership;
      state.membershipTiers = initialState.membershipTiers;
      state.upgradingMembership = initialState.upgradingMembership;
    },
  },
});

export const {
  setUserMembershipLoading,
  setUserMembership,
  setUserMembershipError,
  setMembershipTiersLoading,
  setMembershipTiers,
  setMembershipTiersError,
  setUpgradingMembershipLoading,
  setUpgradingMembershipError,
  clearUpgradingError,
  clearMembershipData,
} = membershipSlice.actions;

export default membershipSlice.reducer;
