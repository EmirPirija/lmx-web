"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
import EditComponentOne from "./EditComponentOne";
import EditComponentTwo from "./EditComponentTwo";
import EditComponentThree from "./EditComponentThree";
import EditComponentFour from "./EditComponentFour";
import { toast } from "sonner";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";
import AdSuccessModal from "../AdsListing/AdSuccessModal";
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
  Upload, 
  MapPin,
  Clock,
  Images,
  ChevronRight 
} from "lucide-react";
import { IconRosetteDiscount, IconRocket } from "@tabler/icons-react";


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
  const [deleteVideo, setDeleteVideo] = useState(false);
  const [isMediaProcessing, setIsMediaProcessing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  const [availableNow, setAvailableNow] = useState(false);
  const [exchangePossible, setExchangePossible] = useState(false);
  
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

  const defaultDetails = translations[defaultLangId] || {};
  const currentDetails = translations[langId] || {};
  const currentExtraDetails = extraDetails[langId] || {};

  const is_job_category =
    Number(
      selectedCategoryPath[selectedCategoryPath.length - 1]?.is_job_category
    ) === 1;
  const isPriceOptional =
    Number(
      selectedCategoryPath[selectedCategoryPath.length - 1]?.price_optional
    ) === 1;

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
  }, [CurrentLanguage.id]);

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
    try {
      setIsLoading(true);
      const res = await getMyItemsApi.getMyItems({ id: Number(id) });
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
        address: listingData?.address,
        lat: listingData?.latitude,
        long: listingData?.longitude,
        area_id: listingData?.area_id ? listingData?.area_id : null,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
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
      setTranslations((prev) => ({
        ...prev,
        [defaultLangId]: {
          ...(prev?.[defaultLangId] || {}),
          video_link: value,
        },
      }));
      if ((value || "").trim()) {
        setDeleteVideo(false);
      }
    },
    [defaultLangId]
  );

  const handleUseInstagramAsVideoLink = useCallback(() => {
    const igLink = (instagramSourceUrl || "").trim();
    if (!igLink) return;
    handleVideoLinkChange(igLink);
  }, [handleVideoLinkChange, instagramSourceUrl]);

  const SLUG_RE = /^[a-z0-9-]+$/i;
  const isEmpty = (x) => !x || !x.toString().trim();
  const isNegative = (n) => Number(n) < 0;

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
      if (!defaultDetails.price_on_request && isEmpty(price)) {
        toast.error(t("completeDetails"));
        return setStep(1);
      }

      if (!isEmpty(price) && isNegative(price)) {
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
    editAd(scheduledDateTime);
  };

  const editAd = async (scheduledDateTime = null) => {
    const nonDefaultTranslations = filterNonDefaultTranslations(
      translations,
      defaultLangId
    );
    const customFieldTranslations =
      prepareCustomFieldTranslations(extraDetails);
 
    const customFieldFiles = prepareCustomFieldFiles(
      extraDetails,
      defaultLangId
    );
 
    const mainTempId =
    uploadedImages?.[0] && typeof uploadedImages?.[0] === "object"
      ? uploadedImages?.[0]?.id
      : null;
  
  const galleryTempIds = (OtherImages || [])
    .map((x) => (x && typeof x === "object" ? x.id : null))
    .filter(Boolean);
  
  const videoTempId =
    video && typeof video === "object" ? video.id : null;
  const trimmedVideoLink = (defaultDetails?.video_link || "").trim();
  
  const allData = {
    id: id,
    name: defaultDetails.name,
    slug: defaultDetails.slug.trim(),
    description: defaultDetails?.description,
    price: defaultDetails.price,
    contact: defaultDetails.contact,
    available_now: Boolean(availableNow),
    exchange_possible: Boolean(exchangePossible),
    is_exchange: Boolean(exchangePossible),
    allow_exchange: Boolean(exchangePossible),
    region_code: defaultDetails?.region_code?.toUpperCase() || "",
    video_link: trimmedVideoLink,
    instagram_source_url: (instagramSourceUrl || "").trim(),
    publish_to_instagram: Boolean(publishToInstagram),
  
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
    latitude: Location?.lat,
    longitude: Location?.long,
    custom_field_files: customFieldFiles,
    country: Location?.country,
    state: Location?.state,
    city: Location?.city,
    ...(Location?.area_id ? { area_id: Number(Location?.area_id) } : {}),
  
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
      allData.price = defaultDetails.price;
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
        if (publishToInstagram) {
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

  const steps = [
    { id: 1, label: t("details"), icon: Circle, disabled: false },
    ...(customFields?.length > 0 ? [{ id: 2, label: t("extraDetails"), icon: Circle, disabled: false }] : []),
    { id: 3, label: "Media", icon: Circle, disabled: false },
    { id: 4, label: t("location"), icon: Circle, disabled: false },
  ];

  const getStepProgress = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === step);
    
    if (stepIndex < currentIndex) return 100;
    if (stepIndex === currentIndex) {
      switch (stepId) {
        case 1: return (defaultDetails.name && defaultDetails.description) ? 100 : 50;
        case 2: return Object.keys(currentExtraDetails).length > 0 ? 100 : 0;
        case 3: return uploadedImages.length > 0 ? 100 : 0;
        case 4: return Location?.address ? 100 : 0;
        default: return 0;
      }
    }
    return 0;
  };

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

  // 🔴 NOVO: Funkcija za izvlačenje ključnih atributa za Preview
  const getPreviewAttributes = () => {
    const attributes = [];
    const targetFields = [
      ["stanje oglasa", "stanje", "condition"],
      ["godište", "godiste", "year"],
      ["gorivo", "fuel"],
      ["mjenjač", "mjenjac", "transmission"]
    ];

    targetFields.forEach(keys => {
      // Nađi definiciju polja
      const fieldDef = customFields.find(f => {
        const name = (f.translated_name || f.name || "").toLowerCase();
        return keys.some(key => name.includes(key));
      });

      if (fieldDef) {
        // Izvuci vrijednost iz trenutno popunjenih podataka
        const val = currentExtraDetails[fieldDef.id];
        
        if (Array.isArray(val) && val.length > 0) {
          attributes.push(val[0]);
        } else if (val && typeof val === 'string') {
          attributes.push(val);
        }
      }
    });

    return attributes;
  };

  const isOnSale = defaultDetails.is_on_sale;
  const oldPrice = Number(defaultDetails.old_price);
  const currentPrice = Number(defaultDetails.price);
  const showDiscount = isOnSale && oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
  const discountPct = showDiscount
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;
  const previewAttributes = getPreviewAttributes();

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
          <div className="container">
            <div className="flex flex-col gap-8 mt-8">
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  <div className="border rounded-lg p-6 bg-white shadow-sm">
                    <div className="relative">
                      <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
                      <div 
                        className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                        style={{ 
                          width: `${(steps.findIndex(s => s.id === step) / (steps.length - 1)) * 100}%`,
                          zIndex: 1
                        }}
                      />
                      <div className="relative flex justify-between" style={{ zIndex: 2 }}>
                        {steps.map((s, idx) => {
                          const progress = getStepProgress(s.id);
                          const isActive = s.id === step;
                          const isCompleted = progress === 100 && !isActive;
                          
                          return (
                            <div key={s.id} className="flex flex-col items-center gap-2">
                              <div
                                className={`
                                  relative w-10 h-10 rounded-full flex items-center justify-center
                                  transition-all duration-300 z-10 cursor-default
                                  ${isActive ? 'scale-110 shadow-lg bg-white border-4 border-primary text-primary' : ''}
                                  ${isCompleted ? 'bg-primary text-white border-2 border-primary' : ''}
                                  ${!isActive && !isCompleted ? 'bg-white border-2 border-gray-300 text-gray-400' : ''}
                                `}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <span className="text-sm font-bold">
                                    {idx + 1}
                                  </span>
                                )}
                                {isActive && !isCompleted && (
                                  <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                                )}
                              </div>
                              <span className={`
                                text-xs font-medium text-center max-w-[80px] transition-colors duration-300
                                ${isActive ? 'text-primary font-bold' : 'text-gray-500'}
                              `}>
                                {s.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {(step === 1 || (step === 2 && hasTextbox)) && (
                    <div className="flex justify-end">
                      <AdLanguageSelector
                        langId={langId}
                        setLangId={setLangId}
                        languages={languages}
                        setTranslations={setTranslations}
                      />
                    </div>
                  )}

                  {step === 1 && selectedCategoryPath?.length > 0 && (
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
                    {step == 1 && (
                      <EditComponentOne
                        setTranslations={setTranslations}
                        current={currentDetails}
                        langId={langId}
                        defaultLangId={defaultLangId}
                        handleDetailsSubmit={handleDetailsSubmit}
                        is_job_category={is_job_category}
                        isPriceOptional={isPriceOptional}
                      />
                    )}

                    {step == 2 && customFields.length > 0 && (
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

                    {step == 3 && (
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
                        instagramSourceUrl={instagramSourceUrl}
                        onInstagramSourceUrlChange={setInstagramSourceUrl}
                        onUseInstagramAsVideoLink={handleUseInstagramAsVideoLink}
                        videoLink={defaultDetails?.video_link || ""}
                        onVideoLinkChange={handleVideoLinkChange}
                      />
                    )}

                    {step == 4 && (
                      <EditComponentFour
                        handleGoBack={handleGoBack}
                        location={Location}
                        setLocation={setLocation}
                        handleFullSubmission={handleFullSubmission}
                        isAdPlaced={isAdPlaced}
                        setScheduledAt={setScheduledAt}
                      />
                    )}
                  </div>
                </div>

                {/* 📱 DESNA STRANA - LIVE PREVIEW */}
                <div className="lg:col-span-1">
                  <div className="sticky top-4 border rounded-2xl p-4 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <Zap className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-lg">{t("Pregled oglasa")}</h3>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl flex flex-col h-full group overflow-hidden shadow-sm">
                      <div className="relative aspect-square bg-gray-100">
                        {getPreviewImage() ? (
                          <img 
                            src={getPreviewImage()} 
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Upload className="w-12 h-12" />
                          </div>
                        )}

                        <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                          {isFeatured && (
                            <div className="flex items-center justify-center bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-400 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                              <IconRocket size={18} stroke={2} className="text-white" />
                            </div>
                          )}
                          {showDiscount && (
                            <div className="flex items-center justify-center bg-red-600 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm">
                              <IconRosetteDiscount size={18} stroke={2} className="text-white" />
                            </div>
                          )}
                        </div>

                        {(uploadedImages.length > 0 || OtherImages.length > 0) && (
                          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[12px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Images size={12} />
                            <span className="text-xs">
                              {uploadedImages.length + OtherImages.length}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 p-2 flex-grow">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                          {defaultDetails.name || t("Vaš naslov oglasa ovdje")}
                        </h3>

                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin size={12} />
                          <span className="truncate max-w-[150px]">
                            {Location?.city || t("Lokacija")}
                          </span>
                        </div>

                        {/* 🔥 ATRIBUTI ZA PREVIEW (Stanje, Godište, itd.) */}
                        {previewAttributes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {previewAttributes.map((attr, index) => (
                              <span
                                key={index}
                                className="inline-flex px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-[10px] font-medium border border-gray-100"
                              >
                                {attr}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="border-t border-gray-100 mt-1.5" />

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock size={12} />
                            <span className="text-[10px]">{t("Upravo sada")}</span>
                          </div>

                          <div className="flex flex-col items-end">
                            {showDiscount && (
                              <span className="text-[10px] text-gray-400 line-through decoration-red-400">
                                {formatPriceAbbreviated(oldPrice)}
                              </span>
                            )}

                            {!is_job_category ? (
                              <span className={`text-sm font-bold ${showDiscount ? "text-red-600" : "text-gray-900"}`}>
                                {defaultDetails.price_on_request 
                                  ? "Na upit" 
                                  : defaultDetails.price 
                                    ? formatPriceAbbreviated(currentPrice) 
                                    : "0 KM"
                                }
                              </span>
                            ) : (
                              <div className="flex gap-1 text-sm font-bold text-gray-900">
                                {defaultDetails.min_salary && <span>{defaultDetails.min_salary}</span>}
                                {defaultDetails.max_salary && <span>- {defaultDetails.max_salary} KM</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
          <AdSuccessModal
            openSuccessModal={openSuccessModal}
            setOpenSuccessModal={setOpenSuccessModal}
            createdAdSlug={CreatedAdSlug}
            scheduledDate={scheduledAt}
          />
        </>
      )}
    </Layout>
  );
};

export default Checkauth(EditListing);
