import { useEffect, useMemo, useState } from "react";
import { IoCopyOutline } from "@/components/Common/UnifiedIconPack";
import {
  MdDirections,
  MdMap,
  MdOpenInNew,
} from "@/components/Common/UnifiedIconPack";
import dynamic from "next/dynamic";
import { toast } from "@/utils/toastBs";
import { getLocationApi } from "@/utils/api";
import { useSelector } from "react-redux";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";

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
  const lngDenominator =
    111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
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

const REGION_SHORTCUTS = {
  "Bosansko-podrinjski kanton Goražde": "BPK Goražde",
  "Kanton Sarajevo": "KS",
  "Tuzlanski kanton": "TK",
  "Zeničko-dobojski kanton": "ZDK",
  "Unsko-sanski kanton": "USK",
  "Srednjobosanski kanton": "SBK",
  "Hercegovačko-neretvanski kanton": "HNK",
  "Zapadnohercegovački kanton": "ZHK",
  "Posavski kanton": "PK",
  "Kanton 10": "K10",
};

const normalizeLocationToken = (value) => {
  let token = String(value || "").trim();
  if (!token) return "";

  token = token
    .replace(/^Područje:\s*/i, "")
    .replace(/^Zona:\s*/i, "")
    .replace(/^Općina\s+/i, "")
    .replace(/^Opština\s+/i, "")
    .replace(/\bBosna i Hercegovina\b/gi, "BiH")
    .replace(/\bFederacija Bosne i Hercegovine\b/gi, "FBiH")
    .replace(/\bRepublika Srpska\b/gi, "RS")
    .replace(/\bBrčko Distrikt\b/gi, "Brčko")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (REGION_SHORTCUTS[token]) return REGION_SHORTCUTS[token];

  token = token
    .replace(/Bosansko-podrinjski(?:\s+kanton)?\s+Goražde/gi, "BPK Goražde")
    .replace(/\bkanton\b/gi, "")
    .replace(/\bžupanija\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  return token;
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

const toText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    return String(
      value?.translated_name || value?.name || value?.title || "",
    ).trim();
  }
  return "";
};

