"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { 
  getFullLocationFromMunicipalityId, 
  searchMunicipalities 
} from "@/lib/bih-locations";

/**
 * useUserLocation - Hook za upravljanje lokacijom korisnika
 */

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
        // Provjeri da li lokacija pripada trenutnom korisniku
        if (parsed.userId === userData?.id && parsed.location?.municipalityId) {
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
      if (userData?.id && location?.municipalityId) {
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
    if (!userLocation?.municipalityId) return null;

    try {
      const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
      if (!fullLocation) return null;

      const formattedAddr = userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted;

      return {
        country: "Bosna i Hercegovina",
        state: fullLocation.region?.name || "",
        city: fullLocation.municipality?.name || "",
        address: formattedAddr,
        lat: BIH_DEFAULT_COORDS.lat,
        long: BIH_DEFAULT_COORDS.long,
        entityId: userLocation.entityId,
        regionId: userLocation.regionId,
        municipalityId: userLocation.municipalityId,
        formattedAddress: formattedAddr,
        address_translated: formattedAddr,
      };
    } catch (error) {
      console.error("Error getting location for ad:", error);
      return null;
    }
  }, [userLocation]);

  // Provjeri da li korisnik ima sačuvanu lokaciju
  const hasLocation = Boolean(userLocation?.municipalityId);

  // Dohvati formatiranu adresu
  const getFormattedAddress = useCallback(() => {
    if (!userLocation?.municipalityId) return "";
    
    try {
      const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
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
    if (!userLocation?.municipalityId) return "";
    
    try {
      const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
      return fullLocation?.municipality?.name || "";
    } catch (error) {
      return "";
    }
  }, [userLocation]);

  // Konvertuj lokaciju iz API formata u BiH format (za edit listing)
  const convertApiLocationToBiH = useCallback((apiLocation) => {
    if (!apiLocation?.city) return null;
    
    try {
      const cityName = apiLocation.city.toLowerCase().trim();
      const results = searchMunicipalities(cityName);
      
      if (results.length > 0) {
        // Nađi najbolji match
        const exactMatch = results.find(r => r.name.toLowerCase() === cityName);
        const match = exactMatch || results[0];
        
        return {
          entityId: match.entityId,
          regionId: match.regionId,
          municipalityId: match.id,
          address: "",
          formattedAddress: `${match.name}, ${match.regionName}, ${match.entityName}, Bosna i Hercegovina`,
        };
      }
    } catch (error) {
      console.error("Error converting API location:", error);
    }
    
    return null;
  }, []);

  return {
    // State
    userLocation,
    isLoading,
    hasLocation,
    
    // Actions
    saveLocation,
    clearLocation,
    loadSavedLocation,
    
    // Helpers
    getLocationForAd,
    getFormattedAddress,
    getCityName,
    convertApiLocationToBiH,
  };
};

export default useUserLocation;
