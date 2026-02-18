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
import { useSelector } from "react-redux";
import AdsEditSuccessModal from "./AdsEditSuccessModal";
import {
  getDefaultLanguageCode,
  getLanguages,
} from "@/redux/reducer/settingSlice";
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
} from "@/components/Common/UnifiedIconPack";


// =======================================================
// MEDIA HELPERS (client-side)
// - Images: compress + watermark IMMEDIATELY on select
// - Video: we only validate size here (compression should be server-side)
// =======================================================
const WATERMARK_TEXT_DEFAULT = "LMX.ba";

const isFileLike = (v) =>
  typeof File !== "undefined" &&
  (v instanceof File || v instanceof Blob);

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

const compressAndWatermarkImage = async (
  file,
  {
    maxSize = 2000,
    quality = 0.92,
    watermarkText = WATERMARK_TEXT_DEFAULT,
    watermarkOpacity = 0.55,
    watermarkPadding = 18,
    watermarkFontSize = 22,
    minBytesToProcess = 250 * 1024, // ne diraj mini fajlove
  } = {}
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

  // Watermark (bottom-right)
  if (watermarkText) {
    ctx.save();
    ctx.globalAlpha = watermarkOpacity;

    const fontSize = Math.max(14, Math.round((outW / 1000) * watermarkFontSize));
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.textBaseline = "bottom";

    const text = watermarkText;
    const metrics = ctx.measureText(text);
    const textW = metrics.width;

    const pad = Math.max(10, Math.round((outW / 1000) * watermarkPadding));
    const x = outW - pad;
    const y = outH - pad;

    // shadow + stroke + fill (čita se na svemu)
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.55)";
    ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.08));

    ctx.strokeText(text, x - textW, y);
    ctx.fillText(text, x - textW, y);

    ctx.restore();
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

const extractTempMediaId = (value) => {
  if (!value || typeof value !== "object") return null;
  return (
    value?.id ??
    value?.temp_id ??
    value?.tempId ??
    value?.upload_id ??
    value?.uploadId ??
    value?.media_id ??
    value?.mediaId ??
    value?.file_id ??
    value?.fileId ??
    null
  );
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
    else if (candidate !== undefined && candidate !== null) values.push(candidate);
  }
  return values;
};

