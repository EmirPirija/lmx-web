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
 
// Default koordinate za BiH (Sarajevo)
const BIH_DEFAULT_COORDS = {
  lat: 43.8563,
  long: 18.4131,
};
 
export const useUserLocation = () => {
  const userData = useSelector(userSignUpData);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
 
  // Učitaj sačuvanu lokaciju pri mount-u i kad se promijeni user
  useEffect(() => {
    loadSavedLocation();
  }, [userData?.id]);
 
  // Učitaj lokaciju iz localStorage
  const loadSavedLocation = useCallback(() => {
    setIsLoading(true);
    try {
      const savedLocation = localStorage.getItem(STORAGE_KEY);
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed.userId === userData?.id && isLocationComplete(parsed.location)) {
          setUserLocation(parsed.location);
        } else {
          setUserLocation(null);
        }
      } else {
        setUserLocation(null);
      }
    } catch (error) {
      console.error("Error loading saved location:", error);
      setUserLocation(null);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id]);
 
  // Sačuvaj lokaciju u localStorage
  const saveLocation = useCallback((location) => {
    try {
      if (userData?.id && isLocationComplete(location)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          userId: userData.id,
          location,
          savedAt: new Date().toISOString(),
        }));
        setUserLocation(location);
      }
    } catch (error) {
      console.error("Error saving location:", error);
    }
  }, [userData?.id]);
 
  // Očisti lokaciju
  const clearLocation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUserLocation(null);
    } catch (error) {
      console.error("Error clearing location:", error);
    }
  }, []);
 
  // Konvertuj BiH lokaciju u format za API
  const getLocationForAd = useCallback(() => {
    if (!isLocationComplete(userLocation)) return null;

    try {
      const fullLocation =
        resolveLocationSelection(userLocation) ||
        getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
      if (!fullLocation?.city) return null;

      const formattedAddr = userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted;

      return {
        country: "Bosna i Hercegovina",
        state: fullLocation.municipality?.name || "",
        city: fullLocation.city?.name || "",
        address: formattedAddr,
        lat: BIH_DEFAULT_COORDS.lat,
        long: BIH_DEFAULT_COORDS.long,
        entityId: "bih",
        regionId: fullLocation.city?.id || userLocation.regionId || userLocation.cityId || null,
        cityId: fullLocation.city?.id || userLocation.cityId || userLocation.regionId || null,
        municipalityId: fullLocation.municipality?.id || null,
        formattedAddress: formattedAddr,
        address_translated: formattedAddr,
      };
    } catch (error) {
      console.error("Error getting location for ad:", error);
      return null;
    }
  }, [userLocation]);
 
  // Provjeri da li korisnik ima sačuvanu lokaciju
  const hasLocation = isLocationComplete(userLocation);

  // Dohvati formatiranu adresu
  const getFormattedAddress = useCallback(() => {
    if (!isLocationComplete(userLocation)) return "";
    
    try {
      const fullLocation =
        resolveLocationSelection(userLocation) ||
        getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
      if (!fullLocation) return "";
      
      if (userLocation.address) {
        return `${userLocation.address}, ${fullLocation.formatted}`;
      }
      return fullLocation.formatted;
    } catch (error) {
      return "";
    }
  }, [userLocation]);
 
  // Dohvati samo ime grada/općine
  const getCityName = useCallback(() => {
    if (!isLocationComplete(userLocation)) return "";
    
    try {
      const fullLocation =
        resolveLocationSelection(userLocation) ||
        getFullLocationFromMunicipalityId(userLocation?.municipalityId, userLocation?.cityId);
      return fullLocation?.city?.name || "";
    } catch (error) {
      return "";
    }
  }, [userLocation]);
 
  // Konvertuj lokaciju iz API formata u BiH format
  const convertApiLocationToBiH = useCallback((apiLocation) => {
    if (!apiLocation?.city) return null;
    
    try {
      const cityName = String(apiLocation.city || "").trim().toLowerCase();
      const municipalityName = String(apiLocation.state || "").trim().toLowerCase();
      const query = [cityName, municipalityName].filter(Boolean).join(" ");
      const results = searchLocations(query || cityName);

      if (!results.length) return null;

      const exactCityAndMunicipality = results.find((item) => {
        const sameCity = String(item.cityName || "").trim().toLowerCase() === cityName;
        const sameMunicipality =
          municipalityName &&
          String(item.municipalityName || "").trim().toLowerCase() === municipalityName;
        return sameCity && (!municipalityName || sameMunicipality);
      });

      const exactCity = results.find(
        (item) => String(item.cityName || "").trim().toLowerCase() === cityName
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
    } catch (error) {
      console.error("Error converting API location:", error);
    }
    
    return null;
  }, []);
 
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
    convertApiLocationToBiH,
  };
};
 
export default useUserLocation;
