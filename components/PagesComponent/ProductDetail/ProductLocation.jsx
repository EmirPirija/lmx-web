import { useMemo } from "react";
import { IoCopyOutline, IoLocationOutline } from "react-icons/io5";
import { MdDirections, MdMap, MdOpenInNew } from "react-icons/md";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const MAP_PRIVACY_RADIUS_METERS = 1200;

const Map = dynamic(() => import("@/components/Location/Map"), {
  ssr: false,
});

const parseCoordinate = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const createSeed = (input) => {
  const str = String(input || "");
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
};

const obfuscateCoordinates = (lat, lng, seedInput) => {
  const seed = createSeed(seedInput);
  const angle = ((seed % 360) * Math.PI) / 180;
  const distanceMeters = 700 + (seed % 900);
  const latOffset = (distanceMeters / 111320) * Math.cos(angle);
  const lngDenominator = 111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const lngOffset = (distanceMeters / lngDenominator) * Math.sin(angle);

  return {
    lat: clamp(lat + latOffset, -90, 90),
    lng: clamp(lng + lngOffset, -180, 180),
  };
};

const parseLocationParts = (value) =>
  String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const toApproximateLocation = (parts) => {
  if (!parts.length) return "";
  if (parts.length === 1) return parts[0];
  return parts.slice(-2).join(", ");
};

const toZoneLocation = (parts) => {
  if (parts.length <= 2) return "";
  return parts.slice(0, parts.length - 2).join(", ");
};

// Helper za dobijanje vrijednosti iz extra_details
const getExtraDetailValue = (extraDetails, keys) => {
  if (!extraDetails) return null;
  let details = extraDetails;
  if (typeof extraDetails === "string") {
    try {
      details = JSON.parse(extraDetails);
    } catch {
      details = null;
    }
  }
  for (const key of keys) {
    if (details?.[key]) return details[key];
  }
  return null;
};

