"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import ComponentOne from "./ComponentOne";
import {
  addItemApi,
  categoryApi,
  getCustomFieldsApi,
  getParentCategoriesApi,
} from "@/utils/api";
import ComponentTwo from "./ComponentTwo";
import {
  filterNonDefaultTranslations,
  prepareCustomFieldFiles,
  prepareCustomFieldTranslations,
  t,
  formatPriceAbbreviated,
} from "@/utils";
import { toast } from "sonner";
import ComponentThree from "./ComponentThree";
import ComponentFour from "./ComponentFour";
import ComponentFive from "./ComponentFive";
import { useSelector } from "react-redux";
import AdSuccessModal from "./AdSuccessModal";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import Layout from "@/components/Layout/Layout";
import Checkauth from "@/HOC/Checkauth";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import AdLanguageSelector from "./AdLanguageSelector";
import { getDefaultLanguageCode, getLanguages } from "@/redux/reducer/settingSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
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
  Images // Ikona za slike
} from "lucide-react";
import { IconRosetteDiscount } from "@tabler/icons-react";

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

  const [disabledTab, setDisabledTab] = useState({
    categoryTab: false,
    detailTab: true,
    extraDetailTabl: true,
    images: true,
    location: true,
  });

  const [customFields, setCustomFields] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const [uploadedImages, setUploadedImages] = useState([]);
  const [otherImages, setOtherImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [isMediaProcessing, setIsMediaProcessing] = useState(false);
  const [location, setLocation] = useState({});
  const [isAdPlaced, setIsAdPlaced] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [createdAdSlug, setCreatedAdSlug] = useState("");
  const [recentCategories, setRecentCategories] = useState([]);

  const [allCategoriesTree, setAllCategoriesTree] = useState([]);

  const languages = useSelector(getLanguages);
  const defaultLanguageCode = useSelector(getDefaultLanguageCode);
  const defaultLangId = languages?.find((lang) => lang.code === defaultLanguageCode)?.id;

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
    },
  });

  const hasTextbox = customFields.some((field) => field.type === "textbox");

  const defaultDetails = translations[defaultLangId] || {};
  const currentDetails = translations[langId] || {};
  const currentExtraDetails = extraDetails[langId] || {};

  const is_job_category = Number(categoryPath[categoryPath.length - 1]?.is_job_category) === 1;
  const isPriceOptional = Number(categoryPath[categoryPath.length - 1]?.price_optional) === 1;

  const allCategoryIdsString = categoryPath.map((category) => category.id).join(",");
  const lastItemId = categoryPath[categoryPath.length - 1]?.id;

  // Caching refs
  const categoriesCacheRef = useRef(new Map());
  const categoriesAbortRef = useRef(null);
  const categoriesReqSeqRef = useRef(0);

  const CAT_CACHE_TTL = 1000 * 60 * 30; // 30min
  const ROOT_PER_PAGE = 50; 
  const CHILD_PER_PAGE = 50;

  const fetchCategories = useCallback(
    async ({ categoryId = null, page = 1, append = false } = {}) => {
      const langKey = CurrentLanguage?.id || "lang";
      const catKey = categoryId ? String(categoryId) : "root";
      const key = `${langKey}:${catKey}:${page}`;

      const cached = categoriesCacheRef.current.get(key);
      if (cached && Date.now() - cached.ts < CAT_CACHE_TTL) {
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

  const preloadAllRootCategories = useCallback(async () => {
    const res1 = await categoryApi.getCategory({
      page: 1,
      per_page: 50,
      language_id: CurrentLanguage?.id,
    });
  
    const payload1 = res1?.data?.data;
    const list1 = payload1?.data || [];
    const lp = payload1?.last_page || 1;
  
    let all = [...list1];
  
    for (let p = 2; p <= lp; p++) {
      const resP = await categoryApi.getCategory({
        page: p,
        per_page: 50,
        language_id: CurrentLanguage?.id,
      });
      const pay = resP?.data?.data;
      all = all.concat(pay?.data || []);
    }
  
    setAllCategoriesTree(all);
  }, [CurrentLanguage?.id]);
  

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
    if (step === 1) {
      handleFetchCategories();
      if (!lastItemId) preloadAllRootCategories();
    }
  }, [step, lastItemId, CurrentLanguage?.id, handleFetchCategories, preloadAllRootCategories]);
  
  useEffect(() => {
    if (step !== 1 && allCategoryIdsString) {
      getCustomFieldsData();
    }
  }, [allCategoryIdsString, CurrentLanguage?.id]);

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

  const getCustomFieldsData = async () => {
    try {
      const res = await getCustomFieldsApi.getCustomFields({ category_ids: allCategoryIdsString });
      const data = res?.data?.data;
      setCustomFields(data);

      const initializedDetails = {};
      languages.forEach((lang) => {
        const langFields = {};
        data.forEach((item) => {
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
      setExtraDetails(initializedDetails);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCategoryTabClick = async (category) => {
    setCategoryPath((prevPath) => [...prevPath, category]);
    saveRecentCategory(category);

    if (!(category?.subcategories_count > 0)) {
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
    setLangId(defaultLangId);
    setTranslations({
      [defaultLangId]: {
        contact: mobile,
        country_code: countryCode,
        region_code: regionCode,
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
    if (customFields?.length === 0) setStep(4);
    else setStep(3);
  };

  const isEmpty = (x) => !x || !x.toString().trim();

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

    const allData = {
      name: defaultDetails.name,
      slug: (defaultDetails.slug || "").trim(),
      description: defaultDetails?.description,
      category_id: catId,
      all_category_ids: allCategoryIdsString,
      price: defaultDetails.price,
      contact: defaultDetails.contact,
      video_link: defaultDetails?.video_link,
      image: uploadedImages[0],
      gallery_images: otherImages,
      address: location?.address,
      video: uploadedVideo,
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
      const res = await addItemApi.addItem(allData);

      if (res?.data?.error === false) {
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
    }
  };

  const handleGoBack = () => {
    setStep((prev) => {
      if (customFields.length === 0 && step === 4) return prev - 2;
      return prev - 1;
    });
  };

  const handleTabClick = (tab) => {
    if (tab === 1 && !disabledTab.categoryTab) setStep(1);
    else if (tab === 2 && !disabledTab.detailTab) setStep(2);
    else if (tab === 3 && !disabledTab.extraDetailTabl) setStep(3);
    else if (tab === 4 && !disabledTab.images) setStep(4);
    else if (tab === 5 && !disabledTab.location) setStep(5);
  };

  const handleDeatilsBack = () => {
    setCustomFields([]);
    setLangId(defaultLangId);
    setTranslations({
      [defaultLangId]: {
        contact: mobile,
        country_code: countryCode,
        region_code: regionCode,
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
  const steps = [
    { id: 1, label: t("selectedCategory"), icon: Circle, disabled: disabledTab.categoryTab },
    { id: 2, label: t("details"), icon: Circle, disabled: disabledTab.detailTab },
    ...(customFields?.length > 0
      ? [{ id: 3, label: t("extraDetails"), icon: Circle, disabled: disabledTab.extraDetailTabl }]
      : []),
    { id: 4, label: t("images"), icon: Circle, disabled: disabledTab.images },
    { id: 5, label: t("location"), icon: Circle, disabled: disabledTab.location },
  ];

  const getStepProgress = (stepId) => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === step);
    if (stepIndex < currentIndex) return 100;
    if (stepIndex === currentIndex) {
      switch (stepId) {
        case 1: return categoryPath.length > 0 ? 100 : 0;
        case 2: return defaultDetails.name && defaultDetails.description ? 100 : 50;
        case 3: return Object.keys(currentExtraDetails).length > 0 ? 100 : 0;
        case 4: return uploadedImages.length > 0 ? 100 : 0;
        case 5: return location?.address ? 100 : 0;
        default: return 0;
      }
    }
    return 0;
  };

  // Preview Logic
  const isOnSale = defaultDetails.is_on_sale;
  const oldPrice = Number(defaultDetails.old_price);
  const currentPrice = Number(defaultDetails.price);
  const showDiscount = isOnSale && oldPrice > 0 && currentPrice > 0 && oldPrice > currentPrice;
  const previewAttributes = getPreviewAttributes(); // Dohvati atribute za prikaz

  // =======================================================
  // MEDIA: kompresija + watermark odmah na selekciju
  // (ComponentFour će i dalje samo zvati setUploadedImages / setOtherImages / setUploadedVideo)
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
    async (files) => {
      const arr = normalizeFilesArray(files);
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
    async (fileOrList) => {
      const [file] = normalizeFilesArray(fileOrList);
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
      <div className="container">
        <div className="flex flex-col gap-8 mt-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">{t("adListing")}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">{completenessScore}%</span>
                <span className="text-sm text-muted-foreground">{t("dovršen")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* FIXED STEPPER */}
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <div className="relative">
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
                  <div
                    className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${(steps.findIndex((s) => s.id === step) / (steps.length - 1)) * 100}%`,
                      zIndex: 1,
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
                              <span className="text-sm font-bold">{idx + 1}</span>
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

              {(step == 2 || (step === 3 && hasTextbox)) && (
                <div className="flex justify-end">
                  {/* AdLanguageSelector was here */}
                </div>
              )}

              {(step == 1 || step == 2) && categoryPath?.length > 0 && (
                <div className="flex flex-col gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-gray-500">{t("selectedCategory")}</p>
                    <button 
                      onClick={handleCategoryReset}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      <X size={14} />
                      Očisti sve
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCategoryBack}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors mr-1"
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
                              ? "bg-primary/10 text-primary font-semibold border border-primary/20" 
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                            }
                          `}
                          onClick={() => handleSelectedTabClick(item?.id)}
                        >
                          {item.translated_name || item.name}
                        </button>
                        
                        {index !== categoryPath.length - 1 && (
                          <ChevronRight size={16} className="text-gray-400 mx-1" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border rounded-lg p-6 bg-white shadow-sm">
                {step == 1 && (
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
                    searchSourceCategories={allCategoriesTree}
                  />
                )}

                {step == 2 && (
                  <ComponentTwo
                    setTranslations={setTranslations}
                    current={currentDetails}
                    langId={langId}
                    defaultLangId={defaultLangId}
                    handleDetailsSubmit={handleDetailsSubmit}
                    handleDeatilsBack={handleDeatilsBack}
                    is_job_category={is_job_category}
                    isPriceOptional={isPriceOptional}
                  />
                )}

                {step == 3 && (
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
                  />
                )}

                {step == 4 && (
                  <ComponentFour
                    uploadedImages={uploadedImages}
                    setUploadedImages={setUploadedImagesProcessed}
                    otherImages={otherImages}
                    setOtherImages={setOtherImagesProcessed}
                    uploadedVideo={uploadedVideo}
                    setUploadedVideo={setUploadedVideoValidated}
                    setStep={setStep}
                    handleGoBack={handleGoBack}
                  />
                )}

                {step == 5 && (
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
              <div className="sticky top-4 border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">{t("Pregled oglasa")}</h3>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl flex flex-col h-full group overflow-hidden shadow-sm">
                  {/* Image Area */}
                  <div className="relative aspect-square bg-gray-100">
                    {uploadedImages.length > 0 ? (
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

                    {/* SALE BADGE */}
                    {showDiscount && (
                      <div className="absolute top-2 right-2 flex items-center justify-center bg-red-600 rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm z-10">
                        <IconRosetteDiscount size={18} stroke={2} className="text-white" />
                      </div>
                    )}

                    {/* Image Counter with Icon */}
                    {(uploadedImages.length > 0 || otherImages.length > 0) && (
                      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md text-white text-[12px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Images size={12} />
                        <span className="text-xs">
                          {uploadedImages.length + otherImages.length}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex flex-col gap-1.5 p-2 flex-grow">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                      {defaultDetails.name || t("Vaš naslov oglasa ovdje")}
                    </h3>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      <span className="truncate max-w-[150px]">{location?.city || t("Lokacija")}</span>
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
                        {/* Stara cijena (Prekrižena) */}
                        {showDiscount && (
                          <span className="text-[10px] text-gray-400 line-through decoration-red-400">
                            {formatPriceAbbreviated(oldPrice)}
                          </span>
                        )}

                        {/* Nova cijena */}
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
                    {uploadedImages.length > 0 && otherImages.length < 3 && (
                      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Star className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-800">
                          {t("Dodajte još fotografija").replace("{count}", 3 - otherImages.length)} (+{(3 - otherImages.length) * 5}% {t("veća vidljivost!")})
                        </p>
                      </div>
                    )}
                    {defaultDetails.description && defaultDetails.description.length < 100 && (
                      <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <Award className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-purple-800">{t("Detaljan opis")} (+10% {t("pouzdanost")})</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AdSuccessModal
          openSuccessModal={openSuccessModal}
          setOpenSuccessModal={setOpenSuccessModal}
          createdAdSlug={createdAdSlug}
          isScheduled={isScheduledAd}
          scheduledDate={scheduledAt}
        />
      </div>
    </Layout>
  );
};

export default Checkauth(AdsListing);