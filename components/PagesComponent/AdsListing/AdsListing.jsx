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
import { toast } from "@/utils/toastBs";
import ComponentThree from "./ComponentThree";
import ComponentFour from "./ComponentFour";
import ComponentFive from "./ComponentFive";
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
  Upload,
  MapPin,
  ArrowLeft,
  X,
  ChevronRight,
  Clock,
  Images,
  Loader2,
  Sparkles,
} from "@/components/Common/UnifiedIconPack";
import { IconRosetteDiscount } from "@/components/Common/UnifiedIconPack";

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

  const countryCode = userData?.country_code?.replace("+", "") || "91";
  const mobile = userData?.mobile || "";
  const regionCode =
    userData?.region_code?.toLowerCase() ||
    process.env.NEXT_PUBLIC_DEFAULT_COUNTRY?.toLowerCase() ||
    "in";

  const [translations, setTranslations] = useState({
    [langId]: {
      contact: mobile,
      country_code: countryCode || "91",
      region_code: regionCode,
      inventory_count: "",
      price_per_unit: "",
      minimum_order_quantity: "1",
      stock_alert_threshold: "3",
      seller_product_code: "",
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

  const defaultDetails = translations[defaultLangId] || {};
  const currentDetails = translations[langId] || {};
  const currentExtraDetails = extraDetails[langId] || {};

  const is_job_category = Number(categoryPath[categoryPath.length - 1]?.is_job_category) === 1;
  const isPriceOptional = Number(categoryPath[categoryPath.length - 1]?.price_optional) === 1;

  const allCategoryIdsString = categoryPath.map((category) => category.id).join(",");
  const lastItemId = categoryPath[categoryPath.length - 1]?.id;

  // Caching refs
  const categoriesCacheRef = useRef(CATEGORY_RESPONSE_CACHE);
  const categoriesAbortRef = useRef(null);
  const categoriesReqSeqRef = useRef(0);

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
  
  const getCustomFieldsData = useCallback(async () => {
    if (!allCategoryIdsString) {
      setCustomFields([]);
      setIsCustomFieldsLoading(false);
      return;
    }

    setIsCustomFieldsLoading(true);
    try {
      const res = await getCustomFieldsApi.getCustomFields({
        category_ids: allCategoryIdsString,
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
  }, [CurrentLanguage?.id, allCategoryIdsString, defaultLangId, languages]);

  useEffect(() => {
    if (step !== 1 && allCategoryIdsString) {
      getCustomFieldsData();
      return;
    }
    if (step === 1) {
      setIsCustomFieldsLoading(false);
    }
  }, [allCategoryIdsString, getCustomFieldsData, step]);

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
    setCategoryPath((prevPath) => [...prevPath, category]);
    saveRecentCategory(category);

    if (!(category?.subcategories_count > 0)) {
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
        minimum_order_quantity: "1",
        stock_alert_threshold: "3",
        seller_product_code: "",
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

  const handleVideoLinkChange = useCallback(
    (value) => {
      setTranslations((prev) => ({
        ...prev,
        [defaultLangId]: {
          ...(prev?.[defaultLangId] || {}),
          video_link: value,
        },
      }));
    },
    [defaultLangId]
  );

  const handleUseInstagramAsVideoLink = useCallback(() => {
    const igLink = (instagramSourceUrl || "").trim();
    if (!igLink) return;
    handleVideoLinkChange(igLink);
  }, [handleVideoLinkChange, instagramSourceUrl]);

  const fetchInstagramConnection = useCallback(async () => {
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
  }, [instagramConnection.connected, publishToInstagram]);

  const handleConnectInstagram = useCallback(async () => {
    try {
      setInstagramConnection((prev) => ({ ...prev, syncing: true }));
      const res = await socialMediaApi.connectAccount({ platform: "instagram" });
      toast.success(res?.data?.message || "Instagram je uspješno povezan.");
      await fetchInstagramConnection();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Povezivanje Instagrama nije uspjelo.");
    } finally {
      setInstagramConnection((prev) => ({ ...prev, syncing: false }));
    }
  }, [fetchInstagramConnection]);

  const handleFullSubmission = (scheduledDateTime = null) => {
    const { name, description, contact, country_code } = defaultDetails;
    const catId = categoryPath.at(-1)?.id;

    if (!catId) {
      toast.error(t("selectCategory"));
      return setStep(1);
    }

    if (scheduledDateTime) setScheduledAt(scheduledDateTime);

    if (isEmpty(name) || isEmpty(description) || isEmpty(contact)) {
      toast.error(t("completeDetails"));
      return setStep(2);
    }

    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      toast.error(t("invalidPhoneNumber"));
      return setStep(2);
    }

    if (!isEmpty(defaultDetails?.video_link) && !isValidURL(defaultDetails?.video_link)) {
      toast.error(t("enterValidUrl"));
      return setStep(4);
    }

    if (!isEmpty(instagramSourceUrl) && !isValidURL(instagramSourceUrl)) {
      toast.error("Unesite ispravan Instagram link.");
      return setStep(4);
    }

    if (publishToInstagram && !instagramConnection.connected) {
      toast.error("Instagram nalog nije povezan. Povežite Instagram pa pokušajte ponovo.");
      return setStep(4);
    }

    if (!location?.country || !location?.state || !location?.city || !location?.address) {
      toast.error(t("pleaseSelectCity"));
      return;
    }

    postAd(scheduledDateTime);
  };

  const postAd = async (scheduledDateTime = null) => {
    const catId = categoryPath.at(-1)?.id;
    const customFieldTranslations = prepareCustomFieldTranslations(extraDetails);
    const customFieldFiles = prepareCustomFieldFiles(extraDetails, defaultLangId);
    const nonDefaultTranslations = filterNonDefaultTranslations(translations, defaultLangId);
    const trimmedVideoLink = (defaultDetails?.video_link || "").trim();

    const allData = {
      name: defaultDetails.name,
      slug: (defaultDetails.slug || "").trim(),
      description: defaultDetails?.description,
      category_id: catId,
      all_category_ids: allCategoryIdsString,
      price: defaultDetails.price,
      contact: defaultDetails.contact,
      available_now: Boolean(availableNow),
      exchange_possible: Boolean(exchangePossible),
      is_exchange: Boolean(exchangePossible),
      allow_exchange: Boolean(exchangePossible),
      inventory_count:
        defaultDetails?.inventory_count !== undefined &&
        defaultDetails?.inventory_count !== null &&
        String(defaultDetails.inventory_count).trim() !== ""
          ? Number(defaultDetails.inventory_count)
          : null,
      price_per_unit:
        defaultDetails?.price_per_unit !== undefined &&
        defaultDetails?.price_per_unit !== null &&
        String(defaultDetails.price_per_unit).trim() !== ""
          ? Number(defaultDetails.price_per_unit)
          : null,
      minimum_order_quantity:
        defaultDetails?.minimum_order_quantity !== undefined &&
        defaultDetails?.minimum_order_quantity !== null &&
        String(defaultDetails.minimum_order_quantity).trim() !== ""
          ? Math.max(1, Number(defaultDetails.minimum_order_quantity))
          : null,
      stock_alert_threshold:
        defaultDetails?.stock_alert_threshold !== undefined &&
        defaultDetails?.stock_alert_threshold !== null &&
        String(defaultDetails.stock_alert_threshold).trim() !== ""
          ? Math.max(1, Number(defaultDetails.stock_alert_threshold))
          : null,
      seller_product_code: String(defaultDetails?.seller_product_code || "").trim(),
      video_link: trimmedVideoLink,
      temp_main_image_id: uploadedImages?.[0]?.id ?? null,
      temp_gallery_image_ids: (otherImages || []).map((x) => x?.id).filter(Boolean),
      ...(uploadedVideo?.id && !trimmedVideoLink ? { temp_video_id: uploadedVideo.id } : {}),
      add_video_to_story: Boolean(addVideoToStory),
      publish_to_instagram: Boolean(publishToInstagram),
      instagram_source_url: (instagramSourceUrl || "").trim(),
      gallery_images: otherImages,
      address: location?.address,
      latitude: location?.lat,
      longitude: location?.long,
      custom_field_files: customFieldFiles,
      country: location?.country,
      state: location?.state,
      city: location?.city,
      ...(location?.area_id ? { area_id: Number(location?.area_id) } : {}),
      ...(Object.keys(nonDefaultTranslations).length > 0 && { translations: nonDefaultTranslations }),
      ...(Object.keys(customFieldTranslations).length > 0 && {
        custom_field_translations: customFieldTranslations,
      }),
      region_code: defaultDetails?.region_code?.toUpperCase() || "",
      ...(scheduledDateTime ? { scheduled_at: scheduledDateTime } : {}),
      
      // Dodano za akciju
      is_on_sale: defaultDetails.is_on_sale || false,
      old_price: defaultDetails.is_on_sale ? defaultDetails.old_price : null,
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
        if (publishToInstagram && createdItemId) {
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
        minimum_order_quantity: "1",
        stock_alert_threshold: "3",
        seller_product_code: "",
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
      { id: 1, label: t("selectedCategory"), icon: Circle, disabled: disabledTab.categoryTab },
      { id: 2, label: t("details"), icon: Circle, disabled: disabledTab.detailTab },
      ...(customFields?.length > 0
        ? [{ id: 3, label: t("extraDetails"), icon: Circle, disabled: disabledTab.extraDetailTabl }]
        : []),
      { id: 4, label: "Mediji", icon: Circle, disabled: disabledTab.images },
      { id: 5, label: t("location"), icon: Circle, disabled: disabledTab.location },
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
  const hasValidLocation = Boolean(
    location?.country && location?.state && location?.city && location?.address
  );

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
            return hasValidLocation ? 100 : location?.address ? 60 : 0;
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
      location?.address,
      steps,
      uploadedImages.length,
    ]
  );

  // Preview Logic
  const isOnSale = defaultDetails.is_on_sale;
  const oldPrice = Number(defaultDetails.old_price);
  const currentPrice = Number(defaultDetails.price);
  const showDiscount = isOnSale && oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
  const previewAttributes = getPreviewAttributes(); // Dohvati atribute za prikaz
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
    ? t("Na upit")
    : showDiscount
    ? `${formatPriceAbbreviated(currentPrice)} (sniženo sa ${formatPriceAbbreviated(oldPrice)})`
    : formatPriceAbbreviated(defaultDetails?.price);

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

  return (
    <Layout>
      <BreadCrumb title2={t("adListing")} />
      <div className="container relative">
        <div className="relative mt-8 flex flex-col gap-8 pb-10">
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
                  {t("adListing")}
                </h1>
                <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  Kreirajte oglas uz prikaz uživo, pametan medijski tok i jasne korake do objave.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2 dark:border-primary/35 dark:from-primary/20 dark:to-primary/10">
                <Award className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-primary">{completenessScore}%</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">{t("dovršen")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="relative flex flex-col gap-6 lg:col-span-2">
              <div className="relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 px-4 py-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/80 sm:px-6 sm:py-6">
                <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
                <div className="pointer-events-none absolute -left-12 bottom-0 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl dark:bg-cyan-300/20" />

                <div className="relative mb-5 flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary dark:border-primary/30 dark:bg-primary/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    Korak {activeStepIndex + 1} od {steps.length}
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                    Preostalo: {Math.max(steps.length - (activeStepIndex + 1), 0)}
                  </p>
                </div>

                <div className="relative">
                  <div
                    ref={stepRailRef}
                    className="pointer-events-none absolute inset-x-0 top-[22px] h-1 rounded-full bg-slate-200/90 dark:bg-slate-700/80"
                  />
                  <motion.div
                    className="pointer-events-none absolute top-[22px] h-1 rounded-full bg-gradient-to-r from-primary via-cyan-400 to-primary shadow-[0_0_20px_-4px_rgba(14,165,233,0.8)]"
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
                          className={`group flex min-w-0 flex-col items-center gap-2 text-center transition-colors ${
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
                              className={`relative z-10 flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold ${
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
                                    <CheckCircle2 className="h-5 w-5" />
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
                            className={`line-clamp-2 max-w-[120px] text-[11px] font-medium leading-tight sm:text-xs ${
                              isActive ? "font-semibold text-primary" : "text-slate-500 dark:text-slate-300"
                            }`}
                          >
                            {s.label}
                          </motion.span>

                          <div className="h-[3px] w-14 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
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

              {(renderedStep === 2 || (renderedStep === 3 && hasTextbox)) && (
                <div className="flex justify-end">
                  {/* AdLanguageSelector was here */}
                </div>
              )}

              {(renderedStep === 1 || renderedStep === 2) && categoryPath?.length > 0 && (
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/75">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{t("selectedCategory")}</p>
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

              <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_16px_50px_-30px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-900/80">
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
                    instagramSourceUrl={instagramSourceUrl}
                    onInstagramSourceUrlChange={setInstagramSourceUrl}
                    onUseInstagramAsVideoLink={handleUseInstagramAsVideoLink}
                    videoLink={defaultDetails?.video_link || ""}
                    onVideoLinkChange={handleVideoLinkChange}
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
                  />
                )}
              </div>
            </div>

            {/* 📱 Right Column - Live Preview */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:from-slate-900/80 dark:to-slate-950/85">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {t("Pregled oglasa")}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary dark:border-primary/35 dark:bg-primary/20">
                    Uživo
                  </span>
                </div>

                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                  {/* Image Area */}
                  <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                    {/* ✅ FIX 2: Provjeravamo da li imamo URL prije renderovanja img taga */}
                    {uploadedImages.length > 0 && getPreviewImage() ? (
                      <img
                        src={getPreviewImage()}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                        <Upload className="h-12 w-12" />
                      </div>
                    )}

                    {/* SALE BADGE */}
                    {showDiscount && (
                      <div className="absolute right-2 top-2 z-10 flex h-[28px] w-[28px] items-center justify-center rounded-md bg-red-600 shadow-sm backdrop-blur-sm">
                        <IconRosetteDiscount size={18} stroke={2} className="text-white" />
                      </div>
                    )}

                    {/* Image Counter with Icon */}
                    {(uploadedImages.length > 0 || otherImages.length > 0) && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/55 px-1.5 py-0.5 text-[12px] font-medium text-white backdrop-blur-md">
                        <Images size={12} />
                        <span className="text-xs">
                          {uploadedImages.length + otherImages.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex flex-grow flex-col gap-1.5 p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                      {defaultDetails.name || t("Vaš naslov oglasa ovdje")}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                      <MapPin size={12} />
                      <span className="truncate max-w-[150px]">{location?.city || t("Lokacija")}</span>
                    </div>

                    {/* 🔥 ATRIBUTI ZA PREVIEW (Stanje, Godište, itd.) */}
                    {previewAttributes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {previewAttributes.map((attr, index) => (
                          <span
                            key={index}
                            className="inline-flex rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {attr}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-1.5 border-t border-slate-100 dark:border-slate-700" />

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <Clock size={12} />
                        <span className="text-[10px]">{t("Upravo sada")}</span>
                      </div>

                      <div className="flex flex-col items-end">
                        {/* Stara cijena (Prekrižena) */}
                        {showDiscount && (
                          <span className="text-[10px] text-slate-400 line-through decoration-red-400 dark:text-slate-500">
                            {formatPriceAbbreviated(oldPrice)}
                          </span>
                        )}

                        {/* Nova cijena */}
                        {!is_job_category ? (
                          <span className={`text-sm font-bold ${showDiscount ? "text-red-600" : "text-slate-900 dark:text-slate-100"}`}>
                            {defaultDetails.price_on_request 
                              ? "Na upit" 
                              : defaultDetails.price 
                                ? formatPriceAbbreviated(currentPrice) 
                                : "0 KM"
                            }
                          </span>
                        ) : (
                          <div className="flex gap-1 text-sm font-bold text-slate-900 dark:text-slate-100">
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
                      <span className="font-medium text-slate-700 dark:text-slate-200">{t("Ocjena kvaliteta oglasa")}</span>
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
                          {t("Dodajte bar jednu sliku!")} (+20% {t("visibility")})
                        </p>
                      </div>
                    )}
                    {uploadedImages.length > 0 && otherImages.length < 3 && (
                      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-500/40 dark:bg-blue-500/10">
                        <Star className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
                        <p className="text-xs text-blue-800 dark:text-blue-100">
                          {t("Dodajte još fotografija").replace("{count}", 3 - otherImages.length)} (+{(3 - otherImages.length) * 5}% {t("veća vidljivost!")})
                        </p>
                      </div>
                    )}
                    {defaultDetails.description && defaultDetails.description.length < 100 && (
                      <div className="flex items-start gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-3 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/10">
                        <Award className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-600 dark:text-fuchsia-300" />
                        <p className="text-xs text-fuchsia-800 dark:text-fuchsia-100">{t("Detaljan opis")} (+10% {t("pouzdanost")})</p>
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
