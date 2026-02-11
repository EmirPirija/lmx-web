"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getCityData } from "@/redux/reducer/locationSlice";
import { useState } from "react";
import { useSelector } from "react-redux";
import LocationSelector from "./LocationSelector";
import MapLocation from "./MapLocation";
import { getIsPaidApi } from "@/redux/reducer/settingSlice";

const LocationModal = ({
  IsLocationModalOpen,
  setIsLocationModalOpen,
  navigateOnSave = true,
  onLocationSaved = null,
}) => {
  const IsPaidApi = useSelector(getIsPaidApi);
  const [IsMapLocation, setIsMapLocation] = useState(IsPaidApi);
  const cityData = useSelector(getCityData);
  const [selectedCity, setSelectedCity] = useState(cityData || "");

  return (
    <Dialog open={IsLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="!gap-6"
      >
        {IsMapLocation ? (
          <MapLocation
            OnHide={() => setIsLocationModalOpen(false)}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            setIsMapLocation={setIsMapLocation}
            IsPaidApi={IsPaidApi}
            navigateOnSave={navigateOnSave}
            onLocationSaved={onLocationSaved}
          />
        ) : (
          <LocationSelector
            OnHide={() => setIsLocationModalOpen(false)}
            setSelectedCity={setSelectedCity}
            IsMapLocation={IsMapLocation}
            setIsMapLocation={setIsMapLocation}
            navigateOnSave={navigateOnSave}
            onLocationSaved={onLocationSaved}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
