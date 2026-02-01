"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { BiCurrentLocation } from "react-icons/bi";
import { t } from "@/utils";

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

// Custom marker sa cijenom
const createPriceMarker = (price, isSelected, isHovered) => {
  const formattedPrice = new Intl.NumberFormat("bs-BA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return L.divIcon({
    className: "custom-price-marker",
    html: `
      <div class="
        ${isSelected ? "marker-selected" : isHovered ? "marker-hovered" : "marker-default"}
        relative flex items-center justify-center transition-all duration-200 cursor-pointer
      ">
        <div class="
          px-3 py-1.5 rounded-full font-bold text-sm whitespace-nowrap
          ${isSelected 
            ? "bg-primary text-white shadow-lg scale-110 ring-4 ring-primary/30" 
            : isHovered
            ? "bg-primary/90 text-white shadow-md scale-105"
            : "bg-white text-slate-800 border-2 border-slate-300 shadow-md hover:shadow-lg hover:scale-105"
          }
        ">
          ${formattedPrice} KM
        </div>
        ${isSelected || isHovered ? `
          <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-4 border-r-4 border-t-4 border-transparent 
            ${isSelected ? "border-t-primary" : "border-t-primary/90"}
          "></div>
        ` : ""}
      </div>
    `,
    iconSize: [120, 50],
    iconAnchor: [60, 50],
  });
};

// Map bounds change handler
const MapBoundsHandler = ({ onBoundsChange }) => {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    },
  });
  return null;
};

// Current location button component
const CurrentLocationButton = ({ onClick }) => {
  const map = useMap();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 14, { animate: true });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <button
      onClick={handleClick}
      className="leaflet-control-custom-location"
      style={{
        position: "absolute",
        top: "80px",
        right: "10px",
        zIndex: 1000,
        backgroundColor: "white",
        padding: "8px",
        borderRadius: "8px",
        border: "2px solid rgba(0,0,0,0.2)",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
      title={t("currentLocation") || "Trenutna lokacija"}
    >
      <BiCurrentLocation className="text-xl text-primary" />
    </button>
  );
};

