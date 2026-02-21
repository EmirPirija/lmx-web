"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { BiCurrentLocation } from "@/components/Common/UnifiedIconPack";
import { t } from "@/utils";
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

const toApproximateLocationLabel = (locationValue) => {
  if (!locationValue) return "";
  const parts = String(locationValue)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  return parts.slice(-2).join(", ");
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getClusterRadiusByZoom = (zoom) => {
  if (zoom <= 7) return 105;
  if (zoom <= 9) return 90;
  if (zoom <= 11) return 72;
  if (zoom <= 13) return 56;
  if (zoom <= 14) return 44;
  return 0;
};

const createClusterMarker = (count, isActive = false) =>
  L.divIcon({
    className: "custom-cluster-marker",
    html: `
      <div class="cluster-marker-shell ${isActive ? "cluster-marker-shell-active" : ""}">
        <span class="cluster-marker-count">${count}</span>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

const clusterAdsForCurrentZoom = (ads, map) => {
  const zoom = map.getZoom();
  const radiusPx = getClusterRadiusByZoom(zoom);

  const points = (ads || [])
    .map((ad) => {
      const lat = Number(ad?.latitude);
      const lng = Number(ad?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const projected = map.project([lat, lng], zoom);
      return {
        ad,
        projected,
      };
    })
    .filter(Boolean);

  if (radiusPx <= 0 || points.length <= 1) {
    return points.map((point) => ({
      type: "single",
      ads: [point.ad],
      lat: Number(point.ad.latitude),
      lng: Number(point.ad.longitude),
    }));
  }

  const clusters = [];

  points.forEach((point) => {
    let targetCluster = null;

    for (const cluster of clusters) {
      if (point.projected.distanceTo(cluster.centerPoint) <= radiusPx) {
        targetCluster = cluster;
        break;
      }
    }

    if (!targetCluster) {
      clusters.push({
        ads: [point.ad],
        points: [point.projected],
        centerPoint: point.projected,
      });
      return;
    }

    targetCluster.ads.push(point.ad);
    targetCluster.points.push(point.projected);

    const sumX = targetCluster.points.reduce((acc, p) => acc + p.x, 0);
    const sumY = targetCluster.points.reduce((acc, p) => acc + p.y, 0);
    targetCluster.centerPoint = L.point(
      sumX / targetCluster.points.length,
      sumY / targetCluster.points.length
    );
  });

  return clusters.map((cluster) => {
    const clusterLatLng = map.unproject(cluster.centerPoint, zoom);
    return {
      type: cluster.ads.length > 1 ? "cluster" : "single",
      ads: cluster.ads,
      lat: clusterLatLng.lat,
      lng: clusterLatLng.lng,
    };
  });
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
      title={"Trenutna lokacija" || "Trenutna lokacija"}
    >
      <BiCurrentLocation className="text-xl text-primary" />
    </button>
  );
};

// Marker updater component
const MarkerUpdater = ({
  ads,
  selectedAd,
  hoveredAd,
  onMarkerClick,
  layerGroupRef,
  showMarkerPopup = true,
}) => {
  const map = useMap();
  const lastAutoFitSignatureRef = useRef("");

  useEffect(() => {
    if (!map || !layerGroupRef.current) return;

    const layerGroup = layerGroupRef.current;
    
    // Clear existing markers
    layerGroup.clearLayers();

    // Add new markers / clusters
    const mapPointsBounds = [];
    let markerToOpen = null;
    const clusteredGroups = clusterAdsForCurrentZoom(ads, map);

    clusteredGroups.forEach((group) => {
      const groupLat = Number(group?.lat);
      const groupLng = Number(group?.lng);
      if (!Number.isFinite(groupLat) || !Number.isFinite(groupLng)) return;

      const position = [groupLat, groupLng];
      mapPointsBounds.push(position);

      if (group.type === "cluster") {
        const containsSelected = group.ads.some(
          (entry) => Number(entry?.id) === Number(selectedAd?.id)
        );
        const clusterMarker = L.marker(position, {
          icon: createClusterMarker(group.ads.length, containsSelected),
          zIndexOffset: containsSelected ? 1400 : 700,
        });

        clusterMarker.on("click", () => {
          const nextZoom = Math.min((map.getZoom() || 12) + 2, 18);
          map.setView(position, nextZoom, { animate: true });
        });

        clusterMarker.bindTooltip(`${group.ads.length} oglasa`, {
          direction: "top",
          offset: [0, -12],
          opacity: 0.9,
        });

        layerGroup.addLayer(clusterMarker);
        return;
      }

      const ad = group.ads[0];
      const parsedLat = Number(ad?.latitude);
      const parsedLng = Number(ad?.longitude);
      if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return;

      const adPosition = [parsedLat, parsedLng];
      const isSelected = selectedAd?.id === ad.id;
      const isHovered = hoveredAd?.id === ad.id;

      const marker = L.marker(adPosition, {
        icon: createPriceMarker(ad.price, isSelected, isHovered),
        zIndexOffset: isSelected ? 1600 : isHovered ? 900 : 0,
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
      const rawLocationLabel = ad.location || ad.address || ad.city || ad.state || ad.country;
      const approximateLocationLabel = toApproximateLocationLabel(rawLocationLabel);
      const locationLabel = approximateLocationLabel || "Lokacija sa mape";
      const locationSecondaryLabel = "";
      const hasViews = typeof ad.views === "number" && ad.views >= 0;
      const statusLabel = ad.status ? String(ad.status) : null;
      const isApproximateCoordinate = String(ad?.coordinate_precision || "").startsWith("approx");
      const locationPrivacyHint = isApproximateCoordinate
        ? "Lokacija je prikazana okvirno prema zoni."
        : locationLabel
          ? "Lokacija je prikazana prema pinu oglasa."
          : "";
      const popupHint = locationPrivacyHint
        ? `${locationPrivacyHint} Klikni marker za detalje u listi.`
        : "Klikni marker za detalje u listi.";
      const safeTitle = escapeHtml(ad.title || ad.name || "Oglas");
      const safeImage = imageUrl ? escapeHtml(imageUrl) : "";
      const safeCategory = ad.category ? escapeHtml(ad.category) : "";
      const safeStatus = statusLabel ? escapeHtml(statusLabel) : "";
      const safeArea = ad.area ? escapeHtml(ad.area) : "";
      const safeRoomType = roomType ? escapeHtml(roomType) : "";
      const safeLocationLabel = locationLabel ? escapeHtml(locationLabel) : "";
      const safeLocationSecondary = locationSecondaryLabel
        ? escapeHtml(locationSecondaryLabel)
        : "";
      const safePrice = escapeHtml(formatPopupPrice(ad.price));
      const safeTimeAgo = timeAgo ? escapeHtml(timeAgo) : "";
      const safePopupHint = escapeHtml(popupHint);
      const listingUrl = ad?.slug
        ? `/ad-details/${encodeURI(String(ad.slug).replace(/^\/+/, ""))}`
        : "";
      const safeListingUrl = listingUrl ? escapeHtml(listingUrl) : "";

      // Popup content - mini product card dizajn
      const popupContent = `
        <div class="map-popup-card">
          <button class="popup-close-btn" onclick="this.closest('.leaflet-popup')?.querySelector('.leaflet-popup-close-button')?.click()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <div class="popup-content">
            <div class="popup-media">
              ${safeImage ? `
                <img
                  src="${safeImage}"
                  alt="${safeTitle}"
                  onerror="this.parentElement.innerHTML='<div class=\\'popup-no-image\\'><svg width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'/><path d=\\'m21 15-5-5L5 21\\'/></svg></div>'"
                />
              ` : `
                <div class="popup-no-image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                </div>
              `}
              ${ad.featured ? `<span class="popup-pill popup-pill-featured">Istaknuto</span>` : ""}
            </div>
            <div class="popup-info">
              <h3 class="popup-title">${safeTitle}</h3>
              <div class="popup-tags">
                ${safeCategory ? `<span class="popup-tag popup-tag-category">${safeCategory}</span>` : ""}
                ${safeStatus ? `<span class="popup-tag popup-tag-status">${safeStatus}</span>` : ""}
                ${safeArea ? `<span class="popup-tag">${safeArea}m²</span>` : ""}
                ${safeRoomType ? `<span class="popup-tag">${safeRoomType}</span>` : ""}
              </div>
              ${safeLocationLabel ? `<p class="popup-location"><span class="popup-location-label">Lokacija:</span> ${safeLocationLabel}</p>` : ""}
              ${safeLocationSecondary ? `<p class="popup-location popup-location-secondary">${safeLocationSecondary}</p>` : ""}
              <div class="popup-meta-row">
                <p class="popup-price">${safePrice}</p>
                ${hasViews ? `<span class="popup-views">${ad.views} pregleda</span>` : ""}
              </div>
              <div class="popup-bottom-row">
                ${safeTimeAgo ? `<p class="popup-time">${safeTimeAgo}</p>` : `<p class="popup-time">Objavljeno nedavno</p>`}
                <div class="popup-action-group">
                  ${
                    safeListingUrl
                      ? `<a href="${safeListingUrl}" class="popup-open-link">Otvori oglas</a>`
                      : `<span class="popup-open-link popup-open-link-disabled">Detalji uskoro</span>`
                  }
                  <a
                    href="https://www.google.com/maps/dir/?api=1&destination=${parsedLat},${parsedLng}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="popup-open-link popup-open-link-route"
                  >
                    Ruta
                  </a>
                </div>
              </div>
              <div class="popup-hint">${safePopupHint}</div>
            </div>
          </div>
        </div>
      `;

      if (showMarkerPopup) {
        marker.bindPopup(popupContent, {
          className: "custom-map-popup",
          maxWidth: 330,
          minWidth: 280,
          closeButton: true,
          autoPanPadding: [24, 24],
        });
      }

      marker.on("click", () => {
        if (showMarkerPopup) {
          marker.openPopup();
        }
        if (onMarkerClick) onMarkerClick(ad);
      });

      // Tooltip on hover
      marker.bindTooltip(ad.title || ad.name || "Oglas", {
        direction: "top",
        offset: [0, -15],
        opacity: 0.9,
      });

      layerGroup.addLayer(marker);

      if (isSelected && showMarkerPopup) {
        markerToOpen = marker;
      }
    });

    // Fit bounds samo kada se lista oglasa promijeni (ne na hover)
    const adsSignature = (ads || [])
      .map((entry) => Number(entry?.id))
      .filter((id) => Number.isFinite(id))
      .sort((a, b) => a - b)
      .join("|");

    if (
      mapPointsBounds.length > 0 &&
      !selectedAd &&
      adsSignature &&
      adsSignature !== lastAutoFitSignatureRef.current
    ) {
      map.fitBounds(mapPointsBounds, { padding: [50, 50], maxZoom: 14 });
      lastAutoFitSignatureRef.current = adsSignature;
    }

    // Center on selected marker
    if (selectedAd?.latitude && selectedAd?.longitude) {
      const selectedPos = [parseFloat(selectedAd.latitude), parseFloat(selectedAd.longitude)];
      if (!isNaN(selectedPos[0]) && !isNaN(selectedPos[1])) {
        map.setView(selectedPos, 14, { animate: true });
      }
    }

    if (markerToOpen) {
      markerToOpen.openPopup();
    }
  }, [ads, selectedAd, hoveredAd, map, layerGroupRef, onMarkerClick, showMarkerPopup]);

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
  showMarkerPopup = true,
}) => {
  const layerGroupRef = useRef(null);
  const [map, setMap] = useState(null);
  const tileTheme = useLeafletTileTheme();

  // Default center (Sarajevo ili iz cityData)
  const defaultCenter = [
    cityData?.lat || 43.8563,
    cityData?.long || 18.4131,
  ];

  // Initialize marker layer when map is ready
  useEffect(() => {
    if (!map) return;

    const layerGroup = L.layerGroup();
    map.addLayer(layerGroup);
    layerGroupRef.current = layerGroup;

    return () => {
      if (layerGroup) {
        map.removeLayer(layerGroup);
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

        .custom-cluster-marker {
          background: transparent !important;
          border: none !important;
        }

        .cluster-marker-shell {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: #ffffff;
          border: 3px solid rgba(255, 255, 255, 0.95);
          box-shadow: 0 10px 22px -14px rgba(124, 58, 237, 0.7);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .cluster-marker-shell:hover {
          transform: scale(1.06);
          box-shadow: 0 14px 26px -14px rgba(124, 58, 237, 0.75);
        }

        .cluster-marker-shell-active {
          background: linear-gradient(135deg, #0ea5e9, #2563eb);
          box-shadow: 0 14px 28px -16px rgba(37, 99, 235, 0.8);
        }

        .cluster-marker-count {
          font-size: 13px;
          font-weight: 800;
          line-height: 1;
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
          min-width: 260px;
          max-width: 300px;
          border-radius: 12px;
          overflow: hidden;
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
          display: block;
        }
        
        .popup-media {
          position: relative;
          width: 100%;
          height: 150px;
          overflow: hidden;
        }
        
        .popup-media img {
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

        .popup-pill {
          position: absolute;
          left: 10px;
          top: 10px;
          z-index: 2;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 999px;
          background: #fef3c7;
          color: #92400e;
          font-weight: 700;
          border: 1px solid #fde68a;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .popup-info {
          padding: 10px 12px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .popup-title {
          font-weight: 700;
          font-size: 14px;
          line-height: 1.3;
          color: #1e293b;
          margin: 0;
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

        .popup-location-secondary {
          margin-top: -4px;
          color: #94a3b8;
          font-size: 10px;
        }

        .popup-location-label {
          font-weight: 700;
          color: #334155;
        }

        .popup-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .popup-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .popup-action-group {
          display: inline-flex;
          gap: 6px;
          align-items: center;
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
          margin: 0;
          white-space: nowrap;
        }

        .popup-open-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          background: #0f766e;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.2s ease;
        }

        .popup-open-link:hover {
          background: #115e59;
        }

        .popup-open-link-route {
          background: #334155;
        }

        .popup-open-link-route:hover {
          background: #1e293b;
        }

        .popup-open-link-disabled {
          background: #e2e8f0;
          color: #64748b;
        }

        .popup-hint {
          margin-top: 2px;
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
          attribution={tileTheme.attribution}
          url={tileTheme.url}
          subdomains={tileTheme.subdomains}
          maxZoom={tileTheme.maxZoom}
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
        {layerGroupRef.current && (
          <MarkerUpdater
            ads={ads}
            selectedAd={selectedAd}
            hoveredAd={hoveredAd}
            onMarkerClick={onMarkerClick}
            layerGroupRef={layerGroupRef}
            showMarkerPopup={showMarkerPopup}
          />
        )}
      </MapContainer>
    </>
  );
};

export default MapWithListingsMarkers;
