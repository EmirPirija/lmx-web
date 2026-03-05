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
        className="!gap-6 border-slate-200 bg-white shadow-[0_40px_120px_-55px_rgba(2,8,23,0.85)] dark:border-slate-700 dark:bg-slate-950"
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
