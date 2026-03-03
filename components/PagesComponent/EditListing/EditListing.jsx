"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import {
  editItemApi,
  getCustomFieldsApi,
  getMyItemsApi,
  getParentCategoriesApi,
  socialMediaApi,
} from "@/utils/api";
import {
  filterNonDefaultTranslations,
  getMainDetailsTranslations,
  isValidURL,
  prefillExtraDetails,
  prepareCustomFieldFiles,
  prepareCustomFieldTranslations,
  t,
  validateExtraDetails,
  formatPriceAbbreviated,
} from "@/utils";
import { runSocialOAuthPopup } from "@/utils/socialOAuth";
import {
  SOCIAL_POSTING_TEMP_UNAVAILABLE,
  SOCIAL_POSTING_UNAVAILABLE_MESSAGE,
} from "@/utils/socialAvailability";
import {
  extractAreaM2FromCustomFieldValues,
  isRealEstateCategoryPath,
  REAL_ESTATE_PRICE_MODE_MANUAL,
  resolveRealEstatePerSquareValue,
} from "@/utils/realEstatePricing";
import EditComponentOne from "./EditComponentOne";
import EditComponentTwo from "./EditComponentTwo";
import EditComponentThree from "./EditComponentThree";
import EditComponentFour from "./EditComponentFour";
import ProductCard from "@/components/Common/ProductCard";
import { toast } from "@/utils/toastBs";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useDispatch, useSelector } from "react-redux";
import AdsEditSuccessModal from "./AdsEditSuccessModal";
import CustomLink from "@/components/Common/CustomLink";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getDefaultLanguageCode,
  getLanguages,
} from "@/redux/reducer/settingSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { setHideMobileBottomNav } from "@/redux/reducer/globalStateSlice";
import AdLanguageSelector from "../AdsListing/AdLanguageSelector";
import PageLoader from "@/components/Common/PageLoader";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import {
  CheckCircle2,
  Circle,
  Award,
  TrendingUp,
  Zap,
  Star,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from "@/components/Common/UnifiedIconPack";
import {
  resolveLmxPhoneCountry,
  resolveLmxPhoneDialCode,
} from "@/components/Common/phoneInputTheme";

// =======================================================
// MEDIA HELPERS (client-side)
// - Images: compress + watermark IMMEDIATELY on select
// - Video: we only validate size here (compression should be server-side)
// =======================================================
const WATERMARK_TEXT_DEFAULT = "LMX.ba";
const WATERMARK_IMAGE_DEFAULT = "/assets/lmx-watermark.png";

const isFileLike = (v) =>
  typeof File !== "undefined" && (v instanceof File || v instanceof Blob);

const safeObjectUrl = (v) => {
  try {
    if (typeof v === "string") return v;
    if (v && typeof v === "object") {
      if (v?.url) return v.url;
      if (v?.image) return v.image;
      if (v?.original_url) return v.original_url;
      if (v?.path) return v.path;
    }
    if (isFileLike(v)) return URL.createObjectURL(v);
  } catch {}
  return "";
};

const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });

const toCanvasBlob = (canvas, type = "image/jpeg", quality = 0.92) =>
  new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));

const randBetween = (min, max) => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return min;
  return min + Math.random() * (max - min);
};

const getRandomEdgePlacement = ({
  width,
  height,
  watermarkWidth,
  watermarkHeight,
  padding,
}) => {
  const minX = padding;
  const maxX = Math.max(padding, width - watermarkWidth - padding);
  const minY = padding;
  const maxY = Math.max(padding, height - watermarkHeight - padding);
  const edges = ["top", "right", "bottom", "left"];
  const edge = edges[Math.floor(Math.random() * edges.length)];

  if (edge === "top") {
    return { x: Math.round(randBetween(minX, maxX)), y: Math.round(minY) };
  }
  if (edge === "right") {
    return { x: Math.round(maxX), y: Math.round(randBetween(minY, maxY)) };
  }
  if (edge === "bottom") {
    return { x: Math.round(randBetween(minX, maxX)), y: Math.round(maxY) };
  }
  return { x: Math.round(minX), y: Math.round(randBetween(minY, maxY)) };
};

const compressAndWatermarkImage = async (
  file,
  {
    maxSize = 2000,
    quality = 0.92,
    watermarkUrl = WATERMARK_IMAGE_DEFAULT,
    watermarkText = WATERMARK_TEXT_DEFAULT,
    watermarkOpacity = 0.55,
    watermarkPadding = 18,
    watermarkFontSize = 22,
    minBytesToProcess = 250 * 1024, // ne diraj mini fajlove
  } = {},
) => {
  if (!isFileLike(file)) return file;

  // Ako je već mali, preskoči (čuva 100% kvalitet)
  if (file.size && file.size < minBytesToProcess) return file;

  const src = safeObjectUrl(file);
  if (!src) return file;

  let img;
  try {
    img = await loadImageElement(src);
  } finally {
    try {
      URL.revokeObjectURL(src);
    } catch {}
  }

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  const scale = Math.min(1, maxSize / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(img, 0, 0, outW, outH);

  // Watermark (random uz jednu od ivica, nikad centar)
  if (watermarkUrl || watermarkText) {
    try {
      const pad = Math.max(10, Math.round((outW / 1000) * watermarkPadding));
      let drawn = false;

      if (watermarkUrl) {
        const wmImg = await loadImageElement(watermarkUrl);
        const wmWidth = Math.max(32, Math.round(outW * 0.15));
        const wmAspect =
          (wmImg.naturalWidth || wmImg.width) /
          Math.max(1, wmImg.naturalHeight || wmImg.height);
        const wmHeight = Math.max(16, Math.round(wmWidth / wmAspect));
        const { x, y } = getRandomEdgePlacement({
          width: outW,
          height: outH,
          watermarkWidth: wmWidth,
          watermarkHeight: wmHeight,
          padding: pad,
        });

        ctx.save();
        ctx.globalAlpha = Math.min(1, watermarkOpacity + 0.2);
        ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
        ctx.restore();
        drawn = true;
      }

      if (!drawn && watermarkText) {
        const fontSize = Math.max(
          14,
          Math.round((outW / 1000) * watermarkFontSize),
        );
        ctx.save();
        ctx.globalAlpha = watermarkOpacity;
        ctx.font = `700 ${fontSize}px sans-serif`;
        ctx.textBaseline = "top";

        const metrics = ctx.measureText(watermarkText);
        const textW = Math.max(1, Math.round(metrics.width));
        const textH = Math.max(fontSize, Math.round(fontSize * 1.12));
        const { x, y } = getRandomEdgePlacement({
          width: outW,
          height: outH,
          watermarkWidth: textW,
          watermarkHeight: textH,
          padding: pad,
        });

        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.08));
        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);
        ctx.restore();
      }
    } catch (e) {
      console.warn("Watermark error:", e);
    }
  }

  const outBlob = await toCanvasBlob(canvas, "image/jpeg", quality);
  if (!outBlob) return file;

  const newName = (file.name || "image")
    .replace(/\.(png|jpe?g|webp|heic|heif)$/i, "")
    .concat(".jpg");

  return new File([outBlob], newName, { type: "image/jpeg" });
};

const normalizeFilesArray = (maybe) => {
  if (!maybe) return [];
  if (Array.isArray(maybe)) return maybe;
  // FileList
  if (typeof FileList !== "undefined" && maybe instanceof FileList)
    return Array.from(maybe);
  return [maybe];
};

const processImagesArray = async (files, opts) => {
  const arr = normalizeFilesArray(files);
  const out = [];
  for (const f of arr) {
    if (isFileLike(f)) out.push(await compressAndWatermarkImage(f, opts));
    else out.push(f);
  }
  return out;
};

const bytesToMB = (bytes = 0) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");

const stripCountryCodePrefix = (mobile, countryCode) => {
  const mobileDigits = digitsOnly(mobile);
  const ccDigits = digitsOnly(countryCode);
  if (!mobileDigits) return "";
  if (!ccDigits) return mobileDigits;
  if (mobileDigits.startsWith(ccDigits))
    return mobileDigits.slice(ccDigits.length);
  return mobileDigits;
};

const toBoolLoose = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      [
        "true",
        "yes",
        "da",
        "on",
        "enabled",
        "verified",
        "verificiran",
      ].includes(normalized)
    )
      return true;
    if (
      [
        "false",
        "no",
        "ne",
        "off",
        "disabled",
        "unverified",
        "nije verificiran",
      ].includes(normalized)
    )
      return false;
  }
  return Boolean(value);
};

const extractTempMediaId = (value) => {
  if (!value || typeof value !== "object") return null;
  const explicitTempId =
    value?.temp_id ??
    value?.tempId ??
    value?.upload_id ??
    value?.uploadId ??
    value?.media_id ??
    value?.mediaId ??
    value?.file_id ??
    value?.fileId ??
    null;

  if (
    explicitTempId !== null &&
    explicitTempId !== undefined &&
    String(explicitTempId).trim() !== ""
  ) {
    return explicitTempId;
  }

  const hasPersistentImageUrl = Boolean(
    value?.image || value?.original_url || value?.path,
  );
  const hasTempUrlOnly = Boolean(value?.url) && !hasPersistentImageUrl;
  const hasTempMarker =
    value?.is_temp === true ||
    value?.isTemp === true ||
    String(value?.source || "").toLowerCase() === "temp" ||
    String(value?.storage || "").toLowerCase() === "temp";

  if (
    (hasTempUrlOnly || hasTempMarker) &&
    value?.id !== null &&
    value?.id !== undefined
  ) {
    return value.id;
  }

  return null;
};

const extractPersistentMediaId = (value) => {
  if (!value || typeof value !== "object") return null;
  const persistentId = value?.id;
  if (persistentId === null || persistentId === undefined) return null;

  const hasPersistentImageUrl = Boolean(
    value?.image || value?.original_url || value?.path,
  );
  if (!hasPersistentImageUrl) return null;

  return persistentId;
};

const EDIT_DRAFT_STORAGE_PREFIX = "lmx:edit-ad-draft:v2:";
const EDIT_DRAFT_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const EDIT_DRAFT_DEBOUNCE_MS = 1800;
const EDIT_SERVER_AUTOSAVE_DEBOUNCE_MS = 9000;

const parseCoordinateValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasPreciseCoordinatePair = (latValue, lngValue) =>
  parseCoordinateValue(latValue) !== null &&
  parseCoordinateValue(lngValue) !== null;

const normalizeRealEstateLocationSource = ({
  source,
  hasPreciseCoordinates,
}) => {
  const normalizedSource = String(source || "").toLowerCase().trim();
  if (normalizedSource === "manual") return "manual";
  if (normalizedSource === "profile") return "profile";
  if (normalizedSource === "map") return "map";
  return hasPreciseCoordinates ? "map" : "manual";
};

const parseAreaId = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

const toDraftSafeValue = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (isFileLike(value)) return undefined;
  if (typeof value === "function") return undefined;

  if (Array.isArray(value)) {
    return value
      .map((entry) => toDraftSafeValue(entry))
      .filter((entry) => entry !== undefined);
  }

  if (typeof value === "object") {
    const out = {};
    Object.entries(value).forEach(([key, entry]) => {
      const normalized = toDraftSafeValue(entry);
      if (normalized !== undefined) out[key] = normalized;
    });
    return out;
  }

  return value;
};