const readBooleanFromTranslatedFields = (listingData = {}, hints = []) => {
  const normalizedHints = hints.map((hint) => normalizeText(hint));
  const fields = getTranslatedCustomFields(listingData);
  if (!fields.length) return null;

  for (const field of fields) {
    const fieldName = normalizeText(field?.translated_name || field?.name || "");
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

  const fromCustomFields = readBooleanFromCustomFields(listingData?.custom_fields, [
    "available_now",
    "is_available",
    "is_avaible",
    "isAvailable",
    "availableNow",
    "dostupno_odmah",
    "ready_for_pickup",
  ]);
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

  const fromCustomFields = readBooleanFromCustomFields(listingData?.custom_fields, [
    "exchange_possible",
    "is_exchange",
    "is_exchange_possible",
    "allow_exchange",
    "exchange",
    "zamjena",
    "zamena",
    "trade",
    "swap",
  ]);
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
  const [isMediaProcessing, setIsMediaProcessing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [availableNow, setAvailableNow] = useState(false);
  const [exchangePossible, setExchangePossible] = useState(false);
  const [stepRailFill, setStepRailFill] = useState({ left: 0, width: 0 });
  
  const [isFeatured, setIsFeatured] = useState(false);


  const languages = useSelector(getLanguages);
  const defaultLanguageCode = useSelector(getDefaultLanguageCode);
  const defaultLangId = languages?.find(
    (lang) => lang.code === defaultLanguageCode
  )?.id;

  const [extraDetails, setExtraDetails] = useState({
    [defaultLangId]: {},
  });
  const [langId, setLangId] = useState(defaultLangId);

  const [translations, setTranslations] = useState({
    [defaultLangId]: {},
  });
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
      (key) => translations?.[key] && typeof translations[key] === "object"
    );
    return firstTranslationKey ?? defaultLangId ?? langId;
  }, [defaultLangId, langId, translations]);

  const defaultDetails = translations?.[primaryLangId] || {};
  const currentDetails = useMemo(
    () => ({
      ...(translations?.[primaryLangId] || {}),
      ...(translations?.[langId] || {}),
    }),
    [langId, primaryLangId, translations]
  );
  const currentExtraDetails =
    extraDetails?.[langId] || extraDetails?.[primaryLangId] || {};

  const is_job_category =
    Number(
      selectedCategoryPath[selectedCategoryPath.length - 1]?.is_job_category
    ) === 1;
  const isPriceOptional =
    Number(
      selectedCategoryPath[selectedCategoryPath.length - 1]?.price_optional
    ) === 1;
  const is_real_estate = useMemo(
    () => isRealEstateCategoryPath(selectedCategoryPath),
    [selectedCategoryPath]
  );
  const realEstateAreaM2 = useMemo(
    () =>
      extractAreaM2FromCustomFieldValues({
        customFields,
        extraDetails,
        languageId: langId,
        fallbackLanguageId: defaultLangId,
      }),
    [customFields, defaultLangId, extraDetails, langId]
  );
  const realEstatePriceState = useMemo(
    () =>
      resolveRealEstatePerSquareValue({
        details: defaultDetails,
        areaM2: realEstateAreaM2,
        totalPrice: defaultDetails?.price,
      }),
    [defaultDetails, realEstateAreaM2]
  );
  const effectiveRealEstateTotalPrice = useMemo(() => {
    if (!is_real_estate || !realEstatePriceState.enabled) return null;
    if (realEstatePriceState.mode !== REAL_ESTATE_PRICE_MODE_MANUAL) return null;
    return realEstatePriceState.derivedTotalPrice;
  }, [is_real_estate, realEstatePriceState]);

  const completenessScore = useMemo(() => {
    let score = 0;
    if (selectedCategoryPath.length > 0) score += 20;
    if (defaultDetails.name && defaultDetails.description && defaultDetails.contact) {
      score += 20;
    }
    if (customFields.length === 0) {
      score += 20;
    } else {
      const filledFields = Object.keys(currentExtraDetails).filter(
        key => currentExtraDetails[key] && currentExtraDetails[key] !== ""
      ).length;
      score += (filledFields / customFields.length) * 20;
    }
    if (uploadedImages.length > 0) {
      score += 10;
      if (OtherImages.length >= 3) score += 10;
      else score += (OtherImages.length / 3) * 10;
    }
    if (Location?.country && Location?.state && Location?.city && Location?.address) {
      score += 20;
    }
    return Math.round(score);
  }, [selectedCategoryPath, defaultDetails, customFields, currentExtraDetails, uploadedImages, OtherImages, Location]);

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
          listingData?.all_translated_custom_fields
        ),
        fetchCategoryPath(listingData?.category_id),
      ]);

      setUploadedImages(listingData?.image ? [listingData.image] : []);
      setOtherImages(listingData?.gallery_images || []);
      setVideo(listingData?.video || null);
      setAddVideoToStory(
        Boolean(listingData?.add_video_to_story || listingData?.publish_to_story)
      );
      setPublishToInstagram(
        Boolean(
          listingData?.publish_to_instagram || listingData?.instagram_auto_post
        )
      );
      const existingVideoLink = String(listingData?.video_link || "");
      const fallbackInstagramLink = existingVideoLink.includes("instagram.com/")
        ? existingVideoLink
        : "";
      setInstagramSourceUrl(
        listingData?.instagram_source_url || fallbackInstagramLink
      );
      setDeleteVideo(false);
      setIsFeatured(Number(listingData?.is_feature) === 1);
      setAvailableNow(readAvailableNowFromListingData(listingData));
      setExchangePossible(readExchangeFromListingData(listingData));

      const mainDetailsTranslation = getMainDetailsTranslations(
        listingData,
        languages,
        defaultLangId
      );

      setTranslations(mainDetailsTranslation);
      setLocation({
        country: listingData?.country,
        state: listingData?.state,
        city: listingData?.city,
        address: listingData?.address || listingData?.formatted_address,
        formattedAddress: listingData?.formatted_address || listingData?.address,
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
          (Number.isFinite(Number(listingData?.latitude)) &&
          Number.isFinite(Number(listingData?.longitude))
            ? "map"
            : "profile"),
      });
    } catch (error) {
      console.log(error);
    } finally {
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
      toast.error(t("uploadMainPicture"));
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
    [defaultLangId, langId, primaryLangId]
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
        Array.isArray(accounts) && accounts.find((entry) => entry?.platform === "instagram");
      const connected = Boolean(igAccount?.connected || igAccount?.status === "connected");
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
      const res = await socialMediaApi.connectAccount({ platform: "instagram", mode: "oauth" });
      const authUrl = res?.data?.data?.auth_url;
      if (!authUrl) {
        throw new Error(res?.data?.message || "OAuth link nije dostupan.");
      }

      await runSocialOAuthPopup({ platform: "instagram", authUrl });
      toast.success("Instagram je uspješno povezan.");
      await fetchInstagramConnection();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Povezivanje Instagrama nije uspjelo.");
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
      if (["true", "da", "yes", "on", "enabled"].includes(normalized)) return true;
      if (["false", "ne", "no", "off", "disabled"].includes(normalized)) return false;
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
      Object.keys(translations || {}).forEach((key) => candidateKeys.push(String(key)));

      const uniqueKeys = [...new Set(candidateKeys)];
      for (const key of uniqueKeys) {
        const value = translations?.[key]?.[field];
        if (value !== undefined && value !== null) return value;
      }

      return fallback;
    },
    [defaultLangId, langId, primaryLangId, translations]
  );

  const handleFullSubmission = (scheduledDateTime = null) => {
    const {
      name,
      description,
      price,
      slug,
      contact,
      video_link,
      min_salary,
      max_salary,
      country_code,
    } = defaultDetails;
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
      false
    );
    const resolvedInventoryCount = getSharedDetailValue("inventory_count", 0);
    const resolvedStockAlertThreshold = getSharedDetailValue("stock_alert_threshold", 3);
    const scarcityEnabled = !is_real_estate && Boolean(resolvedScarcityEnabled);
    const inventoryCount = Number(resolvedInventoryCount || 0);
    const lowThreshold = Math.max(1, Number(resolvedStockAlertThreshold || 3));

    if (!name.trim() || !description.trim() || !contact) {
      toast.error(t("completeDetails"));
      setStep(1);
      return;
    }

    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      toast.error(t("invalidPhoneNumber"));
      return setStep(1);
    }

    if (is_job_category) {
      const min = min_salary ? Number(min_salary) : null;
      const max = max_salary ? Number(max_salary) : null;

      if (min !== null && min < 0) {
        toast.error(t("enterValidSalaryMin"));
        setStep(1);
        return;
      }

      if (max !== null && max < 0) {
        toast.error(t("enterValidSalaryMax"));
        setStep(1);
        return;
      }
      if (min !== null && max !== null) {
        if (min === max) {
          toast.error(t("salaryMinCannotBeEqualMax"));
          return setStep(1);
        }
        if (min > max) {
          toast.error(t("salaryMinCannotBeGreaterThanMax"));
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
        toast.error(t("completeDetails"));
        return setStep(1);
      }

      if (!isEmpty(price) && isNegative(price) && !effectiveManualPrice && !manualPerM2ModeActive) {
        toast.error(t("enterValidPrice"));
        return setStep(1);
      }
    }

    if (!isEmpty(slug) && !SLUG_RE.test(slug.trim())) {
      toast.error(t("addValidSlug"));
      return setStep(1);
    }

    if (!isEmpty(video_link) && !isValidURL(video_link)) {
      toast.error(t("enterValidUrl"));
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
      toast.error("Instagram nalog nije povezan. Povežite Instagram pa pokušajte ponovo.");
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
      toast.error(t("uploadMainPicture"));
      setStep(3);
      return;
    }

    if (
      !Location?.country ||
      !Location?.state ||
      !Location?.city ||
      !Location?.address
    ) {
      toast.error(t("pleaseSelectCity"));
      return;
    }

    const realEstateLocationSource = String(Location?.location_source || "").toLowerCase();
    const hasPreciseRealEstatePin =
      Number.isFinite(Number(Location?.lat)) && Number.isFinite(Number(Location?.long));
    const usesRealEstateProfileLocation =
      is_real_estate &&
      (realEstateLocationSource === "profile" ||
        (!hasPreciseRealEstatePin && realEstateLocationSource !== "map"));

    if (is_real_estate && !usesRealEstateProfileLocation && !hasPreciseRealEstatePin) {
      toast.error("Za nekretninu označite tačnu lokaciju na mapi.");
      return setStep(4);
    }

    if (is_real_estate && realEstatePriceState.enabled && !realEstatePriceState.hasArea) {
      toast.error("Unesite površinu nekretnine (m²) prije prikaza cijene po m².");
      return setStep(customFields?.length ? 2 : 1);
    }

    if (
      is_real_estate &&
      realEstatePriceState.enabled &&
      realEstatePriceState.mode === "auto" &&
      (defaultDetails?.price_on_request || !Number(defaultDetails?.price))
    ) {
      toast.error("Za automatsku cijenu po m² prvo unesite ukupnu cijenu oglasa.");
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

    if (scarcityEnabled && (!Number.isFinite(inventoryCount) || inventoryCount <= 0)) {
      toast.error("Za opciju 'Do isteka zaliha' unesite količinu na zalihi veću od 0.");
      return setStep(1);
    }

    if (scarcityEnabled && inventoryCount > lowThreshold) {
      toast.info("Oznaka 'Do isteka zaliha' će se automatski aktivirati kada zaliha padne na zadani prag.");
    }

    editAd(scheduledDateTime);
  };

  const editAd = async (scheduledDateTime = null) => {
    const nonDefaultTranslations = filterNonDefaultTranslations(
      translations,
      primaryLangId
    );
    const customFieldTranslations =
      prepareCustomFieldTranslations(extraDetails);
 
    const customFieldFiles = prepareCustomFieldFiles(
      extraDetails,
      primaryLangId
    );
 
  const mainTempId = extractTempMediaId(uploadedImages?.[0]);
  
  const galleryTempIds = (OtherImages || [])
    .map((x) => extractTempMediaId(x))
    .filter(Boolean);
  
  const videoTempId = extractTempMediaId(video);
  const trimmedVideoLink = (defaultDetails?.video_link || "").trim();
  
    const allData = {
    id: id,
    name: defaultDetails.name,
    slug: defaultDetails.slug.trim(),
    description: defaultDetails?.description,
    price:
      is_real_estate && effectiveRealEstateTotalPrice
        ? effectiveRealEstateTotalPrice
        : defaultDetails.price,
    contact: defaultDetails.contact,
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
    price_per_unit:
      is_real_estate
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
      : parseBooleanSetting(getSharedDetailValue("scarcity_enabled", false), false),
    region_code: defaultDetails?.region_code?.toUpperCase() || "",
    video_link: trimmedVideoLink,
    instagram_source_url: (instagramSourceUrl || "").trim(),
    publish_to_instagram: SOCIAL_POSTING_TEMP_UNAVAILABLE
      ? false
      : Boolean(publishToInstagram),
  
    // ✅ OLD mode (fallback): šalji fajl samo ako je File/Blob
    image:
      uploadedImages?.[0] instanceof File || uploadedImages?.[0] instanceof Blob
        ? uploadedImages[0]
        : null,
  
    gallery_images:
      OtherImages?.filter((x) => x instanceof File || x instanceof Blob) || [],
  
    ...(video instanceof File ? { video } : {}),
  
    // ✅ NEW mode: temp upload IDs (kad su objekti {id,url})
    ...(mainTempId ? { temp_main_image_id: mainTempId } : {}),
    ...(galleryTempIds.length ? { temp_gallery_image_ids: galleryTempIds } : {}),
    ...(videoTempId && !trimmedVideoLink ? { temp_video_id: videoTempId } : {}),
    add_video_to_story: Boolean(addVideoToStory),
    ...(deleteVideo ? { delete_video: 1 } : {}),
  
    address: Location?.address,
    formatted_address: Location?.formattedAddress || Location?.address || "",
    address_translated: Location?.address_translated || Location?.address || "",
    latitude: Location?.lat,
    longitude: Location?.long,
    location_source: is_real_estate
      ? String(Location?.location_source || "").toLowerCase() === "profile"
        ? "profile"
        : "map"
      : String(Location?.location_source || "manual").toLowerCase(),
    custom_field_files: customFieldFiles,
    country: Location?.country,
    state: Location?.state,
    city: Location?.city,
    ...(
      is_real_estate
        ? { area_id: Location?.area_id ? Number(Location?.area_id) : "" }
        : Location?.area_id
        ? { area_id: Number(Location?.area_id) }
        : {}
    ),
  
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
      allData.is_on_sale = defaultDetails.is_on_sale || false;
      allData.old_price = defaultDetails.is_on_sale ? defaultDetails.old_price : null;
      
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
            toast.success("Izmjena je spremljena i dodana u red za Instagram objavu.");
          } catch (scheduleError) {
            const apiMessage = scheduleError?.response?.data?.message;
            toast.warning(
              apiMessage || "Izmjena je spremljena, ali Instagram objava nije zakazana."
            );
          }
        }

        setOpenSuccessModal(true);
        setCreatedAdSlug(res?.data?.data[0]?.slug);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsAdPlaced(false);
    }
  };

  const steps = useMemo(
    () => [
      { id: 1, label: t("details"), mobileLabel: "Detalji", icon: Circle, disabled: false },
      ...(customFields?.length > 0
        ? [{ id: 2, label: t("extraDetails"), mobileLabel: "Dodatno", icon: Circle, disabled: false }]
        : []),
      { id: 3, label: "Media", mobileLabel: "Mediji", icon: Circle, disabled: false },
      { id: 4, label: t("location"), mobileLabel: "Lokacija", icon: Circle, disabled: false },
    ],
    [customFields?.length]
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
        if (candidateDistance === closestDistance && candidate > closest) return candidate;
        return closest;
      });
    },
    [stepIdSequence]
  );

  useEffect(() => {
    const normalizedStep = resolveNearestStep(step);
    if (normalizedStep !== step) {
      setStep(normalizedStep);
    }
  }, [resolveNearestStep, step]);

  const activeStepId = resolveNearestStep(step);
  const activeStepIndex = Math.max(0, steps.findIndex((s) => s.id === activeStepId));
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
      typeof targetRect?.top === "number" ? window.scrollY + targetRect.top - topOffset : 0;

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
    const minVisibleWidth = Math.min(2, Math.max(0, railRect.width - clampedStart));
    const nextFill = { left: clampedStart, width: rawWidth > 1 ? rawWidth : minVisibleWidth };

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
            return defaultDetails.name && defaultDetails.description && defaultDetails.contact
              ? 100
              : defaultDetails.name || defaultDetails.description || defaultDetails.contact
              ? 55
              : 0;
          case 2:
            return Object.keys(currentExtraDetails).length > 0 ? 100 : 0;
          case 3:
            return uploadedImages.length > 0 ? 100 : 0;
          case 4:
            return Location?.address && Location?.city && Location?.state && Location?.country
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
      Location?.state,
      activeStepIndex,
      currentExtraDetails,
      defaultDetails.contact,
      defaultDetails.description,
      defaultDetails.name,
      steps,
      uploadedImages.length,
    ]
  );

  const getPreviewImage = () => {
    if (uploadedImages && uploadedImages.length > 0) {
      const img = uploadedImages[0];
      if (img instanceof Blob || img instanceof File) {
        return URL.createObjectURL(img);
      }
      if (typeof img === 'string') {
        return img;
      }
    }
    if (OtherImages && OtherImages.length > 0) {
       const galleryImg = OtherImages[0];
       if (typeof galleryImg === 'string') return galleryImg;
       if (galleryImg?.image) return galleryImg.image;
       if (galleryImg instanceof File) return URL.createObjectURL(galleryImg);
    }
    return null;
  };

  const isOnSale = defaultDetails.is_on_sale;
  const oldPrice = Number(defaultDetails.old_price);
  const currentPrice = Number(
    is_real_estate && effectiveRealEstateTotalPrice
      ? effectiveRealEstateTotalPrice
      : defaultDetails.price
  );
  const hasCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0;
  const showDiscount = isOnSale && oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
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
    const previewName = defaultDetails?.name || t("Vaš naslov oglasa ovdje");
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
      show_price_per_m2: Boolean(is_real_estate && realEstatePriceState.enabled),
      price_per_m2_mode: realEstatePriceState?.mode || "auto",
      price_per_unit:
        realEstatePriceState?.mode === REAL_ESTATE_PRICE_MODE_MANUAL
          ? Number(realEstatePriceState?.manualValue || 0)
          : Number(realEstatePriceState?.resolvedValue || 0),
      real_estate_price_per_m2: Number(realEstatePriceState?.resolvedValue || 0),
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
    [Location?.city, Location?.state, Location?.country].filter(Boolean).join(", ") ||
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
    ? t("Na upit")
    : showDiscount
    ? `${formatPriceAbbreviated(currentPrice)} (sniženo sa ${formatPriceAbbreviated(oldPrice)})`
    : hasCurrentPrice
    ? formatPriceAbbreviated(currentPrice)
    : "";

  // =======================================================
  // MEDIA: kompresija + watermark odmah na selekciju
  // (EditComponentThree će i dalje samo zvati setUploadedImages / setOtherImages / setVideo)
  // =======================================================
  const setUploadedImagesProcessed = useCallback(
    async (files) => {
      const arr = normalizeFilesArray(files);
      if (!arr.length) return setUploadedImages([]);
      try {
        setIsMediaProcessing(true);
        const [main] = await processImagesArray([arr[0]]);
        setUploadedImages(main ? [main] : []);
      } catch (e) {
        console.error(e);
        toast.error("Ne mogu obraditi sliku. Pokušaj ponovo.");
        setUploadedImages(arr.slice(0, 1));
      } finally {
        setIsMediaProcessing(false);
      }
    },
    [setUploadedImages]
  );

  const setOtherImagesProcessed = useCallback(
  async (next) => {
    // EditComponentThree nekad poziva setOtherImages sa functional updaterom
    // (prev => [...prev, ...files]). Moramo to podržati.
    const prev = otherImagesRef.current || [];

    // 1) functional updater
    if (typeof next === "function") {
      const computed = next(prev);

      // Ako se radi o brisanju / re-order i sl. (manji ili isti broj)
      if (!Array.isArray(computed) || computed.length <= prev.length) {
        setOtherImages(computed);
        return;
      }

      // Pretpostavka: dodavanje na kraj (append)
      const added = computed.slice(prev.length);

      try {
        setIsMediaProcessing(true);

        // Obradi samo dodane fajlove (watermark + kompresija)
        const processedAdded = await processImagesArray(added);

        setOtherImages([...prev, ...processedAdded]);
      } catch (e) {
        console.error(e);
        toast.error("Ne mogu obraditi slike. Pokušaj ponovo.");
        setOtherImages(computed);
      } finally {
        setIsMediaProcessing(false);
      }
      return;
    }

    // 2) array / filelist / single
    const arr = normalizeFilesArray(next);
    if (!arr.length) {
      setOtherImages([]);
      return;
    }

    try {
      setIsMediaProcessing(true);
      const processed = await processImagesArray(arr);
      // default: zamijeni kompletan set
      setOtherImages(processed);
    } catch (e) {
      console.error(e);
      toast.error("Ne mogu obraditi slike. Pokušaj ponovo.");
      setOtherImages(arr);
    } finally {
      setIsMediaProcessing(false);
    }
  },
  [setOtherImages]
);

  const setVideoValidated = useCallback(
    async (fileOrList) => {
      const [file] = normalizeFilesArray(fileOrList);
      if (!file) return setVideo(null);

      if (isFileLike(file)) {
        const maxMb = 40; // promijeni po želji
        if (bytesToMB(file.size) > maxMb) {
          toast.error(`Video je prevelik (${bytesToMB(file.size)}MB). Maks: ${maxMb}MB.`);
        }
      }
      setDeleteVideo(false);
      setVideo(file);
    },
    [setVideo]
  );

  return (
    <Layout>
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <BreadCrumb title2={t("editListing")} />
          <div className="container relative overflow-x-hidden">
            <div className="mt-8 flex min-w-0 flex-col gap-8 overflow-x-hidden">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-medium">{t("editListing")}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 rounded-full">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">{completenessScore}%</span>
                    <span className="text-sm text-muted-foreground">{t("dovršen")}</span>
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
                
                <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
                  
                  <div
                    ref={wizardTopRef}
                    className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 px-4 py-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 sm:py-6"
                  >
                    <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
                    <div className="pointer-events-none absolute -left-12 bottom-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl dark:bg-cyan-300/20" />

                    <div className="relative mb-5 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:border-primary/30 dark:bg-primary/20">
                        <Sparkles className="h-3.5 w-3.5" />
                        Korak {activeStepIndex + 1} od {steps.length}
                      </div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                        Preostalo: {Math.max(steps.length - (activeStepIndex + 1), 0)}
                      </p>
                    </div>

                    <div className="relative">
                      <div className="relative">
                        <div
                          ref={stepRailRef}
                          className="pointer-events-none absolute inset-x-0 top-[16px] h-1 rounded-full bg-slate-200/90 dark:bg-slate-700/80 sm:top-[22px]"
                        />
                        <motion.div
                          className="pointer-events-none absolute top-[16px] h-1 rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary shadow-[0_0_20px_-4px_rgba(14,165,233,0.8)] sm:top-[22px]"
                          initial={false}
                          animate={{ left: stepRailFill.left, width: stepRailFill.width }}
                          transition={{ type: "spring", stiffness: 230, damping: 30, mass: 0.45 }}
                        />

                        <div
                          className="relative z-[2] grid gap-1 sm:gap-4"
                          style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
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
                                whileTap={!s.disabled ? { scale: 0.97 } : undefined}
                                disabled={s.disabled}
                                className={`group flex min-w-0 flex-col items-center gap-1.5 text-center transition-colors sm:gap-2 ${
                                  s.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
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
                                      transition={{ duration: 0.35, ease: "easeOut" }}
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
                                    transition={{ type: "spring", stiffness: 280, damping: 22 }}
                                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold sm:h-11 sm:w-11 sm:text-sm ${
                                      isActive
                                        ? "border-primary bg-white text-primary shadow-[0_10px_24px_-14px_rgba(8,145,178,0.9)] dark:bg-slate-950"
                                        : ""
                                    } ${
                                      isCompleted ? "border-primary bg-primary text-white" : ""
                                    } ${
                                      !isActive && !isCompleted
                                        ? "border-slate-300 bg-white text-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
                                        : ""
                                    }`}
                                  >
                                    <AnimatePresence mode="wait" initial={false}>
                                      {isCompleted ? (
                                        <motion.span
                                          key={`done-${s.id}`}
                                          initial={{ opacity: 0, scale: 0.7, y: 4 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 0.8, y: -4 }}
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
                                  transition={{ duration: 0.2, ease: "easeOut" }}
                                  className={`line-clamp-2 max-w-[58px] text-[10px] font-medium leading-[1.1] sm:max-w-[120px] sm:text-xs sm:leading-tight ${
                                    isActive ? "font-semibold text-primary" : "text-slate-500 dark:text-slate-300"
                                  }`}
                                >
                                  <span className="sm:hidden">{s.mobileLabel || s.label}</span>
                                  <span className="hidden sm:inline">{s.label}</span>
                                </motion.span>

                                <div className="hidden h-[3px] w-12 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70 sm:block sm:w-14">
                                  <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400"
                                    initial={false}
                                    animate={{ width: `${isCompleted ? 100 : isActive ? progress : 0}%` }}
                                    transition={{ type: "spring", stiffness: 190, damping: 24 }}
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
                    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-gray-500">
                          {t("selectedCategory")}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedCategoryPath?.map((item, index) => (
                          <div key={item.id} className="flex items-center">
                            <span
                              className={`
                                text-sm px-3 py-1.5 rounded-lg transition-all duration-200 cursor-default
                                ${index === selectedCategoryPath.length - 1 
                                  ? "bg-primary/10 text-primary font-semibold border border-primary/20" 
                                  : "bg-gray-50 text-gray-700 border border-gray-200"
                                }
                              `}
                            >
                              {item.translated_name || item.name}
                            </span>
                            
                            {index !== selectedCategoryPath.length - 1 && (
                              <ChevronRight size={16} className="text-gray-400 mx-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border rounded-lg p-6 bg-white shadow-sm">
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
                        instagramStatusLoading={instagramConnection.loading || instagramConnection.syncing}
                        onConnectInstagram={handleConnectInstagram}
                        socialPostingUnavailable={SOCIAL_POSTING_TEMP_UNAVAILABLE}
                        socialPostingUnavailableMessage={SOCIAL_POSTING_UNAVAILABLE_MESSAGE}
                        instagramSourceUrl={instagramSourceUrl}
                        onInstagramSourceUrlChange={setInstagramSourceUrl}
                        onUseInstagramAsVideoLink={handleUseInstagramAsVideoLink}
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
                <div className="min-w-0 lg:col-span-1">
                  <div className="sticky top-4 min-w-0 overflow-hidden rounded-2xl border bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <Zap className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">{t("Pregled oglasa")}</h3>
                    </div>

                    <div className="pointer-events-none select-none">
                      <ProductCard item={previewCardItem} />
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{t("Ocjena kvaliteta oglasa")}</span>
                          <span className="text-primary font-semibold">{completenessScore}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                            style={{ width: `${completenessScore}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        {uploadedImages.length === 0 && (
                          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-800">
                              {t("Dodajte bar jednu sliku!")} (+20% {t("visibility")})
                            </p>
                          </div>
                        )}

                        {uploadedImages.length > 0 && OtherImages.length < 3 && (
                          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-800">
                              {t("Dodajte još fotografija").replace("{count}", 3 - OtherImages.length)} (+{(3 - OtherImages.length) * 5}% {t("veća vidljivost!")})
                            </p>
                          </div>
                        )}

                        {defaultDetails.description && defaultDetails.description.length < 100 && (
                          <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <Award className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-purple-800">
                              {t("Detaljan opis")} (+10% {t("pouzdanost")})
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
