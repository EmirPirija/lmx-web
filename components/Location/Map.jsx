"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { Circle, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

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

const formatPrice = (price) => {
  if (!price || price <= 0) return "Na upit";
  return `${new Intl.NumberFormat("bs-BA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)} KM`;
};

const getRoomType = (rooms, roomType) => {
  if (roomType) return roomType;
  if (!rooms) return null;
  const roomNum = parseInt(rooms, 10);
  if (Number.isNaN(roomNum)) return null;
  if (roomNum === 1) return "Jednosoban (1)";
  if (roomNum === 2) return "Dvosoban (2)";
  if (roomNum === 3) return "Trosoban (3)";
  if (roomNum === 4) return "Četverosoban (4)";
  if (roomNum >= 5) return `${roomNum}-soban`;
  return null;
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createPriceMarker = (price, privacyMode) => {
  const formattedPrice = formatPrice(price);
  return L.divIcon({
    className: "custom-price-marker",
    html: `
      <div class="price-marker-wrapper">
        <div class="price-marker-bubble ${privacyMode ? "privacy" : ""}">
          <span class="price-text">${escapeHtml(formattedPrice)}</span>
        </div>
        <div class="price-marker-arrow ${privacyMode ? "privacy" : ""}"></div>
      </div>
    `,
    iconSize: [124, 44],
    iconAnchor: [62, 44],
  });
};

const ProductMarker = ({
  position,
  productData,
  privacyMode = false,
  approximateRadiusMeters = 0,
}) => {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !position || !position[0] || !position[1]) return;

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
    const locationLabel = location || address;
    const privacyLabel =
      privacyMode && approximateRadiusMeters > 0
        ? `Prikazana je okvirna zona (~${Math.round(approximateRadiusMeters / 100) * 100}m).`
        : "";

    const marker = L.marker(position, {
      icon: createPriceMarker(price, privacyMode),
    });

    const popupContent = `
      <div class="map-popup-card">
        <button class="popup-close-btn" onclick="this.closest('.leaflet-popup').querySelector('.leaflet-popup-close-button')?.click()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div class="popup-content">
          ${
            image
              ? `
            <div class="popup-image">
              <img
                src="${escapeHtml(image)}"
                alt="${escapeHtml(title || "Oglas")}"
                onerror="this.parentElement.innerHTML='<div class=\\'popup-no-image\\'><svg width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'m21 15-5-5L5 21\\'/></svg></div>'"
              />
            </div>
          `
              : `
            <div class="popup-image">
              <div class="popup-no-image">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="m21 15-5-5L5 21"/>
                </svg>
              </div>
            </div>
          `
          }
          <div class="popup-info">
            <h3 class="popup-title">${escapeHtml(title || "Bez naziva")}</h3>
            <div class="popup-tags">
              ${featured ? `<span class="popup-tag popup-tag-featured">Istaknuto</span>` : ""}
              ${status ? `<span class="popup-tag popup-tag-status">${escapeHtml(status)}</span>` : ""}
              ${category ? `<span class="popup-tag">${escapeHtml(category)}</span>` : ""}
              ${area ? `<span class="popup-tag">${escapeHtml(area)}m²</span>` : ""}
              ${displayRoomType ? `<span class="popup-tag">${escapeHtml(displayRoomType)}</span>` : ""}
            </div>
            ${
              locationLabel
                ? `<p class="popup-location"><span class="popup-location-label">Lokacija:</span> ${escapeHtml(
                    locationLabel
                  )}</p>`
                : ""
            }
            ${privacyLabel ? `<p class="popup-privacy">🛡️ ${escapeHtml(privacyLabel)}</p>` : ""}
            <p class="popup-price">${escapeHtml(formatPrice(price))}</p>
            ${timeAgo ? `<p class="popup-time">${escapeHtml(timeAgo)}</p>` : ""}
          </div>
        </div>
      </div>
    `;



    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, position, productData, privacyMode, approximateRadiusMeters]);

  return null;
};

