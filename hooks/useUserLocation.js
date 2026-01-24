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

/**
 * useUserLocation - Hook za upravljanje lokacijom korisnika
 * 
 * Ovaj hook:
 * 1. Učitava korisnikovu sačuvanu lokaciju iz profila (localStorage + Redux)
 * 2. Omogućuje ažuriranje lokacije
 * 3. Konvertuje između različitih formata lokacije
 * 4. Omogućuje auto-popunjavanje lokacije za oglase
 */

const STORAGE_KEY = "user_bih_location";

export const useUserLocation = () => {
  const userData = useSelector(userSignUpData);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Učitaj sačuvanu lokaciju pri mount-u
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

  // Sačuvaj lokaciju u localStorage
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

  // Očisti lokaciju
  const clearLocation = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setUserLocation(null);
    } catch (error) {
      console.error("Error clearing location:", error);
    }
  }, []);

  // Konvertuj BiH lokaciju u format za API (ad-listing)
  const getLocationForAd = useCallback(() => {
    if (!userLocation?.municipalityId) return null;

    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    if (!fullLocation) return null;

    // Vrati u formatu koji očekuje addItemApi
    return {
      country: "Bosna i Hercegovina",
      state: fullLocation.region?.name || "",
      city: fullLocation.municipality?.name || "",
      address: userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted,
      lat: null, // BiH lokacije nemaju koordinate u ovom sistemu
      long: null,
      // Dodatni podaci za prikaz
      entityId: userLocation.entityId,
      regionId: userLocation.regionId,
      municipalityId: userLocation.municipalityId,
      formattedAddress: userLocation.address 
        ? `${userLocation.address}, ${fullLocation.formatted}`
        : fullLocation.formatted,
    };
  }, [userLocation]);

  // Provjeri da li korisnik ima sačuvanu lokaciju
  const hasLocation = Boolean(userLocation?.municipalityId);

  // Dohvati formatiranu adresu
  const getFormattedAddress = useCallback(() => {
    if (!userLocation?.municipalityId) return "";
    
    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    if (!fullLocation) return "";
    
    if (userLocation.address) {
      return `${userLocation.address}, ${fullLocation.formatted}`;
    }
    return fullLocation.formatted;
  }, [userLocation]);

  // Dohvati samo ime grada/općine
  const getCityName = useCallback(() => {
    if (!userLocation?.municipalityId) return "";
    
    const fullLocation = getFullLocationFromMunicipalityId(userLocation.municipalityId);
    return fullLocation?.municipality?.name || "";
  }, [userLocation]);

  // Dohvati puni opis lokacije
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

  // Konvertuj lokaciju iz API formata u BiH format (za edit listing)
  const convertApiLocationToBiH = useCallback((apiLocation) => {
    if (!apiLocation) return null;
    
    // Probaj naći matching općinu po imenu
    const cityName = apiLocation.city?.toLowerCase();
    if (!cityName) return null;

    // Pretraži sve općine
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
    getLocationSummary,
    convertApiLocationToBiH,
  };
};

/**
 * Konvertuj lokaciju iz API formata u BiH format
 * Koristi se kada učitavaš postojeći oglas koji ima country/state/city
 */
export const convertApiLocationToBiH = (apiLocation) => {
  if (!apiLocation) return null;
  
  // Probaj naći matching općinu po imenu
  const cityName = apiLocation.city?.toLowerCase();
  if (!cityName) return null;

  // Pretraži sve općine
  const { searchMunicipalities } = require("@/lib/bih-locations");
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
