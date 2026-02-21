"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ComponentOne from "./ComponentOne";
import {
  addItemApi,
  categoryApi,
  getCustomFieldsApi,
  getParentCategoriesApi,
  socialMediaApi,
} from "@/utils/api";
import ComponentTwo from "./ComponentTwo";
import {
  filterNonDefaultTranslations,
  prepareCustomFieldFiles,
  prepareCustomFieldTranslations,
  t,
  formatPriceAbbreviated,
  isValidURL,
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
import { toast } from "@/utils/toastBs";
import ComponentThree from "./ComponentThree";
import ComponentFour from "./ComponentFour";
import ComponentFive from "./ComponentFive";
import ProductCard from "@/components/Common/ProductCard";
import { useSelector } from "react-redux";
import AdSuccessModal from "./AdSuccessModal";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import { motion, AnimatePresence } from "framer-motion";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { getDefaultLanguageCode, getLanguages } from "@/redux/reducer/settingSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  CategoryData,
  getCatCurrentPage,
  getCatLastPage,
} from "@/redux/reducer/categorySlice";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import {
  CheckCircle2,
  Circle,
  Award,
  TrendingUp,
  Zap,
  Star,
  ArrowLeft,
  X,
  ChevronRight,
  Loader2,
  Sparkles,
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
const WATERMARK_TEXT_DEFAULT = "lmx.ba";

const isFileLike = (v) =>
  typeof File !== "undefined" &&
  (v instanceof File || v instanceof Blob);

// ✅ FIX 1: Ažurirana funkcija da podržava {url: ...} objekte
const safeObjectUrl = (v) => {
  try {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object" && v.url) return v.url; // Dodano za objekte sa backend-a
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

// =======================================================
// Nova funkcija za LOGO watermark (Gornji Desni Ugao)
// =======================================================
const compressAndWatermarkImage = async (
  file,
  {
    maxSize = 2000,
    quality = 0.92,
    watermarkUrl = "/assets/ad_icon.svg", // Tvoj logo
    watermarkOpacity = 0.9,               // Providnost (0.0 - 1.0)
    watermarkScale = 0.15,                // Veličina: 15% širine slike
    watermarkPaddingPct = 0.03,           // Odmak: 3% od ivice
    minBytesToProcess = 0,
  } = {}
) => {
  if (!isFileLike(file)) return file;
  if (file.size && file.size < minBytesToProcess) return file;

  const src = safeObjectUrl(file);
  if (!src) return file;

  let img;
  try {
    img = await loadImageElement(src);
  } finally {
    try { URL.revokeObjectURL(src); } catch {}
  }

  // 1. Izračunaj dimenzije za resize glavne slike
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

  // 2. Nacrtaj glavnu sliku
  ctx.drawImage(img, 0, 0, outW, outH);

  // 3. Nacrtaj Watermark (Logo)
  if (watermarkUrl) {
    try {
      const wmImg = await loadImageElement(watermarkUrl);
      
      ctx.save();
      ctx.globalAlpha = watermarkOpacity;

      // Računanje veličine watermarka (npr. 15% širine slike)
      const wmWidth = outW * watermarkScale;
      // Očuvaj aspect ratio loga
      const wmAspect = (wmImg.naturalWidth || wmImg.width) / (wmImg.naturalHeight || wmImg.height);
      const wmHeight = wmWidth / wmAspect;

      // Računanje pozicije: GORNJI DESNI ĆOŠAK
      const padding = outW * watermarkPaddingPct;
      const x = outW - wmWidth - padding; // Skroz desno minus širina i padding
      const y = padding;                  // Skroz gore plus padding

      // Crtanje
      ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
      ctx.restore();
    } catch (e) {
      console.warn("Greška pri učitavanju watermarka:", e);
    }
  }

  // 4. Kompresija u JPEG
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

const PUBLISH_STAGES = [
  {
    title: "Pripremamo oglas",
    subtitle: "Validiramo detalje i medijski sadržaj.",
  },
  {
    title: "Optimizujemo prikaz",
    subtitle: "Podešavamo kvalitet i redoslijed prikaza.",
  },
  {
    title: "Objavljujemo",
    subtitle: "Finalizujemo objavu i aktiviramo oglas.",
  },
];

const CATEGORY_CACHE_TTL = 1000 * 60 * 30; // 30min
const CATEGORY_RESPONSE_CACHE = new Map();

const AdsListing = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const userData = useSelector(userSignUpData);

  const [step, setStep] = useState(1);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isLoadMoreCat, setIsLoadMoreCat] = useState(false);
  const [categoryPath, setCategoryPath] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [scheduledAt, setScheduledAt] = useState(null);
  const [isScheduledAd, setIsScheduledAd] = useState(false);
  const [availableNow, setAvailableNow] = useState(false);
  const [exchangePossible, setExchangePossible] = useState(false);

  const [disabledTab, setDisabledTab] = useState({
    categoryTab: false,
    detailTab: true,
    extraDetailTabl: true,
    images: true,
    location: true,
  });

  const [customFields, setCustomFields] = useState([]);
  const [isCustomFieldsLoading, setIsCustomFieldsLoading] = useState(false);
  const [filePreviews, setFilePreviews] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [otherImages, setOtherImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [addVideoToStory, setAddVideoToStory] = useState(false);
  const [publishToInstagram, setPublishToInstagram] = useState(false);
  const [instagramSourceUrl, setInstagramSourceUrl] = useState("");
  const [instagramConnection, setInstagramConnection] = useState({
    loading: true,
    connected: false,
    account: null,
    syncing: false,
  });

  const uploadedImagesRef = useRef(uploadedImages);
  const otherImagesRef = useRef(otherImages);
  const uploadedVideoRef = useRef(uploadedVideo);
  const stepRailRef = useRef(null);
  const stepNodeRefs = useRef([]);
  const wizardTopRef = useRef(null);
  const hasInitializedStepRef = useRef(false);

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  useEffect(() => {
    otherImagesRef.current = otherImages;
  }, [otherImages]);

  useEffect(() => {
    uploadedVideoRef.current = uploadedVideo;
  }, [uploadedVideo]);

  const [isMediaProcessing, setIsMediaProcessing] = useState(false);
  const [location, setLocation] = useState({});
  const [isAdPlaced, setIsAdPlaced] = useState(false);
  const [showPublishFx, setShowPublishFx] = useState(false);
  const [publishStageIndex, setPublishStageIndex] = useState(0);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [createdAdSlug, setCreatedAdSlug] = useState("");
  const [recentCategories, setRecentCategories] = useState([]);
  const [stepRailFill, setStepRailFill] = useState({ left: 0, width: 0 });

  const languages = useSelector(getLanguages);
  const defaultLanguageCode = useSelector(getDefaultLanguageCode);
  const defaultLangId = languages?.find((lang) => lang.code === defaultLanguageCode)?.id;
  const sharedRootCategories = useSelector(CategoryData);
  const sharedRootCurrentPage = useSelector(getCatCurrentPage);
  const sharedRootLastPage = useSelector(getCatLastPage);

  const [extraDetails, setExtraDetails] = useState({ [defaultLangId]: {} });
  const [langId, setLangId] = useState(defaultLangId);

  const regionCode = resolveLmxPhoneCountry(
    userData?.region_code?.toLowerCase() ||
      process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase() ||
      "ba"
  );
  const countryCode = userData?.country_code?.replace("+", "") || resolveLmxPhoneDialCode(regionCode);
  const mobile = userData?.mobile || "";

  const [translations, setTranslations] = useState({
    [langId]: {
      contact: mobile,
      country_code: countryCode,
      region_code: regionCode,
      inventory_count: "",
      price_per_unit: "",
      show_price_per_m2: false,
      price_per_m2_mode: "auto",
      minimum_order_quantity: "1",
      stock_alert_threshold: "3",
      seller_product_code: "",
      scarcity_enabled: false,
    },
  });

  useEffect(() => {
    if (!showPublishFx) {
      setPublishStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setPublishStageIndex((prev) => (prev + 1) % PUBLISH_STAGES.length);
    }, 1400);

    return () => clearInterval(interval);
  }, [showPublishFx]);

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

  const is_job_category = Number(categoryPath[categoryPath.length - 1]?.is_job_category) === 1;
  const isPriceOptional = Number(categoryPath[categoryPath.length - 1]?.price_optional) === 1;
  const is_real_estate = useMemo(
    () => isRealEstateCategoryPath(categoryPath),
    [categoryPath]
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

  const allCategoryIdsString = categoryPath.map((category) => category.id).join(",");
  const lastItemId = categoryPath[categoryPath.length - 1]?.id;

  // Caching refs
  const categoriesCacheRef = useRef(CATEGORY_RESPONSE_CACHE);
  const categoriesAbortRef = useRef(null);
  const categoriesReqSeqRef = useRef(0);
  const customFieldsLoadedForCategoriesRef = useRef("");

  const ROOT_PER_PAGE = 50; 
  const CHILD_PER_PAGE = 50;

  const fetchCategories = useCallback(
    async ({ categoryId = null, page = 1, append = false } = {}) => {
      const langKey = CurrentLanguage?.id || "lang";
      const catKey = categoryId ? String(categoryId) : "root";
      const key = `${langKey}:${catKey}:${page}`;

      const cached = categoriesCacheRef.current.get(key);
      if (cached && Date.now() - cached.ts < CATEGORY_CACHE_TTL) {
        if (!append) setCategories(cached.data);
        else setCategories((prev) => [...prev, ...cached.data]);
        setCurrentPage(cached.current_page);
        setLastPage(cached.last_page);
        return;
      }

      if (categoriesAbortRef.current) {
        categoriesAbortRef.current.abort();
      }
      const controller = new AbortController();
      categoriesAbortRef.current = controller;

      categoriesReqSeqRef.current += 1;
      const reqSeq = categoriesReqSeqRef.current;

      if (!append) setCategoriesLoading(true);
      else setIsLoadMoreCat(true);

      try {
        const res = await categoryApi.getCategory({
          category_id: categoryId || undefined,
          page,
          per_page: categoryId ? CHILD_PER_PAGE : ROOT_PER_PAGE,
          language_id: CurrentLanguage?.id,
          signal: controller.signal,
        });

        if (reqSeq !== categoriesReqSeqRef.current) return;

        const payload = res?.data?.data;
        const list = payload?.data || [];
        const cp = payload?.current_page || page;
        const lp = payload?.last_page || 1;

        categoriesCacheRef.current.set(key, {
          ts: Date.now(),
          data: list,
          current_page: cp,
          last_page: lp,
        });
        if (categoriesCacheRef.current.size > 120) {
          const oldestKey = categoriesCacheRef.current.keys().next().value;
          if (oldestKey) categoriesCacheRef.current.delete(oldestKey);
        }

        if (!append) setCategories(list);
        else setCategories((prev) => [...prev, ...list]);

        setCurrentPage(cp);
        setLastPage(lp);
      } catch (error) {
        const name = error?.name;
        if (name !== "CanceledError" && name !== "AbortError") {
          console.log("category fetch error", error);
        }
      } finally {
        if (!append) setCategoriesLoading(false);
        else setIsLoadMoreCat(false);
      }
    },
    [CurrentLanguage?.id]
  );

  const handleFetchCategories = useCallback(
    async (id) => {
      await fetchCategories({ categoryId: id || lastItemId || null, page: 1, append: false });
    },
    [fetchCategories, lastItemId]
  );

  const fetchMoreCategory = useCallback(async () => {
    if (categoriesLoading || isLoadMoreCat) return;
    if (currentPage >= lastPage) return;

    await fetchCategories({
      categoryId: lastItemId || null,
      page: currentPage + 1,
      append: true,
    });
  }, [categoriesLoading, isLoadMoreCat, currentPage, lastPage, lastItemId, fetchCategories]);

  // Completeness Score
  const completenessScore = useMemo(() => {
    let score = 0;
    if (categoryPath.length > 0) score += 20;
    if (defaultDetails.name && defaultDetails.description && defaultDetails.contact) {
      score += 20;
    }
    if (customFields.length === 0) {
      score += 20;
    } else {
      const filledFields =
        Object.keys(currentExtraDetails).filter(
          (key) => currentExtraDetails[key] && currentExtraDetails[key] !== ""
        ).length || 0;
      score += (filledFields / customFields.length) * 20;
    }
    if (uploadedImages.length > 0) {
      score += 10;
      if (otherImages.length >= 3) score += 10;
      else score += (otherImages.length / 3) * 10;
    }
    if (location?.country && location?.state && location?.city && location?.address) {
      score += 20;
    }
    return Math.round(score);
  }, [categoryPath, defaultDetails, customFields, currentExtraDetails, uploadedImages, otherImages, location]);

  useEffect(() => {
    const stored = localStorage.getItem("recentCategories");
    if (stored) setRecentCategories(JSON.parse(stored));
  }, []);

  const saveRecentCategory = (category) => {
    setRecentCategories((prev) => {
      const filtered = prev.filter((c) => c.id !== category.id);
      const updated = [category, ...filtered].slice(0, 5);
      localStorage.setItem("recentCategories", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!Array.isArray(sharedRootCategories) || sharedRootCategories.length === 0) return;
    const langKey = CurrentLanguage?.id || "lang";
    const cacheKey = `${langKey}:root:1`;

    categoriesCacheRef.current.set(cacheKey, {
      ts: Date.now(),
      data: sharedRootCategories,
      current_page: sharedRootCurrentPage || 1,
      last_page: sharedRootLastPage || 1,
    });
    if (categoriesCacheRef.current.size > 120) {
      const oldestKey = categoriesCacheRef.current.keys().next().value;
      if (oldestKey) categoriesCacheRef.current.delete(oldestKey);
    }

    if (step === 1 && !lastItemId && categories.length === 0) {
      setCategories(sharedRootCategories);
      setCurrentPage(sharedRootCurrentPage || 1);
      setLastPage(sharedRootLastPage || 1);
      setCategoriesLoading(false);
    }
  }, [
    CurrentLanguage?.id,
    sharedRootCategories,
    sharedRootCurrentPage,
    sharedRootLastPage,
    step,
    lastItemId,
    categories.length,
  ]);

  useEffect(() => {
    if (step === 1) {
      handleFetchCategories();
    }
  }, [step, lastItemId, CurrentLanguage?.id, handleFetchCategories]);
  
  const getCustomFieldsData = useCallback(async (categoryIds) => {
    if (!categoryIds) {
      setCustomFields([]);
      setIsCustomFieldsLoading(false);
      return;
    }

    setIsCustomFieldsLoading(true);
    try {
      const res = await getCustomFieldsApi.getCustomFields({
        category_ids: categoryIds,
      });
      const normalizedFields = Array.isArray(res?.data?.data) ? res.data.data : [];
      setCustomFields(normalizedFields);

      const initializedDetails = {};
      const languagePool =
        Array.isArray(languages) && languages.length > 0
          ? languages.filter((lang) => lang?.id)
          : [{ id: defaultLangId || CurrentLanguage?.id }].filter((lang) => lang?.id);

      languagePool.forEach((lang) => {
        const langFields = {};
        normalizedFields.forEach((item) => {
          if (lang.id !== defaultLangId && item.type !== "textbox") return;
          let initialValue = "";
          switch (item.type) {
            case "checkbox":
            case "radio":
              initialValue = [];
              break;
            case "fileinput":
              initialValue = null;
              break;
            default:
              initialValue = "";
              break;
          }
          langFields[item.id] = initialValue;
        });
        initializedDetails[lang.id] = langFields;
      });

      if (defaultLangId && !initializedDetails[defaultLangId]) {
        initializedDetails[defaultLangId] = {};
      }

      setExtraDetails(initializedDetails);
    } catch (error) {
      console.log(error);
      setCustomFields([]);
      if (defaultLangId) {
        setExtraDetails({ [defaultLangId]: {} });
      }
    } finally {
      setIsCustomFieldsLoading(false);
    }
  }, [CurrentLanguage?.id, defaultLangId, languages]);

  useEffect(() => {
    if (!allCategoryIdsString) {
      customFieldsLoadedForCategoriesRef.current = "";
      setCustomFields([]);
      setIsCustomFieldsLoading(false);
      return;
    }

    if (customFieldsLoadedForCategoriesRef.current === allCategoryIdsString) {
      return;
    }

    customFieldsLoadedForCategoriesRef.current = allCategoryIdsString;
    getCustomFieldsData(allCategoryIdsString);
  }, [allCategoryIdsString, getCustomFieldsData]);

  useEffect(() => {
    if (categoryPath.length > 0) {
      const lastCategoryId = categoryPath[categoryPath.length - 1]?.id;
      if (lastCategoryId) {
        getParentCategoriesApi
          .getPaymentCategories({ child_category_id: lastCategoryId })
          .then((res) => {
            const updatedPath = res?.data?.data;
            if (updatedPath?.length > 0) setCategoryPath(updatedPath);
          })
          .catch((err) => console.log("Error updating category path:", err));
      }
    }
  }, [CurrentLanguage?.id]);

  const handleCategoryTabClick = async (category) => {
    const clickedCategoryId = Number(category?.id);
    let nextPath = [...categoryPath, category];

    if (Number.isFinite(clickedCategoryId) && clickedCategoryId > 0) {
      try {
        const res = await getParentCategoriesApi.getPaymentCategories({
          child_category_id: clickedCategoryId,
        });
        const resolvedPath = Array.isArray(res?.data?.data)
          ? res.data.data.filter(Boolean)
          : [];
        if (resolvedPath.length > 0) {
          nextPath = resolvedPath;
        }
      } catch (error) {
        console.log("Error resolving category path:", error);
      }
    }

    setCategoryPath(nextPath);
    saveRecentCategory(nextPath[nextPath.length - 1] || category);

    const activeCategory = nextPath[nextPath.length - 1] || category;
    const hasChildren = Number(activeCategory?.subcategories_count ?? category?.subcategories_count ?? 0) > 0;

    if (!hasChildren) {
      setIsCustomFieldsLoading(true);
      setCustomFields([]);
      if (defaultLangId) {
        setExtraDetails({ [defaultLangId]: {} });
      } else {
        setExtraDetails({});
      }
      setStep(2);
      setDisabledTab({
        categoryTab: true,
        detailTab: false,
        extraDetailTabl: false,
        images: false,
        location: false,
      });
    }
  };

  const handleCategoryBack = () => {
    if (categoryPath.length > 0) {
      const newPath = categoryPath.slice(0, -1);
      setCategoryPath(newPath);
      if (newPath.length === 0) {
        setCategories([]); 
        handleSelectedTabClick(null);
      } else {
        const prevId = newPath[newPath.length - 1].id;
        handleSelectedTabClick(prevId);
      }
    }
  };

  const handleCategoryReset = () => {
    setCategoryPath([]);
    setCategories([]);
    handleSelectedTabClick(null);
  };

  const handleSelectedTabClick = (id) => {
    setCustomFields([]);
    setIsCustomFieldsLoading(false);
    setLangId(defaultLangId);
    setTranslations({
      [defaultLangId]: {
        contact: mobile,
        country_code: countryCode,
        region_code: regionCode,
        inventory_count: "",
        price_per_unit: "",
        show_price_per_m2: false,
        price_per_m2_mode: "auto",
        minimum_order_quantity: "1",
        stock_alert_threshold: "3",
        seller_product_code: "",
        scarcity_enabled: false,
      },
    });
    setExtraDetails({ [defaultLangId]: {} });

    if (step !== 1) {
      setStep(1);
      setDisabledTab({
        categoryTab: false,
        detailTab: true,
        extraDetailTabl: true,
        images: true,
        location: true,
      });
    }

    if (id === null) {
        setCategories([]);
        setCategoryPath([]);
        return;
    }

    const index = categoryPath.findIndex((item) => item.id === id);
    if (index !== -1) {
      const newPath = categoryPath.slice(0, index + 1);
      setCategoryPath(newPath);
    }
  };

  const handleDetailsSubmit = () => {
    if (isCustomFieldsLoading) {
      toast.info("Pripremamo dodatna polja. Sačekajte trenutak.");
      return;
    }
    if (customFields?.length === 0) setStep(4);
    else setStep(3);
  };

  const isEmpty = (x) => !x || !x.toString().trim();
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

  const handleFullSubmission = (scheduledDateTime = null) => {
    const { name, description, contact, country_code } = defaultDetails;
    const catId = categoryPath.at(-1)?.id;
    const resolvedScarcityEnabled = parseBooleanSetting(
      getSharedDetailValue("scarcity_enabled", false),
      false
    );
    const resolvedInventoryCount = getSharedDetailValue("inventory_count", 0);
    const resolvedStockAlertThreshold = getSharedDetailValue("stock_alert_threshold", 3);
    const scarcityEnabled = !is_real_estate && Boolean(resolvedScarcityEnabled);
    const inventoryCount = Number(resolvedInventoryCount || 0);
    const lowThreshold = Math.max(1, Number(resolvedStockAlertThreshold || 3));

    if (!catId) {
      toast.error("Odaberi kategoriju");
      return setStep(1);
    }

    if (scheduledDateTime) setScheduledAt(scheduledDateTime);

    if (isEmpty(name) || isEmpty(description) || isEmpty(contact)) {
      toast.error("Popuni obavezna polja.");
      return setStep(2);
    }

    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      toast.error("Neispravan broj telefona");
      return setStep(2);
    }

    if (!isEmpty(defaultDetails?.video_link) && !isValidURL(defaultDetails?.video_link)) {
      toast.error("Unesi ispravan URL.");
      return setStep(4);
    }

    if (!isEmpty(instagramSourceUrl) && !isValidURL(instagramSourceUrl)) {
      toast.error("Unesite ispravan Instagram link.");
      return setStep(4);
    }

    if (SOCIAL_POSTING_TEMP_UNAVAILABLE && publishToInstagram) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      setPublishToInstagram(false);
      return setStep(4);
    }

    if (publishToInstagram && !instagramConnection.connected) {
      toast.error("Instagram nalog nije povezan. Povežite Instagram pa pokušajte ponovo.");
      return setStep(4);
    }

    if (!location?.country || !location?.state || !location?.city || !location?.address) {
      toast.error("Odaberi lokaciju");
      return;
    }

    const realEstateLocationSource = String(location?.location_source || "").toLowerCase();
    const hasPreciseRealEstatePin =
      Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.long));
    const usesRealEstateProfileLocation =
      is_real_estate &&
      (realEstateLocationSource === "profile" ||
        (!hasPreciseRealEstatePin && realEstateLocationSource !== "map"));

    if (is_real_estate && !usesRealEstateProfileLocation && !hasPreciseRealEstatePin) {
      toast.error("Za nekretninu označite tačnu lokaciju na mapi.");
      return setStep(5);
    }

    if (is_real_estate && realEstatePriceState.enabled && !realEstatePriceState.hasArea) {
      toast.error("Unesite površinu nekretnine (m²) prije prikaza cijene po m².");
      return setStep(customFields?.length ? 3 : 2);
    }

    if (
      is_real_estate &&
      realEstatePriceState.enabled &&
      realEstatePriceState.mode === "auto" &&
      (defaultDetails?.price_on_request || !Number(defaultDetails?.price))
    ) {
      toast.error("Za automatsku cijenu po m² prvo unesite ukupnu cijenu oglasa.");
      return setStep(2);
    }

    if (
      is_real_estate &&
      realEstatePriceState.enabled &&
      realEstatePriceState.mode === "manual" &&
      !realEstatePriceState.manualValue
    ) {
      toast.error("Unesite ručno cijenu po m² veću od 0.");
      return setStep(2);
    }

    if (scarcityEnabled && (!Number.isFinite(inventoryCount) || inventoryCount <= 0)) {
      toast.error("Za opciju 'Do isteka zaliha' unesite količinu na zalihi veću od 0.");
      return setStep(2);
    }

    if (scarcityEnabled && inventoryCount > lowThreshold) {
      toast.info("Oznaka 'Do isteka zaliha' će se automatski aktivirati kada zaliha padne na zadani prag.");
    }

    postAd(scheduledDateTime);
  };

  const postAd = async (scheduledDateTime = null) => {
    const catId = categoryPath.at(-1)?.id;
    const customFieldTranslations = prepareCustomFieldTranslations(extraDetails);
    const customFieldFiles = prepareCustomFieldFiles(extraDetails, primaryLangId);
    const nonDefaultTranslations = filterNonDefaultTranslations(translations, primaryLangId);
    const trimmedVideoLink = (defaultDetails?.video_link || "").trim();
    const mainTempId = extractTempMediaId(uploadedImages?.[0]);
    const galleryTempIds = (otherImages || []).map(extractTempMediaId).filter(Boolean);
    const tempVideoId = extractTempMediaId(uploadedVideo);
    const mainImageFallback =
      uploadedImages?.[0] instanceof File || uploadedImages?.[0] instanceof Blob
        ? uploadedImages?.[0]
        : null;
    const galleryFallbackFiles = (otherImages || []).filter(
      (entry) => entry instanceof File || entry instanceof Blob
    );

    const allData = {
      name: defaultDetails.name,
      slug: (defaultDetails.slug || "").trim(),
      description: defaultDetails?.description,
      category_id: catId,
      all_category_ids: allCategoryIdsString,
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
      video_link: trimmedVideoLink,
      ...(mainTempId ? { temp_main_image_id: mainTempId } : {}),
      ...(galleryTempIds.length ? { temp_gallery_image_ids: galleryTempIds } : {}),
      ...(tempVideoId && !trimmedVideoLink ? { temp_video_id: tempVideoId } : {}),
      ...(mainImageFallback ? { image: mainImageFallback } : {}),
      ...(galleryFallbackFiles.length ? { gallery_images: galleryFallbackFiles } : {}),
      add_video_to_story: Boolean(addVideoToStory),
      publish_to_instagram: SOCIAL_POSTING_TEMP_UNAVAILABLE
        ? false
        : Boolean(publishToInstagram),
      instagram_source_url: (instagramSourceUrl || "").trim(),
      address: location?.address,
      formatted_address: location?.formattedAddress || location?.address || "",
      address_translated: location?.address_translated || location?.address || "",
      latitude: location?.lat,
      longitude: location?.long,
      location_source: is_real_estate
        ? String(location?.location_source || "").toLowerCase() === "profile"
          ? "profile"
          : "map"
        : String(location?.location_source || "manual").toLowerCase(),
      custom_field_files: customFieldFiles,
      country: location?.country,
      state: location?.state,
      city: location?.city,
      ...(
        is_real_estate
          ? { area_id: location?.area_id ? Number(location?.area_id) : "" }
          : location?.area_id
          ? { area_id: Number(location?.area_id) }
          : {}
      ),
      ...(Object.keys(nonDefaultTranslations).length > 0 && { translations: nonDefaultTranslations }),
      ...(Object.keys(customFieldTranslations).length > 0 && {
        custom_field_translations: customFieldTranslations,
      }),
      region_code: defaultDetails?.region_code?.toUpperCase() || "",
      ...(scheduledDateTime ? { scheduled_at: scheduledDateTime } : {}),
      
      // Dodano za akciju
      is_on_sale: defaultDetails.is_on_sale || false,
      old_price: defaultDetails.is_on_sale ? defaultDetails.old_price : null,
      price_on_request: Boolean(defaultDetails.price_on_request),
    };
    
    // Ako je cijena na upit
    if (defaultDetails.price_on_request) {
        allData.price = 0;
    }

    try {
      setIsAdPlaced(true);
      setShowPublishFx(true);
      setPublishStageIndex(0);
      const res = await addItemApi.addItem(allData);

      if (res?.data?.error === false) {
        const createdItemId = res?.data?.data?.[0]?.id;
        if (!SOCIAL_POSTING_TEMP_UNAVAILABLE && publishToInstagram && createdItemId) {
          try {
            await socialMediaApi.schedulePost({
              item_id: createdItemId,
              platforms: ["instagram"],
              caption: `${defaultDetails?.name || "Lmx oglas"}\n\n${(
                defaultDetails?.description || ""
              ).slice(0, 260)}`.trim(),
            });
            toast.success("Oglas je dodat i u red za Instagram objavu.");
          } catch (scheduleError) {
            const apiMessage = scheduleError?.response?.data?.message;
            toast.warning(
              apiMessage || "Oglas je objavljen, ali Instagram objava nije zakazana."
            );
          }
        }

        setPublishStageIndex(PUBLISH_STAGES.length - 1);
        await new Promise((resolve) => setTimeout(resolve, 900));
        setIsScheduledAd(!!scheduledDateTime);
        setScheduledAt(scheduledDateTime);
        setUploadedImages([]);
        setOtherImages([]);
        setUploadedVideo(null);
        setAddVideoToStory(false);
        setPublishToInstagram(false);
        setInstagramSourceUrl("");
        setOpenSuccessModal(true);
        setCreatedAdSlug(res?.data?.data[0]?.slug);
      } else {
        toast.error(res?.data?.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdPlaced(false);
      setShowPublishFx(false);
      setPublishStageIndex(0);
    }
  };

  const stepIdSequence = useMemo(() => {
    const ids = [1, 2];
    if (customFields?.length > 0) ids.push(3);
    ids.push(4, 5);
    return ids;
  }, [customFields?.length]);

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
  }, [step, resolveNearestStep]);

  const handleGoBack = useCallback(() => {
    const normalizedStep = resolveNearestStep(step);
    const currentIndex = stepIdSequence.indexOf(normalizedStep);
    if (currentIndex <= 0) {
      setStep(stepIdSequence[0] || 1);
      return;
    }
    setStep(stepIdSequence[currentIndex - 1]);
  }, [resolveNearestStep, step, stepIdSequence]);

  const handleTabClick = useCallback(
    (tab) => {
      if (!stepIdSequence.includes(tab)) return;
      const tabDisabled = {
        1: disabledTab.categoryTab,
        2: disabledTab.detailTab,
        3: disabledTab.extraDetailTabl,
        4: disabledTab.images,
        5: disabledTab.location,
      }[tab];
      if (tabDisabled) return;
      setStep(tab);
    },
    [disabledTab.categoryTab, disabledTab.detailTab, disabledTab.extraDetailTabl, disabledTab.images, disabledTab.location, stepIdSequence]
  );

  const handleDeatilsBack = () => {
    setCustomFields([]);
    setIsCustomFieldsLoading(false);
    setLangId(defaultLangId);
    setTranslations({
      [defaultLangId]: {
        contact: mobile,
        country_code: countryCode,
        region_code: regionCode,
        inventory_count: "",
        price_per_unit: "",
        show_price_per_m2: false,
        price_per_m2_mode: "auto",
        minimum_order_quantity: "1",
        stock_alert_threshold: "3",
        seller_product_code: "",
        scarcity_enabled: false,
      },
    });
    setExtraDetails({ [defaultLangId]: {} });

    if (step !== 1) {
      setStep(1);
      setDisabledTab({
        categoryTab: false,
        detailTab: true,
        extraDetailTabl: true,
        images: true,
        location: true,
      });
    }
    setCategoryPath((prev) => prev.slice(0, -1));
  };

  // Stepper
  const steps = useMemo(
    () => [
      {
        id: 1,
        label: "Odabrana kategorija",
        mobileLabel: "Kategorija",
        icon: Circle,
        disabled: disabledTab.categoryTab,
      },
      {
        id: 2,
        label: "Detalji",
        mobileLabel: "Detalji",
        icon: Circle,
        disabled: disabledTab.detailTab,
      },
      ...(customFields?.length > 0
        ? [
            {
              id: 3,
              label: "Dodatni detalji",
              mobileLabel: "Dodatno",
              icon: Circle,
              disabled: disabledTab.extraDetailTabl,
            },
          ]
        : []),
      { id: 4, label: "Mediji", mobileLabel: "Mediji", icon: Circle, disabled: disabledTab.images },
      { id: 5, label: "Lokacija", mobileLabel: "Lokacija", icon: Circle, disabled: disabledTab.location },
    ],
    [
      customFields?.length,
      disabledTab.categoryTab,
      disabledTab.detailTab,
      disabledTab.extraDetailTabl,
      disabledTab.images,
      disabledTab.location,
    ]
  );

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

    // Defanzivno resetujemo horizontalni pomak nakon prelaza koraka.
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

  const hasBaseLocation = Boolean(
    location?.country && location?.state && location?.city && location?.address
  );
  const hasPreciseLocation = Boolean(
    Number.isFinite(Number(location?.lat)) && Number.isFinite(Number(location?.long))
  );
  const usesProfileLocation =
    is_real_estate &&
    (String(location?.location_source || "").toLowerCase() === "profile" ||
      (!hasPreciseLocation && String(location?.location_source || "").toLowerCase() !== "map"));
  const hasValidLocation = hasBaseLocation && (!is_real_estate || usesProfileLocation || hasPreciseLocation);

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
            return categoryPath.length > 0 ? 100 : 0;
          case 2:
            return defaultDetails.name && defaultDetails.description
              ? 100
              : defaultDetails.name || defaultDetails.description
              ? 55
              : 0;
          case 3:
            return Object.keys(currentExtraDetails).length > 0 ? 100 : 0;
          case 4:
            return uploadedImages.length > 0 ? 100 : 0;
          case 5:
            if (hasValidLocation) return 100;
            if (is_real_estate && hasBaseLocation) return 70;
            return location?.address ? 60 : 0;
          default:
            return 0;
        }
      }
      return 0;
    },
    [
      activeStepIndex,
      categoryPath.length,
      currentExtraDetails,
      defaultDetails.description,
      defaultDetails.name,
      hasValidLocation,
      hasBaseLocation,
      is_real_estate,
      location?.address,
      steps,
      uploadedImages.length,
    ]
  );

  // Preview Logic
  const isOnSale = defaultDetails.is_on_sale;
  const oldPrice = Number(defaultDetails.old_price);
  const currentPrice = Number(
    is_real_estate && effectiveRealEstateTotalPrice
      ? effectiveRealEstateTotalPrice
      : defaultDetails.price
  );
  const hasCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0;
  const showDiscount = isOnSale && oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
  const publishProgressPct = ((publishStageIndex + 1) / PUBLISH_STAGES.length) * 100;
  const currentPublishStage = PUBLISH_STAGES[publishStageIndex] || PUBLISH_STAGES[0];
  const successCategoryLabel =
    categoryPath?.[categoryPath.length - 1]?.translated_name ||
    categoryPath?.[categoryPath.length - 1]?.name ||
    "";
  const successLocationLabel =
    [location?.city, location?.state, location?.country].filter(Boolean).join(", ") ||
    location?.address ||
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
  // MEDIA: kompresija + watermark odmah na selekciju
  // (ComponentFour će i dalje samo zvati setUploadedImages / setOtherImages / setUploadedVideo)
  // =======================================================
  const setUploadedImagesProcessed = useCallback(
    async (filesOrUpdater) => {
      const resolved =
        typeof filesOrUpdater === "function"
          ? filesOrUpdater(uploadedImagesRef.current)
          : filesOrUpdater;
      const arr = normalizeFilesArray(resolved);
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
    async (filesOrUpdater) => {
      const resolved =
        typeof filesOrUpdater === "function"
          ? filesOrUpdater(otherImagesRef.current)
          : filesOrUpdater;
      const arr = normalizeFilesArray(resolved);
      if (!arr.length) return setOtherImages([]);
      try {
        setIsMediaProcessing(true);
        const processed = await processImagesArray(arr);
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

  const setUploadedVideoValidated = useCallback(
    async (fileOrUpdater) => {
      const resolved =
        typeof fileOrUpdater === "function"
          ? fileOrUpdater(uploadedVideoRef.current)
          : fileOrUpdater;
      const [file] = normalizeFilesArray(resolved);
      if (!file) return setUploadedVideo(null);

      // Video kompresija se radi najbolje na serveru (ffmpeg). Ovdje samo validacija.
      if (isFileLike(file)) {
        const maxMb = 40; // promijeni po želji
        if (bytesToMB(file.size) > maxMb) {
          toast.error(`Video je prevelik (${bytesToMB(file.size)}MB). Maks: ${maxMb}MB.`);
        }
      }
      setUploadedVideo(file);
    },
    [setUploadedVideo]
  );

  const getPreviewImage = useCallback(() => {
    const first = uploadedImages?.[0];
    return safeObjectUrl(first);
  }, [uploadedImages]);

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
    otherImages?.forEach(pushUrl);

    return urls.map((image) => ({ image }));
  }, [uploadedImages, otherImages]);

  const previewCardItem = useMemo(() => {
    const previewName = defaultDetails?.name || "Vaš naslov oglasa ovdje";
    const primaryImage = getPreviewImage();
    const previewPrice = defaultDetails?.price_on_request
      ? 0
      : hasCurrentPrice
      ? Number(currentPrice)
      : Number(defaultDetails?.price || 0);

    return {
      id: -1,
      slug: "preview-oglas",
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
      created_at: new Date().toISOString(),
      translated_custom_fields: previewCustomFields,
      available_now: Boolean(availableNow),
      exchange_possible: Boolean(exchangePossible),
      is_exchange: Boolean(exchangePossible),
      allow_exchange: Boolean(exchangePossible),
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
    availableNow,
    currentPrice,
    defaultDetails?.max_salary,
    defaultDetails?.min_salary,
    defaultDetails?.name,
    defaultDetails?.price,
    defaultDetails?.price_on_request,
    exchangePossible,
    getPreviewImage,
    hasCurrentPrice,
    is_job_category,
    is_real_estate,
    oldPrice,
    previewCustomFields,
    previewGalleryImages,
    realEstateAreaM2,
    realEstatePriceState?.enabled,
    realEstatePriceState?.manualValue,
    realEstatePriceState?.mode,
    realEstatePriceState?.resolvedValue,
    showDiscount,
  ]);

  return (
    <Layout>
      <BreadCrumb title2={"Lista oglasa"} />
      <div className="container relative overflow-x-hidden">
        <div className="relative mt-8 flex min-w-0 flex-col gap-8 overflow-x-hidden pb-10">
          <div className="pointer-events-none absolute -top-14 left-0 h-52 w-52 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
          <div className="pointer-events-none absolute -right-10 top-8 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-400/30" />

          <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 md:p-8">
            <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl dark:bg-primary/30" />
            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70 dark:text-primary/80">
                  LMX Studio
                </p>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">
                  {"Lista oglasa"}
                </h1>
                <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  Kreirajte oglas uz prikaz uživo, pametan medijski tok i jasne korake do objave.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2 dark:border-primary/35 dark:from-primary/20 dark:to-primary/10">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">{completenessScore}%</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">{"dovršen"}</span>
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="relative flex min-w-0 flex-col gap-6 lg:col-span-2">
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
                      className="relative z-[2] grid gap-2 sm:gap-4"
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

              {(renderedStep === 1 || renderedStep === 2) && categoryPath?.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{"Odabrana kategorija"}</p>
                    <button 
                      onClick={handleCategoryReset}
                      className="flex items-center gap-1 text-xs font-medium text-red-500 transition-colors hover:text-red-600"
                    >
                      <X size={14} />
                      Očisti sve
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCategoryBack}
                      className="mr-1 rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      title="Vrati se korak nazad"
                    >
                      <ArrowLeft size={16} />
                    </button>

                    {categoryPath?.map((item, index) => (
                      <div key={item.id} className="flex items-center">
                        <button
                          className={`
                            text-sm px-3 py-1.5 rounded-lg transition-all duration-200
                            ${index === categoryPath.length - 1 
                              ? "border border-primary/25 bg-primary/10 font-semibold text-primary dark:border-primary/35 dark:bg-primary/20"
                              : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            }
                          `}
                          onClick={() => handleSelectedTabClick(item?.id)}
                        >
                          {item.translated_name || item.name}
                        </button>
                        
                        {index !== categoryPath.length - 1 && (
                          <ChevronRight size={16} className="mx-1 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900/80">
                {renderedStep === 1 && (
                  <ComponentOne
                    categories={categories}
                    setCategoryPath={setCategoryPath}
                    fetchMoreCategory={fetchMoreCategory}
                    lastPage={lastPage}
                    currentPage={currentPage}
                    isLoadMoreCat={isLoadMoreCat}
                    handleCategoryTabClick={handleCategoryTabClick}
                    categoriesLoading={categoriesLoading}
                    recentCategories={recentCategories}
                  />
                )}

                {renderedStep === 2 && (
                  <ComponentTwo
                    setTranslations={setTranslations}
                    current={currentDetails}
                    langId={langId}
                    defaultLangId={defaultLangId}
                    handleDetailsSubmit={handleDetailsSubmit}
                    handleDeatilsBack={handleDeatilsBack}
                    is_job_category={is_job_category}
                    is_real_estate={is_real_estate}
                    real_estate_area_m2={realEstateAreaM2}
                    isPriceOptional={isPriceOptional}
                    isNextLoading={isCustomFieldsLoading}
                  />
                )}

                {renderedStep === 3 && (
                  <ComponentThree
                    customFields={customFields}
                    setExtraDetails={setExtraDetails}
                    filePreviews={filePreviews}
                    setFilePreviews={setFilePreviews}
                    setStep={setStep}
                    handleGoBack={handleGoBack}
                    currentExtraDetails={currentExtraDetails}
                    langId={langId}
                    defaultLangId={defaultLangId}
                    isAvailable={availableNow}
                    setIsAvailable={setAvailableNow}
                    isExchange={exchangePossible}
                    setIsExchange={setExchangePossible}
                  />
                )}

                {renderedStep === 4 && (
                  <ComponentFour
                    uploadedImages={uploadedImages}
                    setUploadedImages={setUploadedImagesProcessed}
                    otherImages={otherImages}
                    setOtherImages={setOtherImagesProcessed}
                    uploadedVideo={uploadedVideo}
                    setUploadedVideo={setUploadedVideoValidated}
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
                    isRealEstate={is_real_estate}
                    location={location}
                    setStep={setStep}
                    handleGoBack={handleGoBack}
                  />
                )}

                {renderedStep === 5 && (
                  <ComponentFive
                    location={location}
                    setLocation={setLocation}
                    handleFullSubmission={handleFullSubmission}
                    isAdPlaced={isAdPlaced}
                    handleGoBack={handleGoBack}
                    setScheduledAt={setScheduledAt}
                    isRealEstate={is_real_estate}
                  />
                )}
              </div>
            </div>

            {/* 📱 Right Column - Live Preview */}
            <div className="min-w-0 lg:col-span-1">
              <div className="sticky top-4 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-950/85">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {"Pregled oglasa"}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary dark:border-primary/35 dark:bg-primary/20">
                    Uživo
                  </span>
                </div>

                <div className="pointer-events-none select-none">
                  <ProductCard item={previewCardItem} />
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{"Ocjena kvaliteta oglasa"}</span>
                      <span className="text-primary font-semibold">{completenessScore}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500"
                        style={{ width: `${completenessScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {uploadedImages.length === 0 && (
                      <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-500/40 dark:bg-yellow-500/10">
                        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-300" />
                        <p className="text-xs text-yellow-800 dark:text-yellow-100">
                          {"Dodaj barem jednu sliku!"} (+20% {"vidljivost"})
                        </p>
                      </div>
                    )}
                    {uploadedImages.length > 0 && otherImages.length < 3 && (
                      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/40 dark:bg-blue-500/10">
                        <Star className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                        <p className="text-xs text-blue-800 dark:text-blue-100">
                          {"Dodaj još {count} fotografija".replace("{count}", 3 - otherImages.length)} (+{(3 - otherImages.length) * 5}% {"veća vidljivost!"})
                        </p>
                      </div>
                    )}
                    {defaultDetails.description && defaultDetails.description.length < 100 && (
                      <div className="flex items-start gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/10">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600 dark:text-fuchsia-300" />
                        <p className="text-xs text-fuchsia-800 dark:text-fuchsia-100">{"Detaljan opis"} (+10% {"pouzdanost"})</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showPublishFx && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md"
            >
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-cyan-400/35 blur-3xl" />

              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-[0_24px_90px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-7"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10 blur-2xl" />

                <div className="relative flex flex-col items-center text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2.1, repeat: Infinity, ease: "linear" }}
                    className="relative mb-5 h-24 w-24 rounded-full bg-[conic-gradient(from_180deg,#1d4ed8,#06b6d4,#ec4899,#1d4ed8)] p-[3px]"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/80">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  </motion.div>

                  <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Objava u toku
                  </div>

                  <h3 className="text-xl font-semibold sm:text-2xl">{currentPublishStage.title}</h3>
                  <p className="mt-2 text-sm text-white/80">{currentPublishStage.subtitle}</p>

                  <div className="mt-6 w-full">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-400 to-fuchsia-400"
                        animate={{ width: `${publishProgressPct}%` }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>

                    <div className="mt-4 flex flex-col gap-2 text-left">
                      {PUBLISH_STAGES.map((stage, idx) => {
                        const isDone = idx < publishStageIndex;
                        const isCurrent = idx === publishStageIndex;
                        return (
                          <div
                            key={stage.title}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all ${
                              isCurrent
                                ? "bg-white/20 text-white"
                                : isDone
                                ? "bg-emerald-400/20 text-emerald-100"
                                : "bg-white/5 text-white/70"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0" />
                            ) : (
                              <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-white/70" />
                            )}
                            <span>{stage.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AdSuccessModal
          openSuccessModal={openSuccessModal}
          setOpenSuccessModal={setOpenSuccessModal}
          createdAdSlug={createdAdSlug}
          isScheduled={isScheduledAd}
          scheduledDate={scheduledAt}
          adName={defaultDetails?.name || ""}
          categoryLabel={successCategoryLabel}
          priceLabel={successPriceLabel}
          locationLabel={successLocationLabel}
          publishToInstagram={publishToInstagram}
          completenessScore={completenessScore}
        />
      </div>
    </Layout>
  );
};

export default Checkauth(AdsListing);
