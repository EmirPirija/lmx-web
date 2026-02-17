import { useSelector } from "react-redux";
import {
  getDefaultLatitude,
  getDefaultLongitude,
} from "@/redux/reducer/settingSlice";
import { getCityData } from "@/redux/reducer/locationSlice";
import { useEffect, useRef } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLeafletTileTheme } from "@/hooks/useLeafletTileTheme";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const GetLocationWithMap = ({ position, getLocationWithMap, KmRange, locationLabel = "" }) => {
  const latitude = useSelector(getDefaultLatitude);
  const longitude = useSelector(getDefaultLongitude);
  const globalPos = useSelector(getCityData);
  const mapRef = useRef();
  const tileTheme = useLeafletTileTheme();

  const placeHolderPos = {
    lat: globalPos?.lat,
    lng: globalPos?.long,
  };

  const markerLatLong =
    position?.lat && position?.lng ? position : placeHolderPos;
  const displayLat = markerLatLong?.lat || latitude;
  const displayLng = markerLatLong?.lng || longitude;
  const hasPrecisePoint =
    Number.isFinite(Number(markerLatLong?.lat)) &&
    Number.isFinite(Number(markerLatLong?.lng));
  const radiusLabel = KmRange ? `${KmRange} km` : "Bez radijusa";
  useEffect(() => {
    if (mapRef.current && markerLatLong.lat && markerLatLong.lng) {
      mapRef.current.flyTo(
        [markerLatLong.lat, markerLatLong.lng],
        mapRef.current.getZoom()
      );
    }
  }, [markerLatLong?.lat, markerLatLong?.lng]);

  const containerStyle = {
    width: "100%",
    height: "300px",
    borderRadius: "4px",
  };

  const handleMapClick = (latlng) => {
    if (getLocationWithMap) {
      getLocationWithMap({
        lat: latlng.lat,
        lng: latlng.lng,
      });
    }
  };

  return (
    <div className="relative isolate z-0 lmx-location-map">
      <MapContainer
        className="z-0"
        style={containerStyle}
        center={[displayLat, displayLng]}
        zoom={6}
        ref={mapRef}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution={tileTheme.attribution}
          url={tileTheme.url}
          subdomains={tileTheme.subdomains}
          maxZoom={tileTheme.maxZoom}
        />
        <MapClickHandler onMapClick={handleMapClick} />
        <Marker position={[displayLat, displayLng]}></Marker>
        <Circle
          center={[displayLat, displayLng]}
          radius={KmRange * 1000} // radius in meters
          pathOptions={{
            color: getComputedStyle(document.documentElement)
              .getPropertyValue("--primary-color")
              .trim(),
            fillColor: getComputedStyle(document.documentElement)
              .getPropertyValue("--primary-color")
              .trim(),
            fillOpacity: 0.2,
          }}
        />
      </MapContainer>
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-[5] flex flex-wrap gap-2">
        <div className="bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <p className="text-xs text-slate-500">Odabrana lokacija</p>
          <p className="text-sm font-semibold text-slate-800">
            {locationLabel || "Nije odabrano područje"}
          </p>
        </div>
        <div className="bg-white/95 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <p className="text-xs text-slate-500">Radijus pretrage</p>
          <p className="text-sm font-semibold text-slate-800">{radiusLabel}</p>
        </div>
        {hasPrecisePoint && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 shadow-sm text-emerald-700 text-xs font-semibold">
            Precizna lokacija
          </div>
        )}
        <div className="bg-slate-900/90 text-white rounded-xl px-3 py-2 text-xs font-medium shadow-sm">
          Klikni na mapu da pomjeriš marker
        </div>
      </div>
    </div>
  );
};

export default GetLocationWithMap;