const ProductLocation = ({ productDetails, onMapOpen }) => {
  const locationText =
    productDetails?.translated_address ||
    productDetails?.translated_item?.address ||
    productDetails?.address ||
    "";

  const locationParts = useMemo(() => parseLocationParts(locationText), [locationText]);

  const approximateLocation = useMemo(
    () => toApproximateLocation(locationParts) || "Lokacija nije specificirana",
    [locationParts]
  );
  const zoneLocation = useMemo(() => toZoneLocation(locationParts), [locationParts]);
  const cityLabel = locationParts[locationParts.length - 1] || "Nije dostupno";
  const areaLabel = locationParts.length > 1 ? locationParts.slice(-2).join(", ") : "Nije dostupno";

  const preciseLat = parseCoordinate(productDetails?.latitude);
  const preciseLng = parseCoordinate(productDetails?.longitude);
  const obscuredCoordinates = useMemo(() => {
    if (preciseLat === null || preciseLng === null) return null;
    return obfuscateCoordinates(
      preciseLat,
      preciseLng,
      `${productDetails?.id || productDetails?.slug || "listing"}-${locationText}`
    );
  }, [preciseLat, preciseLng, productDetails?.id, productDetails?.slug, locationText]);

  const hasCoordinates = Boolean(obscuredCoordinates);

  const handleShowMapClick = () => {
    const mapQuery = hasCoordinates
      ? `${obscuredCoordinates.lat},${obscuredCoordinates.lng}`
      : approximateLocation || "Bosna i Hercegovina";
    const googleMapsUrl = hasCoordinates
      ? `https://www.google.com/maps?q=${mapQuery}&z=13&t=m`
      : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=10&t=m`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleDirectionsClick = () => {
    const destination = hasCoordinates
      ? `${obscuredCoordinates.lat},${obscuredCoordinates.lng}`
      : approximateLocation || "Bosna i Hercegovina";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination
    )}&travelmode=driving`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleCopyLocation = async () => {
    const locationForCopy = approximateLocation || locationText;
    if (!locationForCopy) return;
    try {
      await navigator.clipboard.writeText(locationForCopy);
      toast.success("Lokacija je kopirana.");
    } catch (error) {
      console.error("Greška pri kopiranju lokacije:", error);
      toast.error("Ne mogu kopirati lokaciju. Pokušaj ponovo.");
    }
  };

  // Prepare product data for the map marker popup
  const mapProductData = useMemo(() => {
    if (!productDetails) return null;

    const area =
      productDetails?.area ||
      productDetails?.total_area ||
      getExtraDetailValue(productDetails?.extra_details, ["povrsina", "quadrature", "m2", "area"]);

    const rooms =
      productDetails?.bedrooms ||
      productDetails?.rooms ||
      getExtraDetailValue(productDetails?.extra_details, ["broj_soba", "sobe", "rooms", "bedrooms"]);

    const roomType = getExtraDetailValue(productDetails?.extra_details, [
      "tip_stana",
      "room_type",
      "tip_nekretnine",
      "property_type",
    ]);

    const image = productDetails?.image || productDetails?.gallery_images?.[0]?.image || productDetails?.gallery?.[0];

    return {
      title: productDetails?.translated_item?.name || productDetails?.name || productDetails?.title,
      price: parseFloat(productDetails?.price) || 0,
      image,
      area,
      rooms,
      roomType,
      createdAt: productDetails?.created_at,
      location: approximateLocation,
      privacyMode: true,
    };
  }, [productDetails, approximateLocation]);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4 border-b border-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
              <MdMap className="text-slate-600 text-xl dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Lokacija oglasa</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prikazujemo okvirnu zonu radi privatnosti prodavača.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800">
            Okvirna lokacija
          </span>
        </div>
      </div>

      <div className="flex flex-col p-4 lg:p-5 gap-4">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="p-2 bg-primary/10 rounded-lg mt-0.5 text-primary dark:bg-primary/20 dark:text-primary-400">
            <IoLocationOutline size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 dark:text-slate-500">
              Lokacija
            </p>
            <p className="text-sm font-medium text-slate-700 break-words leading-relaxed dark:text-slate-200">
              {approximateLocation}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Tačna lokacija nije javno prikazana i dijeli se po dogovoru sa prodavačem.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                Grad: <span className="font-semibold">{cityLabel}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                Šira zona: <span className="font-semibold">{areaLabel}</span>
              </span>
              {zoneLocation && (
                <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                  Uži dio: <span className="font-semibold">{zoneLocation}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-100 h-64 relative dark:border-slate-800 dark:bg-slate-800">
          <Map
            latitude={obscuredCoordinates?.lat}
            longitude={obscuredCoordinates?.lng}
            productData={mapProductData}
            privacyMode
            approximateRadiusMeters={MAP_PRIVACY_RADIUS_METERS}
          />
          {hasCoordinates && (
            <div className="absolute top-3 left-3 bg-white/90 border border-slate-100 text-xs text-slate-600 rounded-lg px-3 py-2 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Okvirni prikaz</p>
              <p>Radijus oko lokacije: ~{Math.round(MAP_PRIVACY_RADIUS_METERS / 100) * 100}m</p>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
            onClick={handleShowMapClick}
          >
            <MdOpenInNew className="text-lg" />
            Otvori mapu
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 text-primary hover:bg-primary/20 font-bold rounded-xl transition-all active:scale-[0.98] border border-primary/20 dark:bg-primary/20 dark:text-primary-200 dark:hover:bg-primary/30"
            onClick={handleDirectionsClick}
          >
            <MdDirections className="text-lg" />
            Prikaži rutu
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white hover:bg-slate-50 font-bold rounded-xl transition-all active:scale-[0.98] border border-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200"
            onClick={handleCopyLocation}
          >
            <IoCopyOutline className="text-lg" />
            Kopiraj lokaciju
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductLocation;