const ProductLocation = ({ productDetails, onMapOpen }) => {
  const currentLanguage = useSelector(CurrentLanguageData);
  const [resolvedLocationByPin, setResolvedLocationByPin] = useState(null);

  const preciseLat = parseCoordinate(productDetails?.latitude);
  const preciseLng = parseCoordinate(productDetails?.longitude);

  useEffect(() => {
    let cancelled = false;

    const resolveByPin = async () => {
      if (preciseLat === null || preciseLng === null) {
        setResolvedLocationByPin(null);
        return;
      }

      try {
        const response = await getLocationApi.getLocation({
          lat: preciseLat,
          lng: preciseLng,
          lang: currentLanguage?.code || "bs",
        });

        if (cancelled) return;
        if (response?.data?.error === true) {
          setResolvedLocationByPin(null);
          return;
        }

        const payload = response?.data?.data;
        const result = Array.isArray(payload)
          ? payload[0] || {}
          : payload || {};
        const area = result?.area_translation || result?.area || "";
        const city = result?.city_translation || result?.city || "";
        const state = result?.state_translation || result?.state || "";
        const country = result?.country_translation || result?.country || "";
        const composedAddress = [area, city, state, country]
          .filter(Boolean)
          .join(", ");

        setResolvedLocationByPin({
          area,
          city,
          state,
          country,
          address:
            composedAddress ||
            [city, state, country].filter(Boolean).join(", "),
        });
      } catch {
        if (!cancelled) {
          setResolvedLocationByPin(null);
        }
      }
    };

    resolveByPin();
    return () => {
      cancelled = true;
    };
  }, [currentLanguage?.code, preciseLat, preciseLng]);

  const structuredLocationText = useMemo(() => {
    const areaName = toText(
      productDetails?.area?.translated_name ||
        productDetails?.area?.name ||
        productDetails?.area_name,
    );
    const city = toText(productDetails?.city);
    const state = toText(productDetails?.state);
    const country = toText(productDetails?.country);
    return [areaName, city, state, country].filter(Boolean).join(", ");
  }, [
    productDetails?.area,
    productDetails?.area_name,
    productDetails?.city,
    productDetails?.country,
    productDetails?.state,
  ]);

  const fallbackLocationText = useMemo(
    () =>
      productDetails?.address ||
      productDetails?.formatted_address ||
      productDetails?.translated_item?.address ||
      productDetails?.translated_item?.formatted_address ||
      productDetails?.translated_address ||
      productDetails?.address_translated ||
      "",
    [
      productDetails?.address,
      productDetails?.formatted_address,
      productDetails?.translated_address,
      productDetails?.address_translated,
      productDetails?.translated_item?.address,
      productDetails?.translated_item?.formatted_address,
    ],
  );

  const effectiveLocationText = useMemo(() => {
    if (preciseLat !== null && preciseLng !== null) {
      return (
        resolvedLocationByPin?.address ||
        fallbackLocationText ||
        structuredLocationText ||
        "Lokacija označena na mapi"
      );
    }

    return (
      fallbackLocationText ||
      resolvedLocationByPin?.address ||
      structuredLocationText
    );
  }, [
    fallbackLocationText,
    preciseLat,
    preciseLng,
    resolvedLocationByPin?.address,
    structuredLocationText,
  ]);
  const locationParts = useMemo(
    () => parseLocationParts(effectiveLocationText),
    [effectiveLocationText],
  );
  const normalizedLocationParts = useMemo(
    () => locationParts.map(normalizeLocationToken).filter(Boolean),
    [locationParts],
  );

  const countryLabel = useMemo(
    () => normalizedLocationParts.at(-1) || "BiH",
    [normalizedLocationParts],
  );
  const regionLabel = useMemo(
    () => normalizedLocationParts.at(-2) || "",
    [normalizedLocationParts],
  );
  const zoneLocation = useMemo(() => {
    if (!normalizedLocationParts.length) return "";
    const zoneParts = normalizedLocationParts.slice(
      0,
      Math.max(0, normalizedLocationParts.length - 2),
    );
    return zoneParts.slice(0, 2).join(", ");
  }, [normalizedLocationParts]);
  const shortLocation = useMemo(() => {
    const primary =
      zoneLocation || [regionLabel, countryLabel].filter(Boolean).join(", ");
    return primary || "Lokacija nije specificirana";
  }, [countryLabel, regionLabel, zoneLocation]);

  const obscuredCoordinates = useMemo(() => {
    if (preciseLat === null || preciseLng === null) return null;
    return obfuscateCoordinates(
      preciseLat,
      preciseLng,
      `${productDetails?.id || productDetails?.slug || "listing"}-${effectiveLocationText}`,
    );
  }, [
    preciseLat,
    preciseLng,
    productDetails?.id,
    productDetails?.slug,
    effectiveLocationText,
  ]);

  const hasCoordinates = Boolean(obscuredCoordinates);
  const locationHeaderHint = hasCoordinates
    ? "Prikazujemo okvirnu zonu radi privatnosti prodavača."
    : "Lokacija je informativna (grad/općina), a tačnu adresu potvrđuje prodavač.";
  const privacyHint = hasCoordinates
    ? "Tačna adresa nije javno prikazana i dijeli se po dogovoru sa prodavačem."
    : "Prikazana lokacija je informativna i može odstupati od tačne adrese.";

  const handleShowMapClick = () => {
    const mapQuery = hasCoordinates
      ? `${obscuredCoordinates.lat},${obscuredCoordinates.lng}`
      : shortLocation || "Bosna i Hercegovina";
    const googleMapsUrl = hasCoordinates
      ? `https://www.google.com/maps?q=${mapQuery}&z=13&t=m`
      : `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=10&t=m`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleDirectionsClick = () => {
    const destination = hasCoordinates
      ? `${obscuredCoordinates.lat},${obscuredCoordinates.lng}`
      : shortLocation || "Bosna i Hercegovina";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      destination,
    )}&travelmode=driving`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleCopyLocation = async () => {
    const locationForCopy = zoneLocation
      ? `${shortLocation} (${zoneLocation})`
      : shortLocation || effectiveLocationText;
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
      getExtraDetailValue(productDetails?.extra_details, [
        "povrsina",
        "quadrature",
        "m2",
        "area",
      ]);

    const rooms =
      productDetails?.bedrooms ||
      productDetails?.rooms ||
      getExtraDetailValue(productDetails?.extra_details, [
        "broj_soba",
        "sobe",
        "rooms",
        "bedrooms",
      ]);

    const roomType = getExtraDetailValue(productDetails?.extra_details, [
      "tip_stana",
      "room_type",
      "tip_nekretnine",
      "property_type",
    ]);

    const image =
      productDetails?.image ||
      productDetails?.gallery_images?.[0]?.image ||
      productDetails?.gallery?.[0];

    return {
      title:
        productDetails?.translated_item?.name ||
        productDetails?.name ||
        productDetails?.title,
      price: parseFloat(productDetails?.price) || 0,
      image,
      area,
      rooms,
      roomType,
      createdAt: productDetails?.created_at,
      location: shortLocation,
      privacyMode: true,
    };
  }, [productDetails, shortLocation]);

  return (
    <div className="flex flex-col rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 dark:border-slate-800 dark:bg-slate-900">
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-5 py-4 border-b border-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
              <MdMap className="text-slate-600 text-xl dark:text-slate-300" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                Lokacija oglasa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {locationHeaderHint}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col p-4 lg:p-5 gap-4">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
          <div className="p-2 bg-primary/10 rounded-lg mt-0.5 text-primary dark:bg-primary/20 dark:text-primary-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              id="Location-2-Fill--Streamline-Mingcute-Fill"
              height="26"
              width="26"
            >
              <g fill="none" fillRule="evenodd">
                <path
                  d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z"
                  strokeWidth="0.6667"
                ></path>
                <path
                  fill="#0ab6af"
                  fillRule="nonzero"
                  d="M4.4799999999999995 11.093333333333334a0.6666666666666666 0.6666666666666666 0 0 1 0.37333333333333335 1.2799999999999998c-0.3333333333333333 0.09733333333333333 -0.5733333333333333 0.19999999999999998 -0.7273333333333333 0.29333333333333333 0.15866666666666665 0.09533333333333333 0.4093333333333333 0.20199999999999999 0.7573333333333332 0.30133333333333334C5.653333333333333 13.187999999999999 6.755333333333333 13.333333333333332 8 13.333333333333332s2.3466666666666667 -0.14533333333333331 3.1166666666666663 -0.36533333333333334c0.3486666666666667 -0.09933333333333333 0.5986666666666667 -0.206 0.7573333333333332 -0.30133333333333334 -0.15333333333333332 -0.09333333333333334 -0.3933333333333333 -0.19599999999999998 -0.7266666666666667 -0.29333333333333333a0.6666666666666666 0.6666666666666666 0 0 1 0.3726666666666667 -1.2799999999999998c0.44533333333333336 0.13 0.8533333333333333 0.29666666666666663 1.1666666666666665 0.5106666666666666 0.29 0.1993333333333333 0.6466666666666666 0.5466666666666666 0.6466666666666666 1.0626666666666666 0 0.522 -0.36533333333333334 0.872 -0.6599999999999999 1.0713333333333332 -0.31866666666666665 0.21466666666666667 -0.7353333333333333 0.38199999999999995 -1.1906666666666665 0.512C10.564 14.513333333333332 9.333333333333332 14.666666666666666 8 14.666666666666666s-2.564 -0.15333333333333332 -3.482666666666667 -0.41666666666666663c-0.45533333333333337 -0.13 -0.872 -0.29733333333333334 -1.1906666666666665 -0.512 -0.29466666666666663 -0.19999999999999998 -0.6599999999999999 -0.5493333333333332 -0.6599999999999999 -1.0713333333333332 0 -0.516 0.3566666666666667 -0.8633333333333333 0.6466666666666666 -1.0626666666666666 0.3133333333333333 -0.214 0.7213333333333334 -0.3806666666666666 1.1666666666666665 -0.5106666666666666ZM8 1.3333333333333333a5 5 0 0 1 5 5c0 1.712 -0.9333333333333332 3.1039999999999996 -1.9 4.093333333333333 -0.41 0.41866666666666663 -0.84 0.7793333333333333 -1.2353333333333332 1.0766666666666667 -0.39599999999999996 0.29733333333333334 -1.3013333333333332 0.8546666666666667 -1.3013333333333332 0.8546666666666667a1.14 1.14 0 0 1 -1.1266666666666665 0 13.824 13.824 0 0 1 -1.3013333333333332 -0.8546666666666667A10.86 10.86 0 0 1 4.8999999999999995 10.426666666666666C3.9333333333333336 9.437333333333333 3 8.045333333333332 3 6.333333333333333A5 5 0 0 1 8 1.3333333333333333Zm0 3.6666666666666665a1.3333333333333333 1.3333333333333333 0 1 0 0 2.6666666666666665 1.3333333333333333 1.3333333333333333 0 0 0 0 -2.6666666666666665Z"
                  strokeWidth="0.6667"
                ></path>
              </g>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 break-words leading-relaxed dark:text-slate-200">
              {shortLocation}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {regionLabel ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Regija: {regionLabel}
                </span>
              ) : null}
              {countryLabel ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Država: {countryLabel}
                </span>
              ) : null}
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {privacyHint}
            </p>
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
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm dark:bg-slate-700 dark:hover:bg-slate-600"
            onClick={handleShowMapClick}
          >
            <MdOpenInNew className="text-lg" />
            Otvori zonu
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 text-primary hover:bg-primary/20 font-bold rounded-xl transition-all active:scale-[0.98] border border-primary/20 dark:bg-primary/20 dark:text-primary-200 dark:hover:bg-primary/30"
            onClick={handleDirectionsClick}
          >
            <MdDirections className="text-lg" />
            Ruta do zone
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