const formatDraftSavedAgo = (savedAtIso, nowTs = Date.now()) => {
  if (!savedAtIso) return "";
  const savedTs = new Date(savedAtIso).getTime();
  if (!Number.isFinite(savedTs)) return "";

  const diffSec = Math.max(0, Math.floor((nowTs - savedTs) / 1000));
  if (diffSec < 3) return "upravo sada";
  if (diffSec < 60) return `prije ${diffSec}s`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `prije ${diffMin}min`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `prije ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `prije ${diffDays}d`;
};

const parseJsonSafe = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const normalizeBooleanValue = (value) => {
  if (value === true || value === 1 || value === "1") return true;
  if (value === false || value === 0 || value === "0") return false;

  const normalized = normalizeText(value);
  if (!normalized) return null;

  if (
    [
      "true",
      "yes",
      "da",
      "odmah",
      "dostupno",
      "dostupan",
      "moguce",
      "moguca",
      "moze",
      "ukljuceno",
      "enabled",
      "on",
      "active",
      "aktivan",
    ].includes(normalized)
  ) {
    return true;
  }

  if (
    [
      "false",
      "no",
      "ne",
      "nije",
      "nedostupno",
      "nedostupan",
      "nemoguce",
      "nemoguca",
      "ne moze",
      "iskljuceno",
      "disabled",
      "off",
      "inactive",
      "neaktivan",
    ].includes(normalized)
  ) {
    return false;
  }

  return null;
};

const readBooleanFromCandidates = (candidates = []) => {
  for (const candidate of candidates) {
    const parsed = normalizeBooleanValue(candidate);
    if (parsed !== null) return parsed;
  }
  return null;
};

const readBooleanFromCustomFields = (customFieldsValue, keys = []) => {
  const keysSet = new Set(keys);
  const customFields = parseJsonSafe(customFieldsValue);
  if (!customFields || typeof customFields !== "object") return null;

  const walk = (node) => {
    if (!node || typeof node !== "object") return null;

    for (const [key, value] of Object.entries(node)) {
      if (keysSet.has(key)) {
        const parsed = normalizeBooleanValue(value);
        if (parsed !== null) return parsed;
      }

      if (value && typeof value === "object") {
        const nested = walk(value);
        if (nested !== null) return nested;
      }
    }

    return null;
  };

  return walk(customFields);
};

const getTranslatedCustomFields = (listingData = {}) => {
  const fields = [];
  if (Array.isArray(listingData?.all_translated_custom_fields)) {
    fields.push(...listingData.all_translated_custom_fields);
  }
  if (Array.isArray(listingData?.translated_custom_fields)) {
    fields.push(...listingData.translated_custom_fields);
  }
  return fields;
};

const getTranslatedFieldValues = (field = {}) => {
  const candidates = [
    field?.translated_selected_values,
    field?.selected_values,
    field?.value,
    field?.translated_value,
    field?.selected_value,
    field?.translated_selected_value,
  ];

  const values = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) values.push(...candidate);
    else if (candidate !== undefined && candidate !== null)
      values.push(candidate);
  }
  return values;
};

const readBooleanFromTranslatedFields = (listingData = {}, hints = []) => {
  const normalizedHints = hints.map((hint) => normalizeText(hint));
  const fields = getTranslatedCustomFields(listingData);
  if (!fields.length) return null;

  for (const field of fields) {
    const fieldName = normalizeText(
      field?.translated_name || field?.name || "",
    );
    if (!fieldName) continue;
    if (!normalizedHints.some((hint) => fieldName.includes(hint))) continue;

    const parsed = readBooleanFromCandidates(getTranslatedFieldValues(field));
    if (parsed !== null) return parsed;
  }

  return null;
};

const readAvailableNowFromListingData = (listingData = {}) => {
  const directCandidates = [
    listingData?.available_now,
    listingData?.is_available,
    listingData?.is_avaible,
    listingData?.isAvailable,
    listingData?.availableNow,
    listingData?.dostupno_odmah,
    listingData?.ready_for_pickup,
  ];

  const direct = readBooleanFromCandidates(directCandidates);
  if (direct !== null) return direct;

  const fromCustomFields = readBooleanFromCustomFields(
    listingData?.custom_fields,
    [
      "available_now",
      "is_available",
      "is_avaible",
      "isAvailable",
      "availableNow",
      "dostupno_odmah",
      "ready_for_pickup",
    ],
  );
  if (fromCustomFields !== null) return fromCustomFields;

  const fromTranslatedFields = readBooleanFromTranslatedFields(listingData, [
    "dostup",
    "available",
    "isporuk",
    "odmah",
  ]);
  if (fromTranslatedFields !== null) return fromTranslatedFields;

  return false;
};

const readExchangeFromListingData = (listingData = {}) => {
  const directCandidates = [
    listingData?.exchange_possible,
    listingData?.is_exchange,
    listingData?.is_exchange_possible,
    listingData?.allow_exchange,
    listingData?.exchange,
    listingData?.zamjena,
    listingData?.zamena,
  ];

  const direct = readBooleanFromCandidates(directCandidates);
  if (direct !== null) return direct;

  const fromCustomFields = readBooleanFromCustomFields(
    listingData?.custom_fields,
    [
      "exchange_possible",
      "is_exchange",
      "is_exchange_possible",
      "allow_exchange",
      "exchange",
      "zamjena",
      "zamena",
      "trade",
      "swap",
    ],
  );
  if (fromCustomFields !== null) return fromCustomFields;

  const fromTranslatedFields = readBooleanFromTranslatedFields(listingData, [
    "zamjen",
    "zamena",
    "exchange",
    "trade",
    "swap",
  ]);
  if (fromTranslatedFields !== null) return fromTranslatedFields;

  return false;
};

const EditListing = ({ id }) => {
  const dispatch = useDispatch();
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [step, setStep] = useState(1);
  const [CreatedAdSlug, setCreatedAdSlug] = useState("");
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [OtherImages, setOtherImages] = useState([]);
  const otherImagesRef = useRef([]);
  const latestListingFetchRef = useRef(0);
  const stepRailRef = useRef(null);
  const stepNodeRefs = useRef([]);
  const wizardTopRef = useRef(null);
  const hasInitializedStepRef = useRef(false);
  const hasAppliedLocalDraftRef = useRef(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStatus, setDraftStatus] = useState("idle");
  const [draftLocalSavedAt, setDraftLocalSavedAt] = useState("");
  const [draftServerSavedAt, setDraftServerSavedAt] = useState("");
  const [draftTickerTs, setDraftTickerTs] = useState(() => Date.now());
  const lastServerAutosaveHashRef = useRef("");
  useEffect(() => {
    otherImagesRef.current = OtherImages;
  }, [OtherImages]);
  const [Location, setLocation] = useState({});
  const [filePreviews, setFilePreviews] = useState({});
  const [deleteImagesId, setDeleteImagesId] = useState("");
  const [isAdPlaced, setIsAdPlaced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [addVideoToStory, setAddVideoToStory] = useState(false);
  const [publishToInstagram, setPublishToInstagram] = useState(false);
  const [instagramSourceUrl, setInstagramSourceUrl] = useState("");
  const [instagramConnection, setInstagramConnection] = useState({
    loading: true,
    connected: false,
    account: null,
    syncing: false,
  });
  const [deleteVideo, setDeleteVideo] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [availableNow, setAvailableNow] = useState(false);
  const [exchangePossible, setExchangePossible] = useState(false);
  const [stepRailFill, setStepRailFill] = useState({ left: 0, width: 0 });

  const [isFeatured, setIsFeatured] = useState(false);

  const languages = useSelector(getLanguages);
  const defaultLanguageCode = useSelector(getDefaultLanguageCode);
  const userData = useSelector(userSignUpData);
  const defaultLangId = languages?.find(
    (lang) => lang.code === defaultLanguageCode,
  )?.id;
  const regionCode = resolveLmxPhoneCountry(
    userData?.region_code?.toLowerCase() ||
      process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase() ||
      "ba",
  );
  const countryCode =
    digitsOnly(userData?.country_code) || resolveLmxPhoneDialCode(regionCode);
  const mobile = stripCountryCodePrefix(userData?.mobile, countryCode);
  const sellerPhoneDisplay = mobile ? `+${countryCode}${mobile}` : "";
  const isPhoneVerified = useMemo(
    () =>
      toBoolLoose(userData?.mobile_verified) ||
      toBoolLoose(userData?.phone_verified) ||
      Boolean(userData?.mobile_verified_at) ||
      Boolean(userData?.phone_verified_at),
    [
      userData?.mobile_verified,
      userData?.phone_verified,
      userData?.mobile_verified_at,
      userData?.phone_verified_at,
    ],
  );
  const isEmailVerified = useMemo(
    () =>
      toBoolLoose(userData?.email_verified) ||
      Boolean(userData?.email_verified_at),
    [userData?.email_verified, userData?.email_verified_at],
  );
  const hasVerificationWarnings = !isPhoneVerified || !isEmailVerified;
  const editDraftStorageKey = useMemo(
    () => `${EDIT_DRAFT_STORAGE_PREFIX}${id || "unknown"}`,
    [id],
  );

  const [extraDetails, setExtraDetails] = useState({
    [defaultLangId]: {},
  });
  const [langId, setLangId] = useState(defaultLangId);

  const [translations, setTranslations] = useState({
    [defaultLangId]: {},
  });
  useEffect(() => {
    setTranslations((prev) => {
      if (!prev || typeof prev !== "object") return prev;
      const keys = Object.keys(prev);
      if (keys.length === 0) return prev;
      const normalizedRegion = String(regionCode || "").toLowerCase();
      let changed = false;
      const next = { ...prev };

      keys.forEach((key) => {
        const prevLang = prev?.[key] || {};
        if (
          String(prevLang?.contact || "") === String(mobile || "") &&
          String(prevLang?.country_code || "") === String(countryCode || "") &&
          String(prevLang?.region_code || "").toLowerCase() === normalizedRegion
        ) {
          return;
        }
        next[key] = {
          ...prevLang,
          contact: mobile,
          country_code: countryCode,
          region_code: regionCode,
        };
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [countryCode, mobile, regionCode]);

  const hasTextbox = customFields.some((field) => field.type === "textbox");
  const primaryLangId = useMemo(() => {
    if (
      defaultLangId !== undefined &&
      defaultLangId !== null &&
      translations?.[defaultLangId]
    ) {
      return defaultLangId;
    }
    if (langId !== undefined && langId !== null && translations?.[langId]) {
      return langId;
    }
    const firstTranslationKey = Object.keys(translations || {}).find(
      (key) => translations?.[key] && typeof translations[key] === "object",
    );
    return firstTranslationKey ?? defaultLangId ?? langId;
  }, [defaultLangId, langId, translations]);

  const defaultDetails = translations?.[primaryLangId] || {};
  const currentDetails = useMemo(
    () => ({
      ...(translations?.[primaryLangId] || {}),
      ...(translations?.[langId] || {}),
    }),
    [langId, primaryLangId, translations],
  );
  const currentExtraDetails =
    extraDetails?.[langId] || extraDetails?.[primaryLangId] || {};
  const draftSavedAgoLabel = useMemo(
    () => formatDraftSavedAgo(draftLocalSavedAt, draftTickerTs),
    [draftLocalSavedAt, draftTickerTs],
  );
  const draftServerSavedAgoLabel = useMemo(
    () => formatDraftSavedAgo(draftServerSavedAt, draftTickerTs),
    [draftServerSavedAt, draftTickerTs],
  );

  useEffect(() => {
    if (!draftLocalSavedAt && !draftServerSavedAt) return undefined;
    const intervalId = window.setInterval(() => {
      setDraftTickerTs(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [draftLocalSavedAt, draftServerSavedAt]);

  const localDraftSnapshot = useMemo(
    () => ({
      step,
      langId,
      translations: toDraftSafeValue(translations),
      extraDetails: toDraftSafeValue(extraDetails),
      uploadedImages: toDraftSafeValue(uploadedImages),
      otherImages: toDraftSafeValue(OtherImages),
      video: toDraftSafeValue(video),
      location: toDraftSafeValue(Location),
      addVideoToStory: Boolean(addVideoToStory),
      publishToInstagram: Boolean(publishToInstagram),
      instagramSourceUrl: String(instagramSourceUrl || ""),
      availableNow: Boolean(availableNow),
      exchangePossible: Boolean(exchangePossible),
    }),
    [
      OtherImages,
      Location,
      addVideoToStory,
      availableNow,
      exchangePossible,
      extraDetails,
      instagramSourceUrl,
      langId,
      publishToInstagram,
      step,
      translations,
      uploadedImages,
      video,
    ],
  );
  const serializedLocalDraftSnapshot = useMemo(
    () => JSON.stringify(localDraftSnapshot),
    [localDraftSnapshot],
  );

  useEffect(() => {
    if (!draftHydrated || !editDraftStorageKey || typeof window === "undefined")
      return undefined;

    const timeoutId = window.setTimeout(() => {
      try {
        setDraftStatus("saving");
        const payload = {
          savedAt: new Date().toISOString(),
          data: localDraftSnapshot,
        };
        window.localStorage.setItem(
          editDraftStorageKey,
          JSON.stringify(payload),
        );
        setDraftLocalSavedAt(payload.savedAt);
        setDraftTickerTs(Date.now());
        setDraftStatus("saved");
      } catch (error) {
        console.error("Greška pri autosave nacrta izmjene:", error);
        setDraftStatus("error");
      }
    }, EDIT_DRAFT_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    draftHydrated,
    editDraftStorageKey,
    localDraftSnapshot,
    serializedLocalDraftSnapshot,
  ]);

  const is_job_category =
    Number(
      selectedCategoryPath[selectedCategoryPath.length - 1]?.is_job_category,
    ) === 1;
  const isPriceOptional =
    Number(
      selectedCategoryPath[selectedCategoryPath.length - 1]?.price_optional,
    ) === 1;
  const is_real_estate = useMemo(
    () => isRealEstateCategoryPath(selectedCategoryPath),
    [selectedCategoryPath],
  );
  const realEstateAreaM2 = useMemo(
    () =>
      extractAreaM2FromCustomFieldValues({
        customFields,
        extraDetails,
        languageId: langId,
        fallbackLanguageId: defaultLangId,
      }),
    [customFields, defaultLangId, extraDetails, langId],
  );
  const realEstatePriceState = useMemo(
    () =>
      resolveRealEstatePerSquareValue({
        details: defaultDetails,
        areaM2: realEstateAreaM2,
        totalPrice: defaultDetails?.price,
      }),
    [defaultDetails, realEstateAreaM2],
  );
  const effectiveRealEstateTotalPrice = useMemo(() => {
    if (!is_real_estate || !realEstatePriceState.enabled) return null;
    if (realEstatePriceState.mode !== REAL_ESTATE_PRICE_MODE_MANUAL)
      return null;
    return realEstatePriceState.derivedTotalPrice;
  }, [is_real_estate, realEstatePriceState]);

  const serverAutosavePayload = useMemo(() => {
    if (!id) return null;
    const autosaveLat = parseCoordinateValue(Location?.lat);
    const autosaveLng = parseCoordinateValue(Location?.long);
    const hasPreciseAutosaveCoords =
      autosaveLat !== null && autosaveLng !== null;
    const normalizedAutosaveLocationSource = is_real_estate
      ? normalizeRealEstateLocationSource({
          source: Location?.location_source,
          hasPreciseCoordinates: hasPreciseAutosaveCoords,
        })
      : String(Location?.location_source || "manual").toLowerCase();
    const shouldUsePreciseAutosaveCoords =
      !is_real_estate ||
      (normalizedAutosaveLocationSource === "map" && hasPreciseAutosaveCoords);
    const normalizedAutosaveAreaId = parseAreaId(Location?.area_id);

    const payload = {
      id: Number(id),
      name: String(defaultDetails?.name || "").trim(),
      slug: String(defaultDetails?.slug || "").trim(),
      description: String(defaultDetails?.description || "").trim(),
      contact: mobile,
      country_code: countryCode,
      region_code: String(regionCode || "").toUpperCase(),
      available_now: Boolean(availableNow),
      exchange_possible: Boolean(exchangePossible),
      is_exchange: Boolean(exchangePossible),
      allow_exchange: Boolean(exchangePossible),
      video_link: String(defaultDetails?.video_link || "").trim(),
      instagram_source_url: String(instagramSourceUrl || "").trim(),
      address: Location?.address || "",
      formatted_address: Location?.formattedAddress || Location?.address || "",
      address_translated:
        Location?.address_translated || Location?.address || "",
      latitude: shouldUsePreciseAutosaveCoords
        ? is_real_estate
          ? autosaveLat
          : Location?.lat
        : null,
      longitude: shouldUsePreciseAutosaveCoords
        ? is_real_estate
          ? autosaveLng
          : Location?.long
        : null,
      location_source: normalizedAutosaveLocationSource,
      ...(is_real_estate &&
      normalizedAutosaveLocationSource === "map" &&
      hasPreciseAutosaveCoords
        ? {
            location_latitude: autosaveLat,
            location_longitude: autosaveLng,
          }
        : {}),
      country: Location?.country || "",
      state: Location?.state || "",
      city: Location?.city || "",
      ...(normalizedAutosaveAreaId ? { area_id: normalizedAutosaveAreaId } : {}),
    };

    const hasCoreLocation = Boolean(
      payload.country && payload.city && payload.address,
    );
    if (
      !payload.name ||
      !payload.slug ||
      !payload.description ||
      !payload.contact ||
      !hasCoreLocation
    ) {
      return null;
    }

    if (is_job_category) {
      if (
        defaultDetails?.min_salary !== undefined &&
        defaultDetails?.min_salary !== null
      ) {
        payload.min_salary = defaultDetails.min_salary;
      }
      if (
        defaultDetails?.max_salary !== undefined &&
        defaultDetails?.max_salary !== null
      ) {
        payload.max_salary = defaultDetails.max_salary;
      }
    } else {
      const resolvedPrice =
        is_real_estate && effectiveRealEstateTotalPrice
          ? effectiveRealEstateTotalPrice
          : defaultDetails?.price;
      payload.price_on_request = Boolean(defaultDetails?.price_on_request);
      payload.is_on_sale = Boolean(defaultDetails?.is_on_sale);
      payload.old_price = defaultDetails?.is_on_sale
        ? defaultDetails?.old_price
        : null;

      if (payload.price_on_request) {
        payload.price = 0;
      } else {
        const hasResolvedPrice =
          resolvedPrice !== undefined &&
          resolvedPrice !== null &&
          String(resolvedPrice).trim() !== "";
        if (!hasResolvedPrice) return null;
        payload.price = resolvedPrice;
      }
    }

    return payload;
  }, [
    Location?.address,
    Location?.address_translated,
    Location?.area_id,
    Location?.city,
    Location?.country,
    Location?.formattedAddress,
    Location?.lat,
    Location?.long,
    Location?.location_source,
    Location?.state,
    availableNow,
    countryCode,
    defaultDetails?.description,
    defaultDetails?.is_on_sale,
    defaultDetails?.max_salary,
    defaultDetails?.min_salary,
    defaultDetails?.name,
    defaultDetails?.old_price,
    defaultDetails?.price,
    defaultDetails?.price_on_request,
    defaultDetails?.slug,
    defaultDetails?.video_link,
    effectiveRealEstateTotalPrice,
    exchangePossible,
    id,
    instagramSourceUrl,
    is_job_category,
    is_real_estate,
    mobile,
    regionCode,
  ]);
  const serializedServerAutosavePayload = useMemo(
    () => JSON.stringify(serverAutosavePayload || {}),
    [serverAutosavePayload],
  );

  useEffect(() => {
    if (!draftHydrated || !serverAutosavePayload || isLoading || isAdPlaced)
      return undefined;

    const timeoutId = window.setTimeout(async () => {
      if (serializedServerAutosavePayload === lastServerAutosaveHashRef.current)
        return;
      try {
        setDraftStatus("saving");
        await editItemApi.editItem(serverAutosavePayload);
        lastServerAutosaveHashRef.current = serializedServerAutosavePayload;
        const nowIso = new Date().toISOString();
        setDraftServerSavedAt(nowIso);
        setDraftTickerTs(Date.now());
        setDraftStatus("saved");
      } catch (error) {
        console.error("Server autosave draft (edit) nije uspio:", error);
        setDraftStatus("error");
      }
    }, EDIT_SERVER_AUTOSAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [
    draftHydrated,
    isAdPlaced,
    isLoading,
    serializedServerAutosavePayload,
    serverAutosavePayload,
  ]);

  const completenessScore = useMemo(() => {
    let score = 0;
    if (selectedCategoryPath.length > 0) score += 20;
    if (defaultDetails.name && defaultDetails.description) {
      score += 20;
    }
    if (customFields.length === 0) {
      score += 20;
    } else {
      const filledFields = Object.keys(currentExtraDetails).filter(
        (key) => currentExtraDetails[key] && currentExtraDetails[key] !== "",
      ).length;
      score += (filledFields / customFields.length) * 20;
    }
    if (uploadedImages.length > 0) {
      score += 10;
      if (OtherImages.length >= 3) score += 10;
      else score += (OtherImages.length / 3) * 10;
    }
    if (Location?.country && Location?.city && Location?.address) {
      score += 20;
    }
    return Math.round(score);
  }, [
    Location,
    OtherImages,
    currentExtraDetails,
    customFields,
    defaultDetails,
    selectedCategoryPath,
    uploadedImages,
  ]);

  const qualityBadges = useMemo(() => {
    const badges = [];
    return badges;
  }, [uploadedImages, OtherImages, defaultDetails, completenessScore]);

  useEffect(() => {
    getSingleListingData();
  }, [CurrentLanguage.id, id]);

  const fetchCategoryPath = async (childCategoryId) => {
    try {
      const categoryResponse =
        await getParentCategoriesApi.getPaymentCategories({
          child_category_id: childCategoryId,
        });
      setSelectedCategoryPath(categoryResponse?.data?.data);
    } catch (error) {
      console.log("Error fetching category path:", error);
    }
  };

  const getCustomFields = async (categoryIds, extraFieldValue) => {
    try {
      const customFieldsRes = await getCustomFieldsApi.getCustomFields({
        category_ids: categoryIds,
      });
      const data = customFieldsRes?.data?.data;
      setCustomFields(data);
      const tempExtraDetails = prefillExtraDetails({
        data,
        languages,
        defaultLangId,
        extraFieldValue,
        setFilePreviews,
      });
      setExtraDetails(tempExtraDetails);
      setLangId(defaultLangId);
    } catch (error) {
      console.log("Error fetching custom fields:", error);
    }
  };

  const getSingleListingData = async () => {
    const listingId = Number(id);
    if (!listingId) return;
    const fetchToken = latestListingFetchRef.current + 1;
    latestListingFetchRef.current = fetchToken;
    try {
      setIsLoading(true);
      setUploadedImages([]);
      setOtherImages([]);
      setVideo(null);
      setDeleteImagesId("");
      setDeleteVideo(false);
      const res = await getMyItemsApi.getMyItems({ id: listingId });
      if (latestListingFetchRef.current !== fetchToken) return;
      const listingData = res?.data?.data?.[0];

      if (!listingData) {
        throw new Error("Listing not found");
      }
      await Promise.all([
        getCustomFields(
          listingData.all_category_ids,
          listingData?.all_translated_custom_fields,
        ),
        fetchCategoryPath(listingData?.category_id),
      ]);

      setUploadedImages(listingData?.image ? [listingData.image] : []);
      setOtherImages(listingData?.gallery_images || []);
      setVideo(listingData?.video || null);
      setAddVideoToStory(
        Boolean(
          listingData?.add_video_to_story || listingData?.publish_to_story,
        ),
      );
      setPublishToInstagram(
        Boolean(
          listingData?.publish_to_instagram || listingData?.instagram_auto_post,
        ),
      );
      const existingVideoLink = String(listingData?.video_link || "");
      const fallbackInstagramLink = existingVideoLink.includes("instagram.com/")
        ? existingVideoLink
        : "";
      setInstagramSourceUrl(
        listingData?.instagram_source_url || fallbackInstagramLink,
      );
      setDeleteVideo(false);
      setIsFeatured(Number(listingData?.is_feature) === 1);
      setAvailableNow(readAvailableNowFromListingData(listingData));
      setExchangePossible(readExchangeFromListingData(listingData));

      const mainDetailsTranslation = getMainDetailsTranslations(
        listingData,
        languages,
        defaultLangId,
      );
      const translationKeys = Object.keys(mainDetailsTranslation || {});
      const synchronizedMainDetails =
        translationKeys.length > 0
          ? translationKeys.reduce((acc, key) => {
              const existing = mainDetailsTranslation?.[key] || {};
              acc[key] = {
                ...existing,
                contact: mobile,
                country_code: countryCode,
                region_code: regionCode,
              };
              return acc;
            }, {})
          : {
              [defaultLangId ?? "default"]: {
                contact: mobile,
                country_code: countryCode,
                region_code: regionCode,
              },
            };

      setTranslations(synchronizedMainDetails);
      setLocation({
        country: listingData?.country,
        state: listingData?.state,
        city: listingData?.city,
        address: listingData?.address || listingData?.formatted_address,
        formattedAddress:
          listingData?.formatted_address || listingData?.address,
        address_translated:
          listingData?.address_translated ||
          listingData?.translated_address ||
          listingData?.address ||
          listingData?.formatted_address,
        lat: listingData?.latitude,
        long: listingData?.longitude,
        area_id: listingData?.area_id ? listingData?.area_id : null,
        location_source:
          String(listingData?.location_source || "").toLowerCase() ||
          (hasPreciseCoordinatePair(
            listingData?.latitude,
            listingData?.longitude,
          )
            ? "map"
            : "manual"),
      });

      if (!hasAppliedLocalDraftRef.current && typeof window !== "undefined") {
        hasAppliedLocalDraftRef.current = true;
        try {
          const rawDraft = window.localStorage.getItem(editDraftStorageKey);
          if (rawDraft) {
            const parsedDraft = JSON.parse(rawDraft);
            const savedAt = parsedDraft?.savedAt;
            const savedTs = savedAt ? new Date(savedAt).getTime() : NaN;
            const isExpired =
              !Number.isFinite(savedTs) ||
              Date.now() - savedTs > EDIT_DRAFT_TTL_MS;

            if (isExpired) {
              window.localStorage.removeItem(editDraftStorageKey);
            } else {
              const draftData = parsedDraft?.data || {};
              if (Number.isFinite(Number(draftData?.step))) {
                setStep(Number(draftData.step));
              }
              if (
                draftData?.translations &&
                typeof draftData.translations === "object"
              ) {
                setTranslations(draftData.translations);
              }
              if (
                draftData?.extraDetails &&
                typeof draftData.extraDetails === "object"
              ) {
                setExtraDetails(draftData.extraDetails);
              }
              if (Number.isFinite(Number(draftData?.langId))) {
                setLangId(Number(draftData.langId));
              }
              if (Array.isArray(draftData?.uploadedImages)) {
                setUploadedImages(
                  draftData.uploadedImages.filter(Boolean).slice(0, 1),
                );
              }
              if (Array.isArray(draftData?.otherImages)) {
                setOtherImages(draftData.otherImages.filter(Boolean));
              }
              if (draftData?.video) {
                setVideo(draftData.video);
              }
              if (
                draftData?.location &&
                typeof draftData.location === "object"
              ) {
                setLocation(draftData.location);
              }
              if (typeof draftData?.addVideoToStory === "boolean") {
                setAddVideoToStory(draftData.addVideoToStory);
              }
              if (typeof draftData?.publishToInstagram === "boolean") {
                setPublishToInstagram(draftData.publishToInstagram);
              }
              if (typeof draftData?.instagramSourceUrl === "string") {
                setInstagramSourceUrl(draftData.instagramSourceUrl);
              }
              if (typeof draftData?.availableNow === "boolean") {
                setAvailableNow(draftData.availableNow);
              }
              if (typeof draftData?.exchangePossible === "boolean") {
                setExchangePossible(draftData.exchangePossible);
              }
              if (savedAt) {
                setDraftLocalSavedAt(savedAt);
                setDraftTickerTs(Date.now());
                setDraftStatus("saved");
              }
            }
          }
        } catch (draftError) {
          console.error(
            "Greška pri učitavanju lokalnog nacrta izmjene:",
            draftError,
          );
        } finally {
          setDraftHydrated(true);
        }
      } else {
        setDraftHydrated(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setDraftHydrated(true);
      if (latestListingFetchRef.current === fetchToken) {
        setIsLoading(false);
      }
    }
  };

  const handleDetailsSubmit = () => {
    if (customFields?.length === 0) {
      setStep(3);
      return;
    }
    setStep(2);
  };

  const handleImageSubmit = () => {
    if (uploadedImages.length === 0) {
      toast.error("Otpremi glavnu sliku");
      return;
    }
    setStep(4);
  };

  const handleGoBack = () => {
    if (step === 4) {
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(customFields?.length > 0 ? 2 : 1);
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    setStep(1);
  };

  const handleTabClick = (tab) => {
    if (tab === 1) setStep(1);
    else if (tab === 2 && customFields?.length > 0) setStep(2);
    else if (tab === 3) setStep(3);
    else if (tab === 4) setStep(4);
  };

  const submitExtraDetails = () => {
    setStep(3);
  };

  const handleVideoLinkChange = useCallback(
    (value) => {
      setTranslations((prev) => {
        const targetLangId = primaryLangId ?? defaultLangId ?? langId;
        if (targetLangId === undefined || targetLangId === null) return prev;
        return {
          ...prev,
          [targetLangId]: {
            ...(prev?.[targetLangId] || {}),
            video_link: value,
          },
        };
      });
      if ((value || "").trim()) {
        setDeleteVideo(false);
      }
    },
    [defaultLangId, langId, primaryLangId],
  );

  const handleUseInstagramAsVideoLink = useCallback(() => {
    const igLink = (instagramSourceUrl || "").trim();
    if (!igLink) return;
    handleVideoLinkChange(igLink);
  }, [handleVideoLinkChange, instagramSourceUrl]);

  const fetchInstagramConnection = useCallback(async () => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      setInstagramConnection({
        loading: false,
        syncing: false,
        connected: false,
        account: null,
      });
      return;
    }

    try {
      setInstagramConnection((prev) => ({ ...prev, loading: true }));
      const res = await socialMediaApi.getConnectedAccounts();
      const accounts = res?.data?.data?.accounts || [];
      const igAccount =
        Array.isArray(accounts) &&
        accounts.find((entry) => entry?.platform === "instagram");
      const connected = Boolean(
        igAccount?.connected || igAccount?.status === "connected",
      );
      setInstagramConnection((prev) => ({
        ...prev,
        loading: false,
        connected,
        account: igAccount || null,
      }));
    } catch (error) {
      setInstagramConnection((prev) => ({
        ...prev,
        loading: false,
        connected: false,
        account: null,
      }));
    }
  }, []);

  useEffect(() => {
    fetchInstagramConnection();
  }, [fetchInstagramConnection]);

  useEffect(() => {
    if (!instagramConnection.connected && publishToInstagram) {
      setPublishToInstagram(false);
    }
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE && publishToInstagram) {
      setPublishToInstagram(false);
    }
  }, [instagramConnection.connected, publishToInstagram]);

  const handleConnectInstagram = useCallback(async () => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return;
    }

    try {
      setInstagramConnection((prev) => ({ ...prev, syncing: true }));
      const res = await socialMediaApi.connectAccount({
        platform: "instagram",
        mode: "oauth",
      });
      const authUrl = res?.data?.data?.auth_url;
      if (!authUrl) {
        throw new Error(res?.data?.message || "OAuth link nije dostupan.");
      }

      await runSocialOAuthPopup({ platform: "instagram", authUrl });
      toast.success("Instagram je uspješno povezan.");
      await fetchInstagramConnection();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Povezivanje Instagrama nije uspjelo.",
      );
    } finally {
      setInstagramConnection((prev) => ({ ...prev, syncing: false }));
    }
  }, [fetchInstagramConnection]);

  const SLUG_RE = /^[a-z0-9-]+$/i;
  const isEmpty = (x) => !x || !x.toString().trim();
  const isNegative = (n) => Number(n) < 0;
  const parseBooleanSetting = useCallback((value, fallback = false) => {
    if (value === true || value === 1 || value === "1") return true;
    if (value === false || value === 0 || value === "0") return false;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["true", "da", "yes", "on", "enabled"].includes(normalized))
        return true;
      if (["false", "ne", "no", "off", "disabled"].includes(normalized))
        return false;
    }
    return fallback;
  }, []);
  const getSharedDetailValue = useCallback(
    (field, fallback = null) => {
      const candidateKeys = [];
      if (primaryLangId !== undefined && primaryLangId !== null) {
        candidateKeys.push(String(primaryLangId));
      }
      if (defaultLangId !== undefined && defaultLangId !== null) {
        candidateKeys.push(String(defaultLangId));
      }
      if (langId !== undefined && langId !== null) {
        candidateKeys.push(String(langId));
      }
      Object.keys(translations || {}).forEach((key) =>
        candidateKeys.push(String(key)),
      );

      const uniqueKeys = [...new Set(candidateKeys)];
      for (const key of uniqueKeys) {
        const value = translations?.[key]?.[field];
        if (value !== undefined && value !== null) return value;
      }

      return fallback;
    },
    [defaultLangId, langId, primaryLangId, translations],
  );

  const handleFullSubmission = (
    scheduledDateTime = null,
    locationOverride = null,
  ) => {
    const submissionLocation = locationOverride || Location || {};
    const {
      name,
      description,
      price,
      slug,
      video_link,
      min_salary,
      max_salary,
    } = defaultDetails;
    const contact = mobile;
    const country_code = countryCode;
    const effectiveManualPrice =
      is_real_estate && effectiveRealEstateTotalPrice
        ? effectiveRealEstateTotalPrice
        : null;
    const manualPerM2ModeActive =
      is_real_estate &&
      realEstatePriceState.enabled &&
      realEstatePriceState.mode === REAL_ESTATE_PRICE_MODE_MANUAL;
    const resolvedScarcityEnabled = parseBooleanSetting(
      getSharedDetailValue("scarcity_enabled", false),
      false,
    );
    const resolvedInventoryCount = getSharedDetailValue("inventory_count", 0);
    const resolvedStockAlertThreshold = getSharedDetailValue(
      "stock_alert_threshold",
      3,
    );
    const scarcityEnabled = !is_real_estate && Boolean(resolvedScarcityEnabled);
    const inventoryCount = Number(resolvedInventoryCount || 0);
    const lowThreshold = Math.max(1, Number(resolvedStockAlertThreshold || 3));

    if (!name.trim() || !description.trim()) {
      toast.error("Popuni obavezna polja.");
      setStep(1);
      return;
    }

    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      toast.error("Broj telefona iz Seller postavki nije ispravan.");
      return setStep(1);
    }

    if (is_job_category) {
      const min = min_salary ? Number(min_salary) : null;
      const max = max_salary ? Number(max_salary) : null;

      if (min !== null && min < 0) {
        toast.error("Unesi ispravnu minimalnu platu.");
        setStep(1);
        return;
      }

      if (max !== null && max < 0) {
        toast.error("Unesi ispravnu maksimalnu platu.");
        setStep(1);
        return;
      }
      if (min !== null && max !== null) {
        if (min === max) {
          toast.error("Minimalna i maksimalna plata ne mogu biti iste.");
          return setStep(1);
        }
        if (min > max) {
          toast.error("Minimalna plata ne može biti veća od maksimalne.");
          return setStep(1);
        }
      }
    } else {
      const hasPriceInput =
        !isEmpty(price) ||
        (Number.isFinite(effectiveManualPrice) && effectiveManualPrice > 0) ||
        (manualPerM2ModeActive &&
          Number.isFinite(Number(realEstatePriceState.manualValue)) &&
          Number(realEstatePriceState.manualValue) > 0);
      if (!defaultDetails.price_on_request && !hasPriceInput) {
        toast.error("Popuni obavezna polja.");
        return setStep(1);
      }

      if (
        !isEmpty(price) &&
        isNegative(price) &&
        !effectiveManualPrice &&
        !manualPerM2ModeActive
      ) {
        toast.error("Unesi ispravnu cijenu.");
        return setStep(1);
      }
    }

    if (!isEmpty(slug) && !SLUG_RE.test(slug.trim())) {
      toast.error("Unesi ispravan slug.");
      return setStep(1);
    }

    if (!isEmpty(video_link) && !isValidURL(video_link)) {
      toast.error("Unesi ispravan URL.");
      setStep(3);
      return;
    }

    if (!isEmpty(instagramSourceUrl) && !isValidURL(instagramSourceUrl)) {
      toast.error("Unesite ispravan Instagram link.");
      setStep(3);
      return;
    }

    if (SOCIAL_POSTING_TEMP_UNAVAILABLE && publishToInstagram) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      setPublishToInstagram(false);
      setStep(3);
      return;
    }

    if (publishToInstagram && !instagramConnection.connected) {
      toast.error(
        "Instagram nalog nije povezan. Povežite Instagram pa pokušajte ponovo.",
      );
      setStep(3);
      return;
    }

    if (
      customFields.length !== 0 &&
      !validateExtraDetails({
        languages,
        defaultLangId,
        extraDetails,
        customFields,
        filePreviews,
      })
    ) {
      setStep(2);
      return;
    }

    if (uploadedImages.length === 0) {
      toast.error("Otpremi glavnu sliku");
      setStep(3);
      return;
    }

    if (
      !submissionLocation?.country ||
      !submissionLocation?.city ||
      !submissionLocation?.address
    ) {
      toast.error("Odaberi lokaciju");
      return;
    }

    const realEstateLocationSource = String(
      submissionLocation?.location_source || "",
    ).toLowerCase();
    const hasPreciseRealEstatePin = hasPreciseCoordinatePair(
      submissionLocation?.lat,
      submissionLocation?.long,
    );
    const normalizedRealEstateLocationSource = is_real_estate
      ? normalizeRealEstateLocationSource({
          source: realEstateLocationSource,
          hasPreciseCoordinates: hasPreciseRealEstatePin,
        })
      : String(submissionLocation?.location_source || "manual").toLowerCase();

    if (
      is_real_estate &&
      normalizedRealEstateLocationSource === "map" &&
      !hasPreciseRealEstatePin
    ) {
      toast.error("Za nekretninu označite tačnu lokaciju na mapi.");
      return setStep(4);
    }

    if (
      is_real_estate &&
      realEstatePriceState.enabled &&
      !realEstatePriceState.hasArea
    ) {
      toast.error(
        "Unesite površinu nekretnine (m²) prije prikaza cijene po m².",
      );
      return setStep(customFields?.length ? 2 : 1);
    }

    if (
      is_real_estate &&
      realEstatePriceState.enabled &&
      realEstatePriceState.mode === "auto" &&
      (defaultDetails?.price_on_request || !Number(defaultDetails?.price))
    ) {
      toast.error(
        "Za automatsku cijenu po m² prvo unesite ukupnu cijenu oglasa.",
      );
      return setStep(1);
    }

    if (
      is_real_estate &&
      realEstatePriceState.enabled &&
      realEstatePriceState.mode === "manual" &&
      !realEstatePriceState.manualValue
    ) {
      toast.error("Unesite ručno cijenu po m² veću od 0.");
      return setStep(1);
    }

    if (
      scarcityEnabled &&
      (!Number.isFinite(inventoryCount) || inventoryCount <= 0)
    ) {
      toast.error(
        "Za opciju 'Do isteka zaliha' unesite količinu na zalihi veću od 0.",
      );
      return setStep(1);
    }

    if (scarcityEnabled && inventoryCount > lowThreshold) {
      toast.info(
        "Oznaka 'Do isteka zaliha' će se automatski aktivirati kada zaliha padne na zadani prag.",
      );
    }

    editAd(scheduledDateTime, submissionLocation);
  };

  const editAd = async (scheduledDateTime = null, locationOverride = null) => {
    const submissionLocation = locationOverride || Location || {};
    const nonDefaultTranslations = filterNonDefaultTranslations(
      translations,
      primaryLangId,
    );
    const customFieldTranslations =
      prepareCustomFieldTranslations(extraDetails);

    const customFieldFiles = prepareCustomFieldFiles(
      extraDetails,
      primaryLangId,
    );

    const mainTempId = extractTempMediaId(uploadedImages?.[0]);
    const mainPersistentImageId = extractPersistentMediaId(uploadedImages?.[0]);

    const galleryTempIds = (OtherImages || [])
      .map((x) => extractTempMediaId(x))
      .filter(Boolean);

    const videoTempId = extractTempMediaId(video);
    const trimmedVideoLink = (defaultDetails?.video_link || "").trim();
    const editLocationSourceRaw = String(
      submissionLocation?.location_source || "",
    ).toLowerCase();
    const editLatNum = parseCoordinateValue(submissionLocation?.lat);
    const editLngNum = parseCoordinateValue(submissionLocation?.long);
    const hasPreciseEditCoords =
      editLatNum !== null && editLngNum !== null;
    const normalizedRealEstateLocationSource = is_real_estate
      ? normalizeRealEstateLocationSource({
          source: editLocationSourceRaw,
          hasPreciseCoordinates: hasPreciseEditCoords,
        })
      : String(submissionLocation?.location_source || "manual").toLowerCase();
    const shouldUsePreciseEditCoords = is_real_estate
      ? normalizedRealEstateLocationSource === "map" && hasPreciseEditCoords
      : hasPreciseEditCoords;
    const usesExactRealEstatePin =
      is_real_estate &&
      normalizedRealEstateLocationSource === "map" &&
      hasPreciseEditCoords;
    const normalizedAreaId = parseAreaId(submissionLocation?.area_id);
    const payloadLatitude = is_real_estate
      ? shouldUsePreciseEditCoords
        ? editLatNum
        : null
      : submissionLocation?.lat;
    const payloadLongitude = is_real_estate
      ? shouldUsePreciseEditCoords
        ? editLngNum
        : null
      : submissionLocation?.long;

    const allData = {
      id: id,
      name: defaultDetails.name,
      slug: defaultDetails.slug.trim(),
      description: defaultDetails?.description,
      price:
        is_real_estate && effectiveRealEstateTotalPrice
          ? effectiveRealEstateTotalPrice
          : defaultDetails.price,
      contact: mobile,
      country_code: countryCode,
      available_now: Boolean(availableNow),
      exchange_possible: Boolean(exchangePossible),
      is_exchange: Boolean(exchangePossible),
      allow_exchange: Boolean(exchangePossible),
      inventory_count:
        !is_real_estate &&
        getSharedDetailValue("inventory_count") !== undefined &&
        getSharedDetailValue("inventory_count") !== null &&
        String(getSharedDetailValue("inventory_count")).trim() !== ""
          ? Number(getSharedDetailValue("inventory_count"))
          : null,
      price_per_unit: is_real_estate
        ? realEstatePriceState.resolvedValue
        : defaultDetails?.price_per_unit !== undefined &&
            defaultDetails?.price_per_unit !== null &&
            String(defaultDetails.price_per_unit).trim() !== ""
          ? Number(defaultDetails.price_per_unit)
          : null,
      minimum_order_quantity:
        !is_real_estate &&
        getSharedDetailValue("minimum_order_quantity") !== undefined &&
        getSharedDetailValue("minimum_order_quantity") !== null &&
        String(getSharedDetailValue("minimum_order_quantity")).trim() !== ""
          ? Math.max(1, Number(getSharedDetailValue("minimum_order_quantity")))
          : null,
      stock_alert_threshold:
        !is_real_estate &&
        getSharedDetailValue("stock_alert_threshold") !== undefined &&
        getSharedDetailValue("stock_alert_threshold") !== null &&
        String(getSharedDetailValue("stock_alert_threshold")).trim() !== ""
          ? Math.max(1, Number(getSharedDetailValue("stock_alert_threshold")))
          : null,
      seller_product_code: is_real_estate
        ? ""
        : String(getSharedDetailValue("seller_product_code", "") || "").trim(),
      scarcity_enabled: is_real_estate
        ? false
        : parseBooleanSetting(
            getSharedDetailValue("scarcity_enabled", false),
            false,
          ),
      region_code: String(regionCode || "").toUpperCase(),
      video_link: trimmedVideoLink,
      instagram_source_url: (instagramSourceUrl || "").trim(),
      publish_to_instagram: SOCIAL_POSTING_TEMP_UNAVAILABLE
        ? false
        : Boolean(publishToInstagram),

      // ✅ OLD mode (fallback): šalji fajl samo ako je File/Blob
      image:
        uploadedImages?.[0] instanceof File ||
        uploadedImages?.[0] instanceof Blob
          ? uploadedImages[0]
          : null,

      gallery_images:
        OtherImages?.filter((x) => x instanceof File || x instanceof Blob) ||
        [],

      ...(video instanceof File ? { video } : {}),

      // ✅ NEW mode: temp upload IDs (kad su objekti {id,url})
      ...(mainTempId ? { temp_main_image_id: mainTempId } : {}),
      ...(!mainTempId && mainPersistentImageId
        ? { main_image_id: mainPersistentImageId }
        : {}),
      ...(galleryTempIds.length
        ? { temp_gallery_image_ids: galleryTempIds }
        : {}),
      ...(videoTempId && !trimmedVideoLink
        ? { temp_video_id: videoTempId }
        : {}),
      add_video_to_story: Boolean(addVideoToStory),
      ...(deleteVideo ? { delete_video: 1 } : {}),

      address: submissionLocation?.address,
      formatted_address:
        submissionLocation?.formattedAddress ||
        submissionLocation?.address ||
        "",
      address_translated:
        submissionLocation?.address_translated ||
        submissionLocation?.address ||
        "",
      latitude: payloadLatitude,
      longitude: payloadLongitude,
      location_source: is_real_estate
        ? normalizedRealEstateLocationSource
        : String(submissionLocation?.location_source || "manual").toLowerCase(),
      ...(usesExactRealEstatePin
        ? {
            location_latitude: editLatNum,
            location_longitude: editLngNum,
            map_display_latitude: editLatNum,
            map_display_longitude: editLngNum,
            map_display_radius_m: 100,
          }
        : {}),
      custom_field_files: customFieldFiles,
      country: submissionLocation?.country,
      state: submissionLocation?.state,
      city: submissionLocation?.city,
      ...(normalizedAreaId ? { area_id: normalizedAreaId } : {}),

      delete_item_image_id: deleteImagesId,

      ...(Object.keys(nonDefaultTranslations).length > 0 && {
        translations: nonDefaultTranslations,
      }),
      ...(Object.keys(customFieldTranslations).length > 0 && {
        custom_field_translations: customFieldTranslations,
      }),
      ...(scheduledDateTime && { scheduled_at: scheduledDateTime }),
    };

    if (is_job_category) {
      allData.min_salary = defaultDetails.min_salary;
      allData.max_salary = defaultDetails.max_salary;
    } else {
      allData.price =
        is_real_estate && effectiveRealEstateTotalPrice
          ? effectiveRealEstateTotalPrice
          : defaultDetails.price;
      allData.price_on_request = Boolean(defaultDetails.price_on_request);
      allData.is_on_sale = defaultDetails.is_on_sale || false;
      allData.old_price = defaultDetails.is_on_sale
        ? defaultDetails.old_price
        : null;

      if (defaultDetails.price_on_request) {
        allData.price = 0;
      }
    }

    try {
      setIsAdPlaced(true);
      const res = await editItemApi.editItem(allData);
      if (res?.data?.error === false) {
        if (!SOCIAL_POSTING_TEMP_UNAVAILABLE && publishToInstagram) {
          try {
            await socialMediaApi.schedulePost({
              item_id: id,
              platforms: ["instagram"],
              caption: `${defaultDetails?.name || "Lmx oglas"}\n\n${(
                defaultDetails?.description || ""
              ).slice(0, 260)}`.trim(),
            });
            toast.success(
              "Izmjena je spremljena i dodana u red za Instagram objavu.",
            );
          } catch (scheduleError) {
            const apiMessage = scheduleError?.response?.data?.message;
            toast.warning(
              apiMessage ||
                "Izmjena je spremljena, ali Instagram objava nije zakazana.",
            );
          }
        }

        setOpenSuccessModal(true);
        setCreatedAdSlug(res?.data?.data[0]?.slug);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(editDraftStorageKey);
        }
        setDraftStatus("idle");
        setDraftLocalSavedAt("");
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error?.response?.data?.message ||
          "Došlo je do greške pri izmjeni oglasa. Pokušajte ponovo.",
      );
    } finally {
      setIsAdPlaced(false);
    }
  };

  const steps = useMemo(
    () => [
      {
        id: 1,
        label: "Detalji",
        mobileLabel: "Detalji",
        icon: Circle,
        disabled: false,
      },
      ...(customFields?.length > 0
        ? [
            {
              id: 2,
              label: "Dodatni detalji",
              mobileLabel: "Dodatno",
              icon: Circle,
              disabled: false,
            },
          ]
        : []),
      {
        id: 3,
        label: "Media",
        mobileLabel: "Mediji",
        icon: Circle,
        disabled: false,
      },
      {
        id: 4,
        label: "Lokacija",
        mobileLabel: "Lokacija",
        icon: Circle,
        disabled: false,
      },
    ],
    [customFields?.length],
  );

  const stepIdSequence = useMemo(() => steps.map((s) => s.id), [steps]);

  const resolveNearestStep = useCallback(
    (targetStep) => {
      if (stepIdSequence.includes(targetStep)) return targetStep;
      if (!stepIdSequence.length) return 1;
      return stepIdSequence.reduce((closest, candidate) => {
        const candidateDistance = Math.abs(candidate - targetStep);
        const closestDistance = Math.abs(closest - targetStep);

        if (candidateDistance < closestDistance) return candidate;
        if (candidateDistance === closestDistance && candidate > closest)
          return candidate;
        return closest;
      });
    },
    [stepIdSequence],
  );

  useEffect(() => {
    const normalizedStep = resolveNearestStep(step);
    if (normalizedStep !== step) {
      setStep(normalizedStep);
    }
  }, [resolveNearestStep, step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    dispatch(setHideMobileBottomNav(true));
    return () => {
      dispatch(setHideMobileBottomNav(false));
    };
  }, [dispatch]);

  const activeStepId = resolveNearestStep(step);
  const activeStepIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === activeStepId),
  );
  const renderedStep = activeStepId;

  const dismissActiveField = useCallback(() => {
    if (typeof document === "undefined") return;
    const activeEl = document.activeElement;
    if (!activeEl) return;
    const tag = String(activeEl.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      activeEl.blur?.();
    }
  }, []);

  const scrollWizardToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    const topOffset = 12;
    const targetRect = wizardTopRef.current?.getBoundingClientRect?.();
    const targetTop =
      typeof targetRect?.top === "number"
        ? window.scrollY + targetRect.top - topOffset
        : 0;

    window.scrollTo({
      top: Math.max(0, targetTop),
      left: 0,
      behavior,
    });

    if (document?.documentElement) document.documentElement.scrollLeft = 0;
    if (document?.body) document.body.scrollLeft = 0;
  }, []);

  useEffect(() => {
    if (!hasInitializedStepRef.current) {
      hasInitializedStepRef.current = true;
      return;
    }

    let timeoutId;
    const rafId = window.requestAnimationFrame(() => {
      dismissActiveField();
      scrollWizardToTop();
      timeoutId = window.setTimeout(() => {
        if (document?.documentElement) document.documentElement.scrollLeft = 0;
        if (document?.body) document.body.scrollLeft = 0;
      }, 120);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [activeStepId, dismissActiveField, scrollWizardToTop]);

  const syncStepRailFill = useCallback(() => {
    const railEl = stepRailRef.current;
    const firstNodeEl = stepNodeRefs.current[0];
    const activeNodeEl = stepNodeRefs.current[activeStepIndex] || firstNodeEl;

    if (!railEl || !firstNodeEl || !activeNodeEl) {
      setStepRailFill({ left: 0, width: 0 });
      return;
    }

    const railRect = railEl.getBoundingClientRect();
    if (!railRect.width) {
      setStepRailFill({ left: 0, width: 0 });
      return;
    }

    const firstRect = firstNodeEl.getBoundingClientRect();
    const activeRect = activeNodeEl.getBoundingClientRect();

    const startX = firstRect.left + firstRect.width / 2 - railRect.left;
    const endX = activeRect.left + activeRect.width / 2 - railRect.left;
    const clampedStart = Math.max(0, Math.min(startX, railRect.width));
    const clampedEnd = Math.max(clampedStart, Math.min(endX, railRect.width));

    const rawWidth = clampedEnd - clampedStart;
    const minVisibleWidth = Math.min(
      2,
      Math.max(0, railRect.width - clampedStart),
    );
    const nextFill = {
      left: clampedStart,
      width: rawWidth > 1 ? rawWidth : minVisibleWidth,
    };

    setStepRailFill((prev) => {
      const deltaLeft = Math.abs(prev.left - nextFill.left);
      const deltaWidth = Math.abs(prev.width - nextFill.width);
      if (deltaLeft < 0.5 && deltaWidth < 0.5) return prev;
      return nextFill;
    });
  }, [activeStepIndex]);

  useEffect(() => {
    stepNodeRefs.current = stepNodeRefs.current.slice(0, steps.length);
    const rafId = requestAnimationFrame(syncStepRailFill);
    return () => cancelAnimationFrame(rafId);
  }, [steps.length, syncStepRailFill]);

  useEffect(() => {
    const onResize = () => syncStepRailFill();
    window.addEventListener("resize", onResize);

    let observer;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncStepRailFill());
      if (stepRailRef.current) observer.observe(stepRailRef.current);
      stepNodeRefs.current.forEach((node) => {
        if (node) observer.observe(node);
      });
    }

    return () => {
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [activeStepIndex, steps.length, syncStepRailFill]);

  const getStepProgress = useCallback(
    (stepId) => {
      const stepIndex = steps.findIndex((s) => s.id === stepId);
      if (stepIndex < activeStepIndex) return 100;
      if (stepIndex === activeStepIndex) {
        switch (stepId) {
          case 1:
            return defaultDetails.name && defaultDetails.description
              ? 100
              : defaultDetails.name || defaultDetails.description
                ? 55
                : 0;
          case 2:
            return Object.keys(currentExtraDetails).length > 0 ? 100 : 0;
          case 3:
            return uploadedImages.length > 0 ? 100 : 0;
          case 4:
            return Location?.address && Location?.city && Location?.country
              ? 100
              : Location?.address
                ? 60
                : 0;
          default:
            return 0;
        }
      }
      return 0;
    },
    [
      Location?.address,
      Location?.city,
      Location?.country,
      activeStepIndex,
      currentExtraDetails,
      defaultDetails.description,
      defaultDetails.name,
      steps,
      uploadedImages.length,
    ],
  );

  const hasBaseLocation = Boolean(
    Location?.address && Location?.city && Location?.country,
  );
  const hasPreciseLocation = hasPreciseCoordinatePair(
    Location?.lat,
    Location?.long,
  );
  const normalizedRealEstateLocationSourceForValidity = is_real_estate
    ? (() => {
        const source = String(Location?.location_source || "").toLowerCase();
        if (["profile", "manual", "map"].includes(source)) return source;
        return hasPreciseLocation ? "map" : "manual";
      })()
    : "manual";
  const requiresPreciseRealEstatePinForValidity =
    is_real_estate && normalizedRealEstateLocationSourceForValidity === "map";
  const hasValidLocation =
    hasBaseLocation &&
    (!is_real_estate ||
      !requiresPreciseRealEstatePinForValidity ||
      hasPreciseLocation);

  const listingFlowIssues = useMemo(() => {
    const issues = [];

    if (!String(defaultDetails?.name || "").trim()) {
      issues.push({
        id: "title",
        stepId: 1,
        fieldId: "name",
        label: "Dodaj naslov oglasa",
        hint: "Naslov je obavezan za kvalitetan prikaz.",
      });
    }

    if (!String(defaultDetails?.description || "").trim()) {
      issues.push({
        id: "description",
        stepId: 1,
        fieldId: "description",
        label: "Dodaj opis oglasa",
        hint: "Opis pomaže kupcu da donese odluku.",
      });
    }

    if (
      customFields?.length > 0 &&
      Object.keys(currentExtraDetails || {}).length === 0
    ) {
      issues.push({
        id: "attributes",
        stepId: 2,
        label: "Popuni dodatne detalje",
        hint: "Specifikacije podižu relevantnost oglasa.",
      });
    }

    if (!uploadedImages?.length) {
      issues.push({
        id: "images",
        stepId: 3,
        label: "Dodaj barem jednu fotografiju",
        hint: "Fotografija je ključna za klik i pregled.",
      });
    }

    if (!hasValidLocation) {
      issues.push({
        id: "location",
        stepId: 4,
        fieldId: "address",
        label: "Upotpuni lokaciju oglasa",
        hint: "Precizna lokacija ubrzava upite.",
      });
    }

    return issues;
  }, [
    customFields?.length,
    currentExtraDetails,
    defaultDetails?.description,
    defaultDetails?.name,
    hasValidLocation,
    uploadedImages,
  ]);

  const listingFlowTotalSteps = 4;
  const listingFlowCompleted = Math.max(
    0,
    listingFlowTotalSteps - listingFlowIssues.length,
  );
  const listingFlowPercent = Math.round(
    (listingFlowCompleted / listingFlowTotalSteps) * 100,
  );

  const goToListingIssue = useCallback(
    (issue) => {
      if (!issue) return;
      handleTabClick(issue.stepId);

      if (typeof window === "undefined") return;
      const prefersReducedMotion =
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ??
        false;

      const focusIssueField = (attempt = 0) => {
        if (issue.fieldId) {
          const selectors = [
            `#${issue.fieldId}`,
            `[id*="${issue.fieldId}"]`,
            `[name="${issue.fieldId}"]`,
            `[name*="${issue.fieldId}"]`,
            `[data-field-id="${issue.fieldId}"]`,
            `[data-field-id*="${issue.fieldId}"]`,
          ];
          const target = selectors
            .map((selector) => document.querySelector(selector))
            .find(Boolean);

          if (target) {
            target.scrollIntoView({
              behavior: prefersReducedMotion ? "auto" : "smooth",
              block: "center",
              inline: "nearest",
            });
            if (typeof target?.focus === "function") {
              window.setTimeout(
                () => target.focus({ preventScroll: true }),
                prefersReducedMotion ? 0 : 160,
              );
            }
            return;
          }
        }

        if (attempt < 6) {
          window.setTimeout(
            () => focusIssueField(attempt + 1),
            prefersReducedMotion ? 0 : 110,
          );
          return;
        }

        scrollWizardToTop();
      };

      window.requestAnimationFrame(() => focusIssueField(0));
    },
    [handleTabClick, scrollWizardToTop],
  );

  const getPreviewImage = () => {
    if (uploadedImages && uploadedImages.length > 0) {
      const primary = safeObjectUrl(uploadedImages[0]);
      if (primary) return primary;
    }
    if (OtherImages && OtherImages.length > 0) {
      const fallback = safeObjectUrl(OtherImages[0]);
      if (fallback) return fallback;
    }
    return null;
  };

  const isOnSale = defaultDetails.is_on_sale;
  const oldPrice = Number(defaultDetails.old_price);
  const currentPrice = Number(
    is_real_estate && effectiveRealEstateTotalPrice
      ? effectiveRealEstateTotalPrice
      : defaultDetails.price,
  );
  const hasCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0;
  const showDiscount =
    isOnSale && oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
  const previewCustomFields = useMemo(() => {
    if (!Array.isArray(customFields) || customFields.length === 0) return [];

    return customFields.reduce((acc, field) => {
      const rawValue = currentExtraDetails?.[field?.id];
      if (
        rawValue === undefined ||
        rawValue === null ||
        (typeof rawValue === "string" && rawValue.trim() === "")
      ) {
        return acc;
      }

      const normalizedValues = (Array.isArray(rawValue) ? rawValue : [rawValue])
        .map((entry) => {
          if (entry === null || entry === undefined) return "";
          if (typeof entry === "object") {
            if (typeof entry?.label === "string") return entry.label.trim();
            if (typeof entry?.value === "string") return entry.value.trim();
            if (typeof entry?.value === "number") return String(entry.value);
            return "";
          }
          return String(entry).trim();
        })
        .filter(Boolean);

      if (!normalizedValues.length) return acc;

      acc.push({
        name: field?.name || field?.translated_name || "",
        translated_name: field?.translated_name || field?.name || "",
        selected_values: normalizedValues,
        translated_selected_values: normalizedValues,
        value: normalizedValues,
      });

      return acc;
    }, []);
  }, [customFields, currentExtraDetails]);

  const previewGalleryImages = useMemo(() => {
    const urls = [];
    const pushUrl = (entry) => {
      const resolved = safeObjectUrl(entry?.image || entry);
      if (!resolved || urls.includes(resolved)) return;
      urls.push(resolved);
    };

    uploadedImages?.slice(1)?.forEach(pushUrl);
    OtherImages?.forEach(pushUrl);

    return urls.map((image) => ({ image }));
  }, [uploadedImages, OtherImages]);

  const previewCardItem = useMemo(() => {
    const previewName = defaultDetails?.name || "Vaš naslov oglasa ovdje";
    const primaryImage = getPreviewImage();
    const previewPrice = defaultDetails?.price_on_request
      ? 0
      : hasCurrentPrice
        ? Number(currentPrice)
        : Number(defaultDetails?.price || 0);

    return {
      id: Number(id || -1),
      slug: String(defaultDetails?.slug || "preview-oglas"),
      name: previewName,
      translated_item: {
        name: previewName,
      },
      category: {
        is_job_category: is_job_category ? 1 : 0,
      },
      image: primaryImage,
      gallery_images: previewGalleryImages,
      price: previewPrice,
      old_price: showDiscount ? Number(oldPrice) : null,
      is_on_sale: Boolean(showDiscount),
      min_salary: defaultDetails?.min_salary,
      max_salary: defaultDetails?.max_salary,
      created_at: defaultDetails?.created_at || new Date().toISOString(),
      translated_custom_fields: previewCustomFields,
      available_now: Boolean(availableNow),
      exchange_possible: Boolean(exchangePossible),
      is_exchange: Boolean(exchangePossible),
      allow_exchange: Boolean(exchangePossible),
      is_feature: Boolean(isFeatured),
      area_m2: realEstateAreaM2,
      show_price_per_m2: Boolean(
        is_real_estate && realEstatePriceState.enabled,
      ),
      price_per_m2_mode: realEstatePriceState?.mode || "auto",
      price_per_unit:
        realEstatePriceState?.mode === REAL_ESTATE_PRICE_MODE_MANUAL
          ? Number(realEstatePriceState?.manualValue || 0)
          : Number(realEstatePriceState?.resolvedValue || 0),
      real_estate_price_per_m2: Number(
        realEstatePriceState?.resolvedValue || 0,
      ),
    };
  }, [
    OtherImages,
    availableNow,
    currentPrice,
    defaultDetails?.max_salary,
    defaultDetails?.min_salary,
    defaultDetails?.name,
    defaultDetails?.price,
    defaultDetails?.price_on_request,
    exchangePossible,
    hasCurrentPrice,
    isFeatured,
    is_job_category,
    is_real_estate,
    id,
    defaultDetails?.created_at,
    defaultDetails?.slug,
    oldPrice,
    previewCustomFields,
    previewGalleryImages,
    realEstateAreaM2,
    realEstatePriceState?.enabled,
    realEstatePriceState?.manualValue,
    realEstatePriceState?.mode,
    realEstatePriceState?.resolvedValue,
    showDiscount,
    uploadedImages,
  ]);
  const successCategoryLabel =
    selectedCategoryPath?.[selectedCategoryPath.length - 1]?.translated_name ||
    selectedCategoryPath?.[selectedCategoryPath.length - 1]?.name ||
    "";
  const successLocationLabel =
    [Location?.city, Location?.state, Location?.country]
      .filter(Boolean)
      .join(", ") ||
    Location?.address ||
    "";
  const successPriceLabel = is_job_category
    ? defaultDetails?.min_salary && defaultDetails?.max_salary
      ? `${formatPriceAbbreviated(defaultDetails.min_salary)} - ${formatPriceAbbreviated(defaultDetails.max_salary)}`
      : defaultDetails?.min_salary
        ? `Od ${formatPriceAbbreviated(defaultDetails.min_salary)}`
        : defaultDetails?.max_salary
          ? `Do ${formatPriceAbbreviated(defaultDetails.max_salary)}`
          : ""
    : defaultDetails?.price_on_request
      ? "Na upit"
      : showDiscount
        ? `${formatPriceAbbreviated(currentPrice)} (sniženo sa ${formatPriceAbbreviated(oldPrice)})`
        : hasCurrentPrice
          ? formatPriceAbbreviated(currentPrice)
          : "";

  // =======================================================
  // MEDIA:
  // EditComponentThree već radi temp upload i vraća finalne temp objekte.
  // Ovdje ne radimo dodatnu obradu da izbjegnemo dupli watermark/kompresiju.
  // =======================================================
  const setUploadedImagesProcessed = useCallback(
    (files) => {
      const arr = normalizeFilesArray(files);
      if (!arr.length) {
        setUploadedImages([]);
        return;
      }
      setUploadedImages(arr.slice(0, 1));
    },
    [setUploadedImages],
  );

  const setOtherImagesProcessed = useCallback(
    (next) => {
      // EditComponentThree nekad poziva setOtherImages sa functional updaterom
      // (prev => [...prev, ...files]). Moramo to podržati.
      const prev = otherImagesRef.current || [];

      // 1) functional updater
      if (typeof next === "function") {
        const computed = next(prev);
        setOtherImages(computed);
        return;
      }

      // 2) array / filelist / single
      const arr = normalizeFilesArray(next);
      if (!arr.length) {
        setOtherImages([]);
        return;
      }
      setOtherImages(arr);
    },
    [setOtherImages],
  );

  const setVideoValidated = useCallback(
    async (fileOrList) => {
      const [file] = normalizeFilesArray(fileOrList);
      if (!file) return setVideo(null);

      if (isFileLike(file)) {
        const maxMb = 40; // promijeni po želji
        if (bytesToMB(file.size) > maxMb) {
          toast.error(
            `Video je prevelik (${bytesToMB(file.size)}MB). Maks: ${maxMb}MB.`,
          );
        }
      }
      setDeleteVideo(false);
      setVideo(file);
    },
    [setVideo],
  );

  return (
    <Layout>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="hidden md:block">
            <BreadCrumb title2={"Uredi oglas"} />
          </div>
          <div className="lmx-listing-flow relative mx-auto w-full max-w-[min(2280px,calc(100vw-8px))] overflow-x-clip px-1 sm:px-2.5 lg:px-4 xl:px-6 2xl:px-8">
            <div className="mt-2 flex min-w-0 min-h-[100dvh] flex-col gap-5 md:mt-5 md:gap-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-medium">{"Uredi oglas"}</h1>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-[#0ab6af]/35 bg-[#0ab6af]/12 px-4 py-2">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">
                      {completenessScore}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {"dovršen"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        draftStatus === "error"
                          ? "bg-rose-500"
                          : draftStatus === "saving"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    {draftStatus === "saving"
                      ? "Čuvam nacrt…"
                      : draftStatus === "error"
                        ? "Greška pri čuvanju nacrta"
                        : draftSavedAgoLabel
                          ? `Zadnje sačuvano ${draftSavedAgoLabel}`
                          : "Lokalni nacrt nije sačuvan"}
                    <span className="text-slate-400">•</span>
                    {draftServerSavedAgoLabel
                      ? `Server ${draftServerSavedAgoLabel}`
                      : "Server na čekanju"}
                  </div>
                </div>
              </div>

              {hasVerificationWarnings ? (
                <Alert className="relative border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                  <AlertTitle>Nedovršena verifikacija naloga</AlertTitle>
                  <AlertDescription className="space-y-1 text-amber-800/95 dark:text-amber-100/90">
                    <p>
                      Za sigurnije oglase potvrdi{" "}
                      {!isPhoneVerified && !isEmailVerified
                        ? "telefon i e-mail"
                        : !isPhoneVerified
                          ? "telefon"
                          : "e-mail"}
                      .
                    </p>
                    <p>
                      Aktivni kontakt za oglas:{" "}
                      <span className="font-semibold">
                        {sellerPhoneDisplay ||
                          "nije postavljen u Seller postavkama"}
                      </span>
                    </p>
                    <CustomLink
                      href="/profile?tab=seller-settings"
                      className="inline-flex text-xs font-semibold text-amber-800 underline underline-offset-2 dark:text-amber-200"
                    >
                      Otvori Seller postavke
                    </CustomLink>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
                  <div
                    ref={wizardTopRef}
                    className="lmx-flow-wizard relative overflow-visible rounded-2xl border border-slate-200/60 bg-white/95 px-3 py-4 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/82 sm:rounded-[24px] sm:px-6 sm:py-6"
                  >
                    <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
                    <div className="pointer-events-none absolute -left-12 bottom-0 h-24 w-24 rounded-full bg-[#0ab6af]/15 blur-2xl dark:bg-[#0ab6af]/20" />

                    <div className="relative mb-5 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:border-primary/30 dark:bg-primary/20">
                        <Sparkles className="h-3.5 w-3.5" />
                        Korak {activeStepIndex + 1} od {steps.length}
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                        Preostalo:{" "}
                        {Math.max(steps.length - (activeStepIndex + 1), 0)}
                      </p>
                    </div>

                    <div className="relative">
                      <div className="relative">
                        <div
                          ref={stepRailRef}
                          className="pointer-events-none absolute inset-x-0 top-[16px] h-1 rounded-full bg-slate-200/90 dark:bg-slate-700/80 sm:top-[22px]"
                        />
                        <motion.div
                          className="pointer-events-none absolute top-[16px] h-1 rounded-full bg-[#0ab6af] shadow-[0_0_20px_-4px_rgba(10,182,175,0.75)] sm:top-[22px]"
                          initial={false}
                          animate={{
                            left: stepRailFill.left,
                            width: stepRailFill.width,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 230,
                            damping: 30,
                            mass: 0.45,
                          }}
                        />

                        <div
                          className="relative z-[5] grid gap-2 sm:gap-4"
                          style={{
                            gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                          }}
                        >
                          {steps.map((s, idx) => {
                            const progress = getStepProgress(s.id);
                            const isActive = idx === activeStepIndex;
                            const isCompleted = idx < activeStepIndex;

                            return (
                              <motion.button
                                key={s.id}
                                type="button"
                                layout
                                onClick={() => handleTabClick(s.id)}
                                whileTap={
                                  !s.disabled ? { scale: 0.97 } : undefined
                                }
                                disabled={s.disabled}
                                className={`group flex min-w-0 flex-col items-center gap-1.5 text-center transition-colors sm:gap-2 ${
                                  s.disabled
                                    ? "cursor-not-allowed opacity-60"
                                    : "cursor-pointer"
                                }`}
                              >
                                <div
                                  ref={(node) => {
                                    stepNodeRefs.current[idx] = node;
                                  }}
                                  className="relative"
                                >
                                  {isActive && (
                                    <motion.span
                                      className="pointer-events-none absolute inset-0 rounded-full bg-primary/20 blur-md"
                                      initial={{ opacity: 0.2, scale: 0.8 }}
                                      animate={{ opacity: 0.45, scale: 1.18 }}
                                      transition={{
                                        duration: 0.35,
                                        ease: "easeOut",
                                      }}
                                    />
                                  )}

                                  <motion.span
                                    initial={false}
                                    animate={
                                      isActive
                                        ? { scale: 1.08, y: -1 }
                                        : isCompleted
                                          ? { scale: 1 }
                                          : { scale: 0.98 }
                                    }
                                    transition={{
                                      type: "spring",
                                      stiffness: 280,
                                      damping: 22,
                                    }}
                                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold sm:h-11 sm:w-11 sm:text-sm ${
                                      isActive
                                        ? "border-primary bg-white text-primary shadow-[0_10px_24px_-14px_rgba(8,145,178,0.9)] dark:bg-slate-950"
                                        : ""
                                    } ${
                                      isCompleted
                                        ? "border-primary bg-primary text-white"
                                        : ""
                                    } ${
                                      !isActive && !isCompleted
                                        ? "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                                        : ""
                                    }`}
                                  >
                                    <AnimatePresence
                                      mode="wait"
                                      initial={false}
                                    >
                                      {isCompleted ? (
                                        <motion.span
                                          key={`done-${s.id}`}
                                          initial={{
                                            opacity: 0,
                                            scale: 0.7,
                                            y: 4,
                                          }}
                                          animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                          }}
                                          exit={{
                                            opacity: 0,
                                            scale: 0.8,
                                            y: -4,
                                          }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </motion.span>
                                      ) : (
                                        <motion.span
                                          key={`index-${s.id}`}
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -4 }}
                                          transition={{ duration: 0.18 }}
                                        >
                                          {idx + 1}
                                        </motion.span>
                                      )}
                                    </AnimatePresence>
                                  </motion.span>
                                </div>

                                <motion.span
                                  initial={false}
                                  animate={{ y: isActive ? 0 : 1 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                  }}
                                  className={`line-clamp-2 max-w-[58px] text-[10px] font-medium leading-[1.1] sm:max-w-[120px] sm:text-xs sm:leading-tight ${
                                    isActive
                                      ? "font-semibold text-primary"
                                      : "text-slate-500 dark:text-slate-300"
                                  }`}
                                >
                                  <span className="sm:hidden">
                                    {s.mobileLabel || s.label}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {s.label}
                                  </span>
                                </motion.span>

                                <div className="hidden h-[3px] w-12 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70 sm:block sm:w-14">
                                  <motion.div
                                    className="h-full rounded-full bg-[#0ab6af]"
                                    initial={false}
                                    animate={{
                                      width: `${isCompleted ? 100 : isActive ? progress : 0}%`,
                                    }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 190,
                                      damping: 24,
                                    }}
                                  />
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {renderedStep === 1 && selectedCategoryPath?.length > 0 && (
                    <div className="lmx-flow-category-trail flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/92 p-3 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/78 sm:p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-500">
                          {"Odabrana kategorija"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {selectedCategoryPath?.map((item, index) => (
                          <div key={item.id} className="flex items-center">
                            <span
                              className={`
                                text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-default
                                ${
                                  index === selectedCategoryPath.length - 1
                                    ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                                    : "bg-gray-50 text-gray-700 border border-gray-200"
                                }
                              `}
                            >
                              {item.translated_name || item.name}
                            </span>

                            {index !== selectedCategoryPath.length - 1 && (
                              <ChevronRight
                                size={16}
                                className="text-gray-400 mx-1"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="lmx-flow-panel relative z-10 overflow-visible rounded-2xl border border-slate-200/60 bg-white/95 p-2.5 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900/82 sm:p-4">
                    {renderedStep === 1 && (
                      <EditComponentOne
                        setTranslations={setTranslations}
                        current={currentDetails}
                        langId={langId}
                        defaultLangId={defaultLangId}
                        handleDetailsSubmit={handleDetailsSubmit}
                        is_job_category={is_job_category}
                        is_real_estate={is_real_estate}
                        real_estate_area_m2={realEstateAreaM2}
                        isPriceOptional={isPriceOptional}
                      />
                    )}

                    {renderedStep === 2 && customFields.length > 0 && (
                      <EditComponentTwo
                        customFields={customFields}
                        extraDetails={extraDetails}
                        setExtraDetails={setExtraDetails}
                        handleGoBack={handleGoBack}
                        filePreviews={filePreviews}
                        setFilePreviews={setFilePreviews}
                        submitExtraDetails={submitExtraDetails}
                        currentExtraDetails={currentExtraDetails}
                        langId={langId}
                        defaultLangId={defaultLangId}
                        isAvailable={availableNow}
                        setIsAvailable={setAvailableNow}
                        isExchange={exchangePossible}
                        setIsExchange={setExchangePossible}
                      />
                    )}

                    {renderedStep === 3 && (
                      <EditComponentThree
                        setUploadedImages={setUploadedImagesProcessed}
                        uploadedImages={uploadedImages}
                        OtherImages={OtherImages}
                        setOtherImages={setOtherImagesProcessed}
                        handleImageSubmit={handleImageSubmit}
                        handleGoBack={handleGoBack}
                        setDeleteImagesId={setDeleteImagesId}
                        video={video}
                        setVideo={setVideoValidated}
                        onVideoDeleted={() => setDeleteVideo(true)}
                        onVideoSelected={() => setDeleteVideo(false)}
                        addVideoToStory={addVideoToStory}
                        setAddVideoToStory={setAddVideoToStory}
                        publishToInstagram={publishToInstagram}
                        setPublishToInstagram={setPublishToInstagram}
                        instagramConnected={instagramConnection.connected}
                        instagramStatusLoading={
                          instagramConnection.loading ||
                          instagramConnection.syncing
                        }
                        onConnectInstagram={handleConnectInstagram}
                        socialPostingUnavailable={
                          SOCIAL_POSTING_TEMP_UNAVAILABLE
                        }
                        socialPostingUnavailableMessage={
                          SOCIAL_POSTING_UNAVAILABLE_MESSAGE
                        }
                        instagramSourceUrl={instagramSourceUrl}
                        onInstagramSourceUrlChange={setInstagramSourceUrl}
                        onUseInstagramAsVideoLink={
                          handleUseInstagramAsVideoLink
                        }
                        videoLink={defaultDetails?.video_link || ""}
                        onVideoLinkChange={handleVideoLinkChange}
                      />
                    )}

                    {renderedStep === 4 && (
                      <EditComponentFour
                        handleGoBack={handleGoBack}
                        location={Location}
                        setLocation={setLocation}
                        handleFullSubmission={handleFullSubmission}
                        isAdPlaced={isAdPlaced}
                        setScheduledAt={setScheduledAt}
                        isRealEstate={is_real_estate}
                      />
                    )}
                  </div>
                </div>

                {/* 📱 DESNA STRANA - LIVE PREVIEW */}
                <div className="hidden min-w-0 lg:col-span-1 lg:block">
                  <div className="sticky top-4 min-w-0 overflow-visible rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <Zap className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">
                        {"Pregled oglasa"}
                      </h3>
                    </div>

                    <div className="mb-4 rounded-2xl border border-[#0ab6af]/30 bg-[#0ab6af]/8 p-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0ab6af]">
                            Što je ostalo
                          </p>
                          <h4 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {listingFlowIssues.length
                              ? "Dovrši preostale stavke"
                              : "Sve je spremno za spremanje"}
                          </h4>
                        </div>
                        <span className="rounded-full border border-[#0ab6af]/35 bg-white/85 px-2 py-0.5 text-xs font-semibold text-[#0ab6af] dark:bg-slate-900/75">
                          {listingFlowPercent}%
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#0ab6af]/20">
                        <motion.div
                          className="h-full rounded-full bg-[#0ab6af]"
                          initial={false}
                          animate={{ width: `${listingFlowPercent}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 28,
                          }}
                        />
                      </div>

                      {listingFlowIssues.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {listingFlowIssues.slice(0, 5).map((issue) => (
                            <button
                              key={`issue-${issue.id}`}
                              type="button"
                              onClick={() => goToListingIssue(issue)}
                              className="group flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-left transition-all hover:border-[#0ab6af]/45 hover:bg-[#0ab6af]/10 dark:border-slate-700 dark:bg-slate-900/70"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                                  {issue.label}
                                </p>
                                <p className="truncate text-[11px] text-slate-500 dark:text-slate-300">
                                  {issue.hint}
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 shrink-0 text-[#0ab6af] transition-transform group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Oglas je spreman
                        </div>
                      )}
                    </div>

                    <div className="pointer-events-none select-none">
                      <ProductCard item={previewCardItem} />
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {"Ocjena kvaliteta oglasa"}
                          </span>
                          <span className="text-primary font-semibold">
                            {completenessScore}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0ab6af] transition-all duration-500"
                            style={{ width: `${completenessScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {uploadedImages.length === 0 && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-800">
                              {"Dodaj barem jednu sliku!"} (+20% {"vidljivost"})
                            </p>
                          </div>
                        )}

                        {uploadedImages.length > 0 &&
                          OtherImages.length < 3 && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-blue-800">
                                {"Dodaj još {count} fotografija".replace(
                                  "{count}",
                                  3 - OtherImages.length,
                                )}{" "}
                                (+{(3 - OtherImages.length) * 5}%{" "}
                                {"veća vidljivost!"})
                              </p>
                            </div>
                          )}

                        {defaultDetails.description &&
                          defaultDetails.description.length < 100 && (
                            <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <Award className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-purple-800">
                                {"Detaljan opis"} (+10% {"pouzdanost"})
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <AdsEditSuccessModal
            openSuccessModal={openSuccessModal}
            setOpenSuccessModal={setOpenSuccessModal}
            createdAdSlug={CreatedAdSlug}
            isScheduled={Boolean(scheduledAt)}
            scheduledDate={scheduledAt}
            adName={defaultDetails?.name || ""}
            categoryLabel={successCategoryLabel}
            priceLabel={successPriceLabel}
            locationLabel={successLocationLabel}
            publishToInstagram={publishToInstagram}
            completenessScore={completenessScore}
            isFeatured={isFeatured}
          />
        </>
      )}
    </Layout>
  );
};

export default Checkauth(EditListing);
