"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { 
  getFullLocationFromMunicipalityId, 
  isLocationComplete,
  resolveLocationSelection,
  searchLocations,
} from "@/lib/bih-locations";
 
const STORAGE_KEY = "user_bih_location";
 
export const useUserLocation = () => {
  const userData = useSelector(userSignUpData);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {
    loadSavedLocation();
  }, [userData?.id]);
 
  const loadSavedLocation = useCallback(() => {
    setIsLoading(true);
    try {
      const savedLocation = localStorage.getItem(STORAGE_KEY);
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed.userId === userData?.id) {
          setUserLocation(parsed.location);
        }
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id]);
 
  const saveLocation = useCallback((location) => {
    try {
      if (userData?.id) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          userId: userData.id,
          location,
          savedAt: new Date().toISOString(),
        }));
      }
      setUserLocation(location);
    } catch (error) {
      console.error("Error saving location:", error);
    }
  }, [userData?.id]);
 
  const clearLocation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUserLocation(null);
    } catch (error) {
      console.error("Error clearing location:", error);
    }
  }, []);
 
  const getLocationForAd = useCallback(() => {
    if (!isLocationComplete(userLocation)) return null;
 
    const fullLocation =
      resolveLocationSelection(userLocation) ||
      getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
    if (!fullLocation?.city) return null;
 
    return {
      country: "Bosna i Hercegovina",
      state: fullLocation.municipality?.name || "",
      city: fullLocation.city?.name || "",
      address: userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted,
      lat: null,
      long: null,
      entityId: "bih",
      regionId: fullLocation.city?.id || userLocation.regionId || userLocation.cityId || null,
      cityId: fullLocation.city?.id || userLocation.cityId || userLocation.regionId || null,
      municipalityId: fullLocation.municipality?.id || null,
      formattedAddress: userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted,
    };
  }, [userLocation]);
 
  const hasLocation = isLocationComplete(userLocation);
 
  const getFormattedAddress = useCallback(() => {
    if (!isLocationComplete(userLocation)) return "";
    
    const fullLocation =
      resolveLocationSelection(userLocation) ||
      getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
    if (!fullLocation) return "";
    
    if (userLocation.address) {
      return `${userLocation.address}, ${fullLocation.formatted}`;
    }
    return fullLocation.formatted;
  }, [userLocation]);
 
  const getCityName = useCallback(() => {
    if (!isLocationComplete(userLocation)) return "";
    
    const fullLocation =
      resolveLocationSelection(userLocation) ||
      getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
    return fullLocation?.city?.name || "";
  }, [userLocation]);
 
  const getLocationSummary = useCallback(() => {
    if (!isLocationComplete(userLocation)) return null;
    
    const fullLocation =
      resolveLocationSelection(userLocation) ||
      getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
    if (!fullLocation) return null;
 
    return {
      city: fullLocation.city?.name,
      region: fullLocation.municipality?.name || "",
      entity: fullLocation.entity?.shortName || fullLocation.entity?.name,
      country: "Bosna i Hercegovina",
      type: fullLocation.municipality?.type || "grad",
      formatted: fullLocation.formatted,
    };
  }, [userLocation]);
 
  return {
    userLocation,
    isLoading,
    hasLocation,
    saveLocation,
    clearLocation,
    loadSavedLocation,
    getLocationForAd,
    getFormattedAddress,
    getCityName,
    getLocationSummary,
  };
};
 
export const convertApiLocationToBiH = (apiLocation) => {
  if (!apiLocation) return null;
  
  const cityName = String(apiLocation.city || "").toLowerCase().trim();
  const municipalityName = String(apiLocation.state || "").toLowerCase().trim();
  if (!cityName) return null;
 
  const query = [cityName, municipalityName].filter(Boolean).join(" ");
  const results = searchLocations(query || cityName);
  
  if (results.length > 0) {
    const exactCityAndMunicipality = results.find((item) => {
      const sameCity = String(item.cityName || "").toLowerCase().trim() === cityName;
      const sameMunicipality =
        municipalityName &&
        String(item.municipalityName || "").toLowerCase().trim() === municipalityName;
      return sameCity && (!municipalityName || sameMunicipality);
    });
    const exactCity = results.find(
      (item) => String(item.cityName || "").toLowerCase().trim() === cityName
    );
    const match = exactCityAndMunicipality || exactCity || results[0];
    return {
      entityId: "bih",
      regionId: match.cityId,
      cityId: match.cityId,
      municipalityId: match.municipalityId || null,
      address: "",
      formattedAddress: match.formatted,
    };
  }
  
  return null;
};
 
export default useUserLocation;
