import { createSelector, createSlice } from "@reduxjs/toolkit";

const initialState = {
  data: null,
  etag: null,
  lastFetchedAt: 0,
  error: null,
};

const runtimeConfigSlice = createSlice({
  name: "RuntimeConfig",
  initialState,
  reducers: {
    runtimeConfigSuccess: (state, action) => {
      state.data = action.payload?.data || null;
      state.etag = action.payload?.etag || null;
      state.lastFetchedAt = Number(action.payload?.fetchedAt || Date.now());
      state.error = null;
    },
    runtimeConfigNotModified: (state, action) => {
      if (action.payload?.etag) {
        state.etag = action.payload.etag;
      }
      state.lastFetchedAt = Number(action.payload?.fetchedAt || Date.now());
      state.error = null;
    },
    runtimeConfigFailed: (state, action) => {
      state.error = action.payload?.error || "runtime_config_fetch_failed";
      state.lastFetchedAt = Number(action.payload?.fetchedAt || Date.now());
    },
    runtimeConfigReset: () => ({ ...initialState }),
  },
});

export const {
  runtimeConfigSuccess,
  runtimeConfigNotModified,
  runtimeConfigFailed,
  runtimeConfigReset,
} = runtimeConfigSlice.actions;

export default runtimeConfigSlice.reducer;

export const runtimeConfigState = (state) => state.RuntimeConfig;

export const runtimeConfigData = createSelector(
  runtimeConfigState,
  (runtime) => runtime?.data || null,
);

export const runtimeConfigEtag = createSelector(
  runtimeConfigState,
  (runtime) => runtime?.etag || null,
);

export const runtimeMaintenanceState = createSelector(
  runtimeConfigData,
  (runtimeData) => runtimeData?.maintenance || null,
);

export const runtimeAnnouncements = createSelector(
  runtimeConfigData,
  (runtimeData) =>
    Array.isArray(runtimeData?.announcements) ? runtimeData.announcements : [],
);

export const runtimeServices = createSelector(
  runtimeConfigData,
  (runtimeData) =>
    runtimeData?.services && typeof runtimeData.services === "object"
      ? runtimeData.services
      : {},
);

export const runtimePromoBanners = createSelector(
  runtimeConfigData,
  (runtimeData) =>
    Array.isArray(runtimeData?.promo_banners) ? runtimeData.promo_banners : [],
);

export const runtimeAdControls = createSelector(
  runtimeConfigData,
  (runtimeData) =>
    runtimeData?.ad_controls && typeof runtimeData.ad_controls === "object"
      ? runtimeData.ad_controls
      : {},
);
