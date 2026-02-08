import { useSelector } from "react-redux";
import {
  getDefaultLatitude,
  getDefaultLongitude,
} from "@/redux/reducer/settingSlice";
import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

const MapComponent = ({ getLocationWithMap, location }) => {
  const latitude = useSelector(getDefaultLatitude);
  const longitude = useSelector(getDefaultLongitude);

  const mapRef = useRef();
  const position = {
    lat: Number(location?.lat) || latitude,
    lng: Number(location?.long) || longitude,
  };
  const isPreciseLocation =
    Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.long));
  const label = location?.label || location?.name || "Odabrana lokacija";

  useEffect(() => {
    if (mapRef.current && position.lat && position.lng) {
      mapRef.current.flyTo(
        [position.lat, position.lng],
        mapRef.current.getZoom()
      );
    }
  }, [position?.lat, position?.lng]);

  const containerStyle = {
    width: "100%",
    height: "400px",
    zIndex: 0,
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
    <>
      <MapContainer
        style={containerStyle}
        center={[position?.lat, position?.lng]}
        zoom={6}
        ref={mapRef}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={handleMapClick} />
        {position?.lat && position?.lng && (
          <Marker position={[position?.lat, position?.lng]}>
            <Popup>
              <div className="min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                    📍
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">Klikni na mapu da promijeniš lokaciju</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </>
  );
};

export default MapComponent;