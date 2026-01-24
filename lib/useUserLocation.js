"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { 
  getFullLocationFromMunicipalityId, 
  formatBiHAddress, 
  BIH_COUNTRY_ISO2,
  searchMunicipalities 
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
    if (!userLocation?.municipalityId) return null;
 
    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    if (!fullLocation) return null;
 
    return {
      country: "Bosna i Hercegovina",
      state: fullLocation.region?.name || "",
      city: fullLocation.municipality?.name || "",
      address: userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted,
      lat: null,
      long: null,
      entityId: userLocation.entityId,
      regionId: userLocation.regionId,
      municipalityId: userLocation.municipalityId,
      formattedAddress: userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted,
    };
  }, [userLocation]);
 
  const hasLocation = Boolean(userLocation?.municipalityId);
 
  const getFormattedAddress = useCallback(() => {
    if (!userLocation?.municipalityId) return "";
    
    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    if (!fullLocation) return "";
    
    if (userLocation.address) {
      return `${userLocation.address}, ${fullLocation.formatted}`;
    }
    return fullLocation.formatted;
  }, [userLocation]);
 
  const getCityName = useCallback(() => {
    if (!userLocation?.municipalityId) return "";
    
    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    return fullLocation?.municipality?.name || "";
  }, [userLocation]);
 
  const getLocationSummary = useCallback(() => {
    if (!userLocation?.municipalityId) return null;
    
    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    if (!fullLocation) return null;
 
    return {
      city: fullLocation.municipality?.name,
      region: fullLocation.region?.name,
      entity: fullLocation.entity?.shortName || fullLocation.entity?.name,
      country: "Bosna i Hercegovina",
      type: fullLocation.municipality?.type,
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
  
  const cityName = apiLocation.city?.toLowerCase();
  if (!cityName) return null;
 
  const results = searchMunicipalities(cityName);
  
  if (results.length > 0) {
    const match = results[0];
    return {
      entityId: match.entityId,
      regionId: match.regionId,
      municipalityId: match.id,
      address: "",
      formattedAddress: `${match.name}, ${match.regionName}, ${match.entityName}, Bosna i Hercegovina`,
    };
  }
  
  return null;
};
 
export default useUserLocation;