const Map = ({
  latitude,
  longitude,
  productData,
  privacyMode = false,
  approximateRadiusMeters = 0,
}) => {
  const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight: "200px",
    zIndex: 0,
  };

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);

  const isValidLat = !Number.isNaN(lat) && lat >= -90 && lat <= 90;
  const isValidLng = !Number.isNaN(lng) && lng >= -180 && lng <= 180;
  const shouldShowMarker = isValidLat && isValidLng;
  const center = [lat, lng];

  if (!shouldShowMarker) return null;

  return (
    <>
      <style jsx global>{`
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
          transform: scale(1.04);
        }

        .price-marker-bubble {
          padding: 6px 12px;
          border-radius: 8px;
          background: #334155;
          color: #ffffff;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.25);
          border: 1px solid #0f172a;
          transition: all 0.2s ease;
        }

        .price-marker-bubble.privacy {
          background: #0f766e;
          border-color: #0f766e;
        }

        .price-marker-arrow {
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #0f172a;
          margin-top: -1px;
        }

        .price-marker-arrow.privacy {
          border-top-color: #0f766e;
        }

        .price-text {
          font-family: system-ui, -apple-system, sans-serif;
        }

        .custom-map-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 14px;
          box-shadow: 0 18px 34px -14px rgba(15, 23, 42, 0.4);
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.35);
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
          background: #ffffff;
          min-width: 286px;
          max-width: 330px;
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
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          box-shadow: 0 2px 5px rgba(15, 23, 42, 0.16);
          transition: all 0.2s ease;
        }

        .popup-close-btn:hover {
          background: #ffffff;
          color: #0f172a;
        }

        .popup-content {
          display: flex;
          gap: 12px;
          padding: 0;
        }

        .popup-image {
          width: 108px;
          min-width: 108px;
          height: 112px;
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
          line-height: 1.35;
          color: #0f172a;
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
          border-radius: 999px;
          font-size: 10px;
          color: #475569;
          white-space: nowrap;
        }

        .popup-tag-featured {
          background: #fff7ed;
          border-color: #fed7aa;
          color: #c2410c;
          font-weight: 700;
        }

        .popup-tag-status {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
          font-weight: 700;
          text-transform: capitalize;
        }

        .popup-location {
          font-size: 11px;
          color: #475569;
          margin: 0 0 4px 0;
        }

        .popup-location-label {
          font-weight: 700;
          color: #334155;
        }

        .popup-privacy {
          font-size: 10px;
          color: #0f766e;
          margin: 0 0 4px 0;
          font-weight: 600;
        }

        .popup-price {
          font-weight: 800;
          font-size: 15px;
          color: #0f172a;
          margin: 0;
        }

        .popup-time {
          font-size: 11px;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }

        @media (prefers-color-scheme: dark) {
          .custom-map-popup .leaflet-popup-content-wrapper {
            border-color: rgba(71, 85, 105, 0.65);
            box-shadow: 0 20px 40px -20px rgba(2, 6, 23, 0.85);
          }

          .map-popup-card {
            background: #0f172a;
          }

          .popup-close-btn {
            background: rgba(15, 23, 42, 0.96);
            color: #94a3b8;
            box-shadow: 0 2px 6px rgba(2, 6, 23, 0.45);
          }

          .popup-close-btn:hover {
            color: #e2e8f0;
            background: rgba(15, 23, 42, 1);
          }

          .popup-no-image {
            background: #1e293b;
            color: #64748b;
          }

          .popup-title {
            color: #f1f5f9;
          }

          .popup-tag {
            background: #1e293b;
            border-color: #334155;
            color: #cbd5e1;
          }

          .popup-tag-featured {
            background: rgba(194, 65, 12, 0.2);
            border-color: rgba(194, 65, 12, 0.45);
            color: #fdba74;
          }

          .popup-tag-status {
            background: rgba(59, 130, 246, 0.18);
            border-color: rgba(59, 130, 246, 0.45);
            color: #93c5fd;
          }

          .popup-location {
            color: #94a3b8;
          }

          .popup-location-label {
            color: #cbd5e1;
          }

          .popup-privacy {
            color: #5eead4;
          }

          .popup-price {
            color: #f8fafc;
          }

          .popup-time {
            color: #64748b;
          }
        }
      `}</style>

      <MapContainer
        style={containerStyle}
        center={center}
        zoom={privacyMode ? 13 : 14}
        scrollWheelZoom={false}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {privacyMode && approximateRadiusMeters > 0 && (
          <Circle
            center={center}
            radius={approximateRadiusMeters}
            pathOptions={{
              color: "#0f766e",
              weight: 2,
              fillColor: "#14b8a6",
              fillOpacity: 0.16,
            }}
          />
        )}

        <ProductMarker
          position={center}
          productData={productData}
          privacyMode={privacyMode}
          approximateRadiusMeters={approximateRadiusMeters}
        />
      </MapContainer>
    </>
  );
};

export default Map;
