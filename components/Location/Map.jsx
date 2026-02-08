"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

// Helper za formatiranje cijene
const formatPrice = (price) => {
  if (!price || price <= 0) return "Na upit";
  return new Intl.NumberFormat("bs-BA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + " KM";
};

// Helper za dobivanje tipa nekretnine
const getRoomType = (rooms, roomType) => {
  if (roomType) return roomType;
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

// Custom price marker creator
const createPriceMarker = (price) => {
  const formattedPrice = formatPrice(price);
  
  return L.divIcon({
    className: "custom-price-marker",
    html: `
      <div class="price-marker-wrapper">
        <div class="price-marker-bubble">
          <span class="price-text">${formattedPrice}</span>
        </div>
        <div class="price-marker-arrow"></div>
      </div>
    `,
    iconSize: [120, 44],
    iconAnchor: [60, 44],
  });
};

// Component to add marker with popup
const ProductMarker = ({ position, productData }) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !position || !position[0] || !position[1]) return;

    // Remove existing marker if any
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const {
      title,
      price,
      image,
      area,
      rooms,
      roomType,
      createdAt,
      address,
      location,
      category,
      featured,
      status,
    } = productData || {};
    const displayRoomType = getRoomType(rooms, roomType);
    const timeAgo = formatTimeAgo(createdAt);
    const locationLabel = address || location;

    // Create marker with custom icon
    const marker = L.marker(position, {
      icon: createPriceMarker(price),
    });

    // Create popup content
    const popupContent = `
      <div class="map-popup-card">
        <button class="popup-close-btn" onclick="this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button')?.click(); this.closest('.leaflet-popup').remove();">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div class="popup-content">
          ${image ? `
            <div class="popup-image">
              <img 
                src="${image}" 
                alt="${title || 'Oglas'}"
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
            <h3 class="popup-title">${title || 'Bez naziva'}</h3>
            <div class="popup-tags">
              ${featured ? `<span class="popup-tag popup-tag-featured">Istaknuto</span>` : ""}
              ${status ? `<span class="popup-tag popup-tag-status">${status}</span>` : ""}
              ${category ? `<span class="popup-tag">${category}</span>` : ""}
              ${area ? `<span class="popup-tag">${area}m²</span>` : ""}
              ${displayRoomType ? `<span class="popup-tag">${displayRoomType}</span>` : ""}
            </div>
            ${locationLabel ? `<p class="popup-location">📍 ${locationLabel}</p>` : ""}
            <p class="popup-price">${formatPrice(price)}</p>
            ${timeAgo ? `<p class="popup-time">${timeAgo}</p>` : ""}
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

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, position, productData]);

  return null;
};

const Map = ({ latitude, longitude, productData }) => {
  const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "200px",
    zIndex: 0,
  };

  // Validate latitude and longitude
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  // Check if coordinates are valid numbers and within valid ranges
  const isValidLat = !isNaN(lat) && lat >= -90 && lat <= 90;
  const isValidLng = !isNaN(lng) && lng >= -180 && lng <= 180;

  // Use default coordinates if invalid
  const center = [isValidLat ? lat : 0, isValidLng ? lng : 0];

  // Don't render if coordinates are invalid
  const shouldShowMarker = isValidLat && isValidLng;

  if (!shouldShowMarker) return null;

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
        
        .price-marker-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #1f2937;
          margin-top: -1px;
        }
        
        .price-text {
          font-family: system-ui, -apple-system, sans-serif;
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

        .popup-tag-featured {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #c2410c;
          font-weight: 600;
        }

        .popup-tag-status {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #3730a3;
          font-weight: 600;
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
          margin: 0 0 4px 0;
        }
        
        .popup-time {
          font-size: 11px;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }
      `}</style>
      
      <MapContainer
        style={containerStyle}
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ProductMarker position={center} productData={productData} />
      </MapContainer>
    </>
  );
};

export default Map;