// Marker updater component
const MarkerUpdater = ({ ads, selectedAd, hoveredAd, onMarkerClick, clusterGroupRef }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !clusterGroupRef.current) return;

    const clusterGroup = clusterGroupRef.current;
    
    // Clear existing markers
    clusterGroup.clearLayers();

    // Add new markers
    const bounds = [];
    ads.forEach((ad) => {
      if (!ad.latitude || !ad.longitude) return;

      const position = [parseFloat(ad.latitude), parseFloat(ad.longitude)];
      
      // Validate coordinates
      if (isNaN(position[0]) || isNaN(position[1])) return;
      
      bounds.push(position);

      const isSelected = selectedAd?.id === ad.id;
      const isHovered = hoveredAd?.id === ad.id;

      const marker = L.marker(position, {
        icon: createPriceMarker(ad.price, isSelected, isHovered),
        zIndexOffset: isSelected ? 1000 : isHovered ? 500 : 0,
      });

      // Popup content
      const popupContent = `
        <div class="p-2 min-w-[200px]">
          ${ad.image || ad.images?.[0] ? `
            <img 
              src="${ad.image || ad.images[0]}" 
              alt="${ad.title || ad.name}"
              class="w-full h-32 object-cover rounded-lg mb-2"
              onerror="this.style.display='none'"
            />
          ` : ""}
          <h3 class="font-bold text-sm mb-1 line-clamp-2">${ad.title || ad.name}</h3>
          <p class="text-xs text-slate-600 mb-2 truncate">${ad.location || ad.address || ad.city || ""}</p>
          <p class="text-lg font-bold text-primary">
            ${new Intl.NumberFormat("bs-BA").format(ad.price)} KM
          </p>
          ${ad.area ? `<p class="text-xs text-slate-500 mt-1">${ad.area} m²</p>` : ""}
          ${ad.rooms ? `<p class="text-xs text-slate-500">${ad.rooms} sobe</p>` : ""}
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 250,
        className: "custom-popup",
      });

      marker.on("click", () => {
        if (onMarkerClick) onMarkerClick(ad);
      });

      // Tooltip on hover
      marker.bindTooltip(ad.title || ad.name, {
        direction: "top",
        offset: [0, -15],
        opacity: 0.9,
      });

      clusterGroup.addLayer(marker);
    });

    // Fit bounds if we have markers and no specific selection
    if (bounds.length > 0 && !selectedAd) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    // Center on selected marker
    if (selectedAd?.latitude && selectedAd?.longitude) {
      const selectedPos = [parseFloat(selectedAd.latitude), parseFloat(selectedAd.longitude)];
      if (!isNaN(selectedPos[0]) && !isNaN(selectedPos[1])) {
        map.setView(selectedPos, 14, { animate: true });
      }
    }
  }, [ads, selectedAd, hoveredAd, map, clusterGroupRef, onMarkerClick]);

  return null;
};

const MapWithListingsMarkers = ({
  ads = [],
  selectedAd,
  hoveredAd,
  onMarkerClick,
  onBoundsChange,
  cityData,
  kmRange = 0,
  showCurrentLocationButton = true,
  onCurrentLocationClick,
}) => {
  const clusterGroupRef = useRef(null);
  const [map, setMap] = useState(null);

  // Default center (Sarajevo ili iz cityData)
  const defaultCenter = [
    cityData?.lat || 43.8563,
    cityData?.long || 18.4131,
  ];

  // Initialize cluster group when map is ready
  useEffect(() => {
    if (!map) return;

    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 60,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `
            <div class="cluster-marker">
              <div class="
                w-12 h-12 rounded-full bg-primary text-white 
                flex items-center justify-center font-bold text-sm
                shadow-lg border-4 border-white
                hover:scale-110 transition-transform cursor-pointer
              ">
                ${count}
              </div>
            </div>
          `,
          className: "custom-cluster",
          iconSize: [48, 48],
        });
      },
    });

    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    return () => {
      if (clusterGroup) {
        map.removeLayer(clusterGroup);
      }
    };
  }, [map]);

  return (
    <>
      <style jsx global>{`
        .custom-price-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .custom-cluster {
          background: transparent !important;
          border: none !important;
        }

        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .leaflet-popup-tip {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .marker-default:hover {
          z-index: 1000 !important;
        }

        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
        }
      `}</style>

      <MapContainer
        center={defaultCenter}
        zoom={cityData ? 12 : 7}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
        ref={setMap}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location circle */}
        {cityData?.lat && cityData?.long && kmRange > 0 && (
          <Circle
            center={[cityData.lat, cityData.long]}
            radius={kmRange * 1000}
            pathOptions={{
              color: getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                ?.trim() || "#3b82f6",
              fillColor: getComputedStyle(document.documentElement)
                .getPropertyValue("--primary")
                ?.trim() || "#3b82f6",
              fillOpacity: 0.1,
              weight: 2,
            }}
          />
        )}

        {/* User location marker */}
        {cityData?.lat && cityData?.long && (
          <Marker 
            position={[cityData.lat, cityData.long]}
          />
        )}

        {/* Bounds change handler */}
        <MapBoundsHandler onBoundsChange={onBoundsChange} />

        {/* Current location button */}
        {showCurrentLocationButton && (
          <CurrentLocationButton onClick={onCurrentLocationClick} />
        )}

        {/* Markers updater */}
        {clusterGroupRef.current && (
          <MarkerUpdater
            ads={ads}
            selectedAd={selectedAd}
            hoveredAd={hoveredAd}
            onMarkerClick={onMarkerClick}
            clusterGroupRef={clusterGroupRef}
          />
        )}
      </MapContainer>
    </>
  );
};

export default MapWithListingsMarkers;