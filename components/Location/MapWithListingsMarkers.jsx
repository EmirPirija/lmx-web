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

// Helper za formatiranje vremena "prije X sata/dana"
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 60) return `prije ${diffMins} min`;
  if (diffHours < 24) return `prije ${diffHours} ${diffHours === 1 ? "sat" : diffHours < 5 ? "sata" : "sati"}`;
  if (diffDays < 7) return `prije ${diffDays} ${diffDays === 1 ? "dan" : "dana"}`;
  if (diffWeeks < 4) return `prije ${diffWeeks} ${diffWeeks === 1 ? "sedmica" : "sedmica"}`;
  return `prije ${diffMonths} ${diffMonths === 1 ? "mjesec" : "mjeseci"}`;
};

// Custom marker sa cijenom - novi dizajn
const createPriceMarker = (price, isSelected, isHovered) => {
  const hasPrice = price && price > 0;
  const formattedPrice = hasPrice
    ? new Intl.NumberFormat("bs-BA", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price) + " KM"
    : "Na upit";

  return L.divIcon({
    className: "custom-price-marker",
    html: `
      <div class="price-marker-wrapper ${isSelected ? "marker-selected" : isHovered ? "marker-hovered" : "marker-default"}">
        <div class="price-marker-bubble ${isSelected ? "selected" : isHovered ? "hovered" : ""}">
          <span class="price-text">${formattedPrice}</span>
        </div>
        <div class="price-marker-arrow ${isSelected || isHovered ? "active" : ""}"></div>
      </div>
    `,
    iconSize: [120, 44],
    iconAnchor: [60, 44],
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

      // Helper za formatiranje cijene
      const formatPopupPrice = (price) => {
        if (!price || price <= 0) return "Na upit";
        return new Intl.NumberFormat("bs-BA", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(price) + " KM";
      };

      // Helper za dobivanje tipa nekretnine
      const getRoomType = (rooms, roomTypeFromApi) => {
        // Prefer API-provided room type if available
        if (roomTypeFromApi) return roomTypeFromApi;
        
        if (!rooms) return null;
        const roomNum = parseInt(rooms);
        if (isNaN(roomNum)) return null;
        if (roomNum === 1) return "Jednosoban (1)";
        if (roomNum === 2) return "Dvosoban (2)";
        if (roomNum === 3) return "Trosoban (3)";
        if (roomNum === 4) return "Četverosoban (4)";
        if (roomNum >= 5) return `${roomNum}-soban`;
        return null;
      };

      const roomType = getRoomType(ad.rooms, ad.room_type);
      const timeAgo = formatTimeAgo(ad.created_at);
      const imageUrl = ad.image || ad.images?.[0];
      const locationLabel = ad.location || ad.address || ad.city || ad.state || ad.country;
      const hasViews = typeof ad.views === "number" && ad.views >= 0;
      const statusLabel = ad.status ? String(ad.status) : null;

      // Popup content - horizontalni card dizajn kao na slici
      const popupContent = `
        <div class="map-popup-card">
          <button class="popup-close-btn" onclick="this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button').click()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="popup-content">
            ${imageUrl ? `
              <div class="popup-image">
                <img
                  src="${imageUrl}"
                  alt="${ad.title || ad.name}"
                  onerror="this.parentElement.innerHTML='<div class=\\'popup-no-image\\'><svg width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'m21 15-5-5L5 21\\'/></svg></div>'"
                />
              </div>
            ` : `
              <div class="popup-image">
                <div class="popup-no-image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                </div>
              </div>
            `}
            <div class="popup-info">
              <div class="popup-header-row">
                <h3 class="popup-title">${ad.title || ad.name}</h3>
                ${ad.featured ? `<span class="popup-pill popup-pill-featured">Istaknuto</span>` : ""}
              </div>
              <div class="popup-tags">
                ${ad.category ? `<span class="popup-tag popup-tag-category">${ad.category}</span>` : ""}
                ${statusLabel ? `<span class="popup-tag popup-tag-status">${statusLabel}</span>` : ""}
                ${ad.area ? `<span class="popup-tag">${ad.area}m²</span>` : ""}
                ${roomType ? `<span class="popup-tag">${roomType}</span>` : ""}
              </div>
              ${locationLabel ? `<p class="popup-location">📍 ${locationLabel}</p>` : ""}
              <div class="popup-meta-row">
                <p class="popup-price">${formatPopupPrice(ad.price)}</p>
                ${hasViews ? `<span class="popup-views">👀 ${ad.views} pregleda</span>` : ""}
              </div>
              ${timeAgo ? `<p class="popup-time">${timeAgo}</p>` : ""}
              <div class="popup-hint">Klikni marker za detalje u listi</div>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        minWidth: 280,
        className: "custom-map-popup",
        closeButton: false,
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
        /* Price Marker Styles */
        .custom-price-marker {
          background: transparent !important;
          border: none !important;
        }
        
        .price-marker-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .price-marker-wrapper:hover {
          transform: scale(1.05);
        }
        
        .price-marker-wrapper.marker-selected {
          transform: scale(1.1);
          z-index: 1000 !important;
        }
        
        .price-marker-bubble {
          padding: 6px 12px;
          border-radius: 6px;
          background: #374151;
          color: white;
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          border: 2px solid #1f2937;
          transition: all 0.2s ease;
        }
        
        .price-marker-bubble.selected {
          background: var(--primary, #3b82f6);
          border-color: var(--primary, #3b82f6);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .price-marker-bubble.hovered {
          background: #4b5563;
          border-color: #374151;
        }
        
        .price-marker-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #1f2937;
          margin-top: -1px;
        }
        
        .price-marker-arrow.active {
          border-top-color: var(--primary, #3b82f6);
        }
        
        .price-text {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        /* Cluster Styles */
        .custom-cluster {
          background: transparent !important;
          border: none !important;
        }

        /* Popup Styles */
        .custom-map-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .custom-map-popup .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }

        .custom-map-popup .leaflet-popup-tip-container {
          display: none;
        }
        
        .custom-map-popup .leaflet-popup-close-button {
          display: none;
        }

        .map-popup-card {
          position: relative;
          background: white;
          min-width: 280px;
          max-width: 320px;
        }
        
        .popup-close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 6px;
          cursor: pointer;
          color: #64748b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }
        
        .popup-close-btn:hover {
          background: white;
          color: #1e293b;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        
        .popup-content {
          display: flex;
          gap: 12px;
          padding: 0;
        }
        
        .popup-image {
          width: 100px;
          min-width: 100px;
          height: 100px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .popup-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .popup-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
          color: #94a3b8;
        }
        
        .popup-info {
          flex: 1;
          padding: 10px 12px 10px 0;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .popup-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        
        .popup-title {
          font-weight: 700;
          font-size: 13px;
          line-height: 1.3;
          color: #1e293b;
          margin: 0 0 6px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .popup-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 6px;
        }
        
        .popup-tag {
          display: inline-flex;
          padding: 2px 8px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 11px;
          color: #475569;
          white-space: nowrap;
        }

        .popup-tag-category {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
          font-weight: 600;
        }

        .popup-tag-status {
          background: #f5f3ff;
          border-color: #ddd6fe;
          color: #6d28d9;
          font-weight: 600;
          text-transform: capitalize;
        }

        .popup-pill {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 999px;
          background: #fef3c7;
          color: #92400e;
          font-weight: 700;
          border: 1px solid #fde68a;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .popup-pill-featured {
          background: #ffedd5;
          border-color: #fed7aa;
          color: #c2410c;
        }
        
        .popup-price {
          font-weight: 700;
          font-size: 15px;
          color: #1e293b;
          margin: 0;
        }

        .popup-location {
          font-size: 11px;
          color: #64748b;
          margin: 0 0 6px 0;
        }

        .popup-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .popup-views {
          font-size: 11px;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 2px 6px;
          border-radius: 999px;
          white-space: nowrap;
        }
        
        .popup-time {
          font-size: 11px;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }

        .popup-hint {
          margin-top: 6px;
          font-size: 10px;
          color: #94a3b8;
        }

        .marker-default:hover {
          z-index: 1000 !important;
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
