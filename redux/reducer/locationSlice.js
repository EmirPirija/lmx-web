import { createSelector, createSlice } from "@reduxjs/toolkit";
import { dispatchWithStore } from "../store/storeRef";

const BIH_DEFAULT_CITY_DATA = {
  area: "",
  areaId: "",
  city: "",
  state: "",
  country: "Bosna i Hercegovina",
  lat: 43.8563,
  long: 18.4131,
  location_source: "hierarchy",
  cityId: null,
  municipalityId: null,
  formattedAddress: "Cijela Bosna i Hercegovina",
};

const isLocationPayloadEmpty = (value = {}) => {
  const data = value || {};
  return !(
    data.areaId ||
    data.area ||
    data.city ||
    data.state ||
    data.country ||
    data.formattedAddress
  );
};

const initialState = {
  cityData: BIH_DEFAULT_CITY_DATA,
  KilometerRange: 0,
  IsBrowserSupported: true,
};
export const locationSlice = createSlice({
  name: "Location",
  initialState,
  reducers: {
    setCityData: (location, action) => {
      location.cityData = action.payload.data;
    },
    setIsBrowserSupported: (location, action) => {
      location.IsBrowserSupported = action.payload;
    },
    setKilometerRange: (location, action) => {
      location.KilometerRange = action.payload;
    },
  },
});

export default locationSlice.reducer;
export const { setCityData, setIsBrowserSupported, setKilometerRange } =
  locationSlice.actions;

export const resetCityData = () => {
  dispatchWithStore(setCityData({ data: BIH_DEFAULT_CITY_DATA }));
};

// Action to store location
export const saveCity = (data) => {
  dispatchWithStore(setCityData({ data }));
};

export const getCityData = createSelector(
  (state) => state.Location,
  (Location) => {
    if (isLocationPayloadEmpty(Location?.cityData)) {
      return BIH_DEFAULT_CITY_DATA;
    }
    return Location.cityData;
  }
);
export const getKilometerRange = createSelector(
  (state) => state.Location,
  (Location) => Number(Location.KilometerRange)
);
export const getIsBrowserSupported = createSelector(
  (state) => state.Location,
  (Location) => Location.IsBrowserSupported
);
