"use client";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
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
  isValidURL,
  prepareCustomFieldFiles,
  prepareCustomFieldTranslations,
  t,
  validateExtraDetails,
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
import {
  getDefaultLanguageCode,
  getLanguages,
} from "@/redux/reducer/settingSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { isValidPhoneNumber } from "libphonenumber-js/max";
import { 
  CheckCircle2, Circle, Award, TrendingUp, Zap, Star, Upload, MapPin,
  Smartphone, Monitor, Save, Clock, Camera, FileText, Target, Eye, 
  Sparkles, AlertTriangle, Lightbulb, BarChart3, RefreshCw, Trash2
} from "lucide-react";

// 🔧 DRAFT STORAGE KEY
const DRAFT_STORAGE_KEY = "ad_listing_draft";

const AdsListing = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState();
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [isLoadMoreCat, setIsLoadMoreCat] = useState(false);
  const [categoryPath, setCategoryPath] = useState([]);
  const [currentPage, setCurrentPage] = useState();
  const [lastPage, setLastPage] = useState();
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
  const [location, setLocation] = useState({});
  const [isAdPlaced, setIsAdPlaced] = useState(false);
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [createdAdSlug, setCreatedAdSlug] = useState("");
  const [recentCategories, setRecentCategories] = useState([]);
  const userData = useSelector(userSignUpData);

  // 🆕 NEW: Auto-save & UX States
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const autoSaveTimerRef = useRef(null);

  const languages = useSelector(getLanguages);
  const defaultLanguageCode = useSelector(getDefaultLanguageCode);
  const defaultLangId = languages?.find(
    (lang) => lang.code === defaultLanguageCode
  )?.id;

  const [extraDetails, setExtraDetails] = useState({
    [defaultLangId]: {},
  });
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

  const is_job_category =
    Number(categoryPath[categoryPath.length - 1]?.is_job_category) === 1;
  const isPriceOptional =
    Number(categoryPath[categoryPath.length - 1]?.price_optional) === 1;

  const allCategoryIdsString = categoryPath
    .map((category) => category.id)
    .join(",");
  let lastItemId = categoryPath[categoryPath.length - 1]?.id;

  // 🎯 Calculate completeness score
  const completenessScore = useMemo(() => {
    let score = 0;
    let totalSteps = 5;

    // Step 1: Category (20%)
    if (categoryPath.length > 0) score += 20;

    // Step 2: Details (20%)
    if (defaultDetails.name && defaultDetails.description && defaultDetails.contact) {
      score += 20;
    }

    // Step 3: Custom fields (20%)
    if (customFields.length === 0) {
      score += 20;
    } else {
      const filledFields = Object.keys(currentExtraDetails).filter(
        key => currentExtraDetails[key] && currentExtraDetails[key] !== ""
      ).length;
      score += (filledFields / customFields.length) * 20;
    }

    // Step 4: Images (20%)
    if (uploadedImages.length > 0) {
      score += 10;
      if (otherImages.length >= 3) score += 10;
      else score += (otherImages.length / 3) * 10;
    }

    // Step 5: Location (20%)
    if (location?.country && location?.state && location?.city && location?.address) {
      score += 20;
    }

    return Math.round(score);
  }, [categoryPath, defaultDetails, customFields, currentExtraDetails, uploadedImages, otherImages, location]);

  // 🏆 Calculate quality badges - ENHANCED
  const qualityBadges = useMemo(() => {
    const badges = [];
    
    // Badge for many photos
    if (uploadedImages.length > 0 && otherImages.length >= 3) {
      badges.push({
        icon: <Camera className="w-3 h-3" />,
        label: "Galerija",
        color: "bg-blue-500",
        tip: "Odlično! Više slika povećava povjerenje kupaca."
      });
    }
    
    // Badge for detailed description
    if (defaultDetails.description && defaultDetails.description.length >= 200) {
      badges.push({
        icon: <FileText className="w-3 h-3" />,
        label: "Detaljan opis",
        color: "bg-purple-500",
        tip: "Detaljan opis pomaže kupcima da bolje razumiju proizvod."
      });
    }
    
    // Badge for completeness
    if (completenessScore >= 90) {
      badges.push({
        icon: <Award className="w-3 h-3" />,
        label: "Premium oglas",
        color: "bg-gradient-to-r from-yellow-500 to-orange-500",
        tip: "Vaš oglas je odlično popunjen i ima veću vidljivost!"
      });
    } else if (completenessScore >= 70) {
      badges.push({
        icon: <Target className="w-3 h-3" />,
        label: "Kvalitetan",
        color: "bg-green-500",
        tip: "Dobar oglas! Dodajte još detalja za bolju vidljivost."
      });
    }

    return badges;
  }, [uploadedImages, otherImages, defaultDetails, completenessScore]);

  // 📊 SEO Score calculation - NEW
  const seoScore = useMemo(() => {
    let score = 0;
    const tips = [];
    
    // Title optimization (30 points max)
    if (defaultDetails.name) {
      const titleLength = defaultDetails.name.length;
      if (titleLength >= 20 && titleLength <= 70) {
        score += 30;
      } else if (titleLength >= 10 && titleLength < 20) {
        score += 15;
        tips.push({ text: "Naslov bi trebao imati 20-70 karaktera", type: "warning" });
      } else if (titleLength > 70) {
        score += 20;
        tips.push({ text: "Naslov je predugačak, skratite ga", type: "warning" });
      } else {
        tips.push({ text: "Dodajte duži, opisniji naslov", type: "error" });
      }
    } else {
      tips.push({ text: "Dodajte naslov oglasa", type: "error" });
    }
    
    // Description optimization (30 points max)
    if (defaultDetails.description) {
      const descLength = defaultDetails.description.length;
      if (descLength >= 200) {
        score += 30;
      } else if (descLength >= 100) {
        score += 20;
        tips.push({ text: "Dodajte detaljniji opis (min 200 karaktera)", type: "warning" });
      } else if (descLength >= 50) {
        score += 10;
        tips.push({ text: "Opis je prekratak, kupci vole detalje", type: "warning" });
      } else {
        tips.push({ text: "Dodajte duži opis proizvoda", type: "error" });
      }
    } else {
      tips.push({ text: "Dodajte opis oglasa", type: "error" });
    }
    
    // Images (25 points max)
    if (uploadedImages.length > 0) {
      score += 10;
      if (otherImages.length >= 3) {
        score += 15;
      } else if (otherImages.length >= 1) {
        score += 5;
        tips.push({ text: `Dodajte još ${3 - otherImages.length} slike za bolju vidljivost`, type: "info" });
      } else {
        tips.push({ text: "Dodajte dodatne slike proizvoda", type: "warning" });
      }
    } else {
      tips.push({ text: "Dodajte glavnu sliku", type: "error" });
    }
    
    // Price (10 points)
    if (defaultDetails.price && Number(defaultDetails.price) > 0) {
      score += 10;
    } else if (!is_job_category && !isPriceOptional) {
      tips.push({ text: "Dodajte cijenu proizvoda", type: "warning" });
    }
    
    // Location (5 points)
    if (location?.city) {
      score += 5;
    }
    
    return { score, tips };
  }, [defaultDetails, uploadedImages, otherImages, location, is_job_category, isPriceOptional]);

  // 🔧 Dynamic tips based on current step
  const currentTips = useMemo(() => {
    const tips = [];
    
    switch(step) {
      case 1:
        tips.push({
          icon: <Lightbulb className="w-4 h-4" />,
          text: "Odaberite najprecizniju kategoriju za bolju vidljivost",
          type: "info"
        });
        break;
      case 2:
        if (!defaultDetails.name) {
          tips.push({
            icon: <AlertTriangle className="w-4 h-4" />,
            text: "Naslov je obavezan - koristite ključne riječi",
            type: "warning"
          });
        }
        if (!defaultDetails.description || defaultDetails.description.length < 100) {
          tips.push({
            icon: <Lightbulb className="w-4 h-4" />,
            text: "Detaljan opis povećava šanse za prodaju do 40%",
            type: "info"
          });
        }
        break;
      case 4:
        if (uploadedImages.length === 0) {
          tips.push({
            icon: <Camera className="w-4 h-4" />,
            text: "Oglasi sa slikama dobijaju 10x više pregleda",
            type: "warning"
          });
        }
        if (otherImages.length < 3) {
          tips.push({
            icon: <Sparkles className="w-4 h-4" />,
            text: "Više slika = više povjerenja kupaca",
            type: "info"
          });
        }
        break;
      case 5:
        tips.push({
          icon: <MapPin className="w-4 h-4" />,
          text: "Precizna lokacija pomaže kupcima da vas lakše pronađu",
          type: "info"
        });
        break;
    }
    
    return tips;
  }, [step, defaultDetails, uploadedImages, otherImages]);

  // Load recent categories from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentCategories");
    if (stored) {
      setRecentCategories(JSON.parse(stored));
    }
  }, []);

  // 🔧 AUTO-SAVE: Check for existing draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        // Check if draft is not too old (24 hours)
        const draftAge = Date.now() - (parsedDraft.savedAt || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (draftAge < maxAge && parsedDraft.translations) {
          setHasDraft(true);
          setShowDraftModal(true);
        } else {
          // Draft is too old, clear it
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
  }, []);

  // 🔧 AUTO-SAVE: Save draft function
  const saveDraft = useCallback(() => {
    // Don't save if no meaningful data
    if (!defaultDetails.name && !defaultDetails.description && categoryPath.length === 0) {
      return;
    }

    setIsSaving(true);
    
    const draftData = {
      step,
      categoryPath,
      translations,
      extraDetails,
      location,
      savedAt: Date.now(),
      // Note: We can't save File objects, so images are not saved in draft
    };
    
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
      setHasDraft(true);
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
    
    setTimeout(() => setIsSaving(false), 500);
  }, [step, categoryPath, translations, extraDetails, location, defaultDetails]);

  // 🔧 AUTO-SAVE: Trigger on data changes
  useEffect(() => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Set new timer (auto-save after 3 seconds of inactivity)
    autoSaveTimerRef.current = setTimeout(() => {
      saveDraft();
    }, 3000);
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [translations, extraDetails, location, categoryPath, saveDraft]);

  // 🔧 RESTORE DRAFT function
  const restoreDraft = useCallback(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        
        if (parsedDraft.categoryPath?.length > 0) {
          setCategoryPath(parsedDraft.categoryPath);
          setDisabledTab({
            categoryTab: true,
            detailTab: false,
            extraDetailTabl: false,
            images: false,
            location: false,
          });
        }
        
        if (parsedDraft.translations) {
          setTranslations(parsedDraft.translations);
        }
        
        if (parsedDraft.extraDetails) {
          setExtraDetails(parsedDraft.extraDetails);
        }
        
        if (parsedDraft.location) {
          setLocation(parsedDraft.location);
        }
        
        // Go to the step they were on, or step 2 if they had a category
        if (parsedDraft.step > 1) {
          setStep(parsedDraft.step);
        } else if (parsedDraft.categoryPath?.length > 0) {
          setStep(2);
        }
        
        toast.success("Nacrt uspješno učitan!");
        setShowDraftModal(false);
      } catch (e) {
        toast.error("Greška pri učitavanju nacrta");
      }
    }
  }, []);

  // 🔧 CLEAR DRAFT function
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setShowDraftModal(false);
    setLastSaved(null);
    toast.info("Nacrt je obrisan");
  }, []);

  // Save recent category
  const saveRecentCategory = (category) => {
    setRecentCategories(prev => {
      const filtered = prev.filter(c => c.id !== category.id);
      const updated = [category, ...filtered].slice(0, 5);
      localStorage.setItem("recentCategories", JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (step === 1) {
      handleFetchCategories();
    }
  }, [lastItemId, CurrentLanguage.id]);

  useEffect(() => {
    if (step !== 1 && allCategoryIdsString) {
      getCustomFieldsData();
    }
  }, [allCategoryIdsString, CurrentLanguage.id]);

  useEffect(() => {
    if (categoryPath.length > 0) {
      const lastCategoryId = categoryPath[categoryPath.length - 1]?.id;
      if (lastCategoryId) {
        getParentCategoriesApi
          .getPaymentCategories({
            child_category_id: lastCategoryId,
          })
          .then((res) => {
            const updatedPath = res?.data?.data;
            if (updatedPath?.length > 0) {
              setCategoryPath(updatedPath);
            }
          })
          .catch((err) => {
            console.log("Error updating category path:", err);
          });
      }
    }
  }, [CurrentLanguage.id]);

  const handleFetchCategories = async (id) => {
    setCategoriesLoading(true);
    try {
      const res = await categoryApi.getCategory({
        category_id: id ? id : lastItemId,
      });
      const data = res?.data?.data?.data;
      setCategories(data);
      setCurrentPage(res?.data?.data?.current_page);
      setLastPage(res?.data?.data?.last_page);
    } catch (error) {
      console.log("error", error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  
  const debugSchedule = (...args) => {
    console.log("[SCHEDULE DEBUG]", ...args);
  };

  const getCustomFieldsData = async () => {
    try {
      const res = await getCustomFieldsApi.getCustomFields({
        category_ids: allCategoryIdsString,
      });
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
            case "dropdown":
            case "textbox":
            case "number":
            case "text":
              initialValue = "";
              break;
            default:
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
    setExtraDetails({
      [defaultLangId]: {},
    });
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
    const index = categoryPath.findIndex((item) => item.id === id);
    if (index !== -1) {
      const newPath = categoryPath.slice(0, index);
      setCategoryPath(newPath);
    }
    if (index === 0) {
      setCategories([]);
      setCategoryPath([]);
    }
  };

  const handleDetailsSubmit = () => {
    if (customFields?.length === 0) {
      setStep(4);
    } else {
      setStep(3);
    }
  };
  
  const SLUG_RE = /^[a-z0-9-]+$/i;
  const isEmpty = (x) => !x || !x.toString().trim();
  const isNegative = (n) => Number(n) < 0;

  const handleFullSubmission = (scheduledDateTime = null) => {
    debugSchedule("handleFullSubmission called", {
      scheduledDateTime,
      isScheduledAd_state: isScheduledAd,
      scheduledAt_state: scheduledAt,
      step,
    });
  
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
  
    const catId = categoryPath.at(-1)?.id;
  
    debugSchedule("current validation snapshot", {
      catId,
      name,
      descriptionLen: description?.length,
      contact,
      country_code,
      is_job_category,
      isPriceOptional,
      uploadedImagesCount: uploadedImages.length,
      otherImagesCount: otherImages.length,
      location,
      customFieldsCount: customFields.length,
    });
  
    if (!catId) {
      debugSchedule("FAIL: no catId");
      toast.error(t("selectCategory"));
      return setStep(1);
    }
  
    if (scheduledDateTime) {
      debugSchedule("Setting scheduledAt state", scheduledDateTime);
      setScheduledAt(scheduledDateTime);
    } else {
      debugSchedule("No scheduledDateTime passed (posting as normal ad)");
    }
  
    if (isEmpty(name) || isEmpty(description) || isEmpty(contact)) {
      debugSchedule("FAIL: missing basic details", { name, description, contact });
      toast.error(t("completeDetails"));
      return setStep(2);
    }
  
    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      debugSchedule("FAIL: invalid phone", `+${country_code}${contact}`);
      toast.error(t("invalidPhoneNumber"));
      return setStep(2);
    }
  
    // ... (ostatak validacija ostaje isti)
  
    if (!location?.country || !location?.state || !location?.city || !location?.address) {
      debugSchedule("FAIL: location incomplete", location);
      toast.error(t("pleaseSelectCity"));
      return;
    }
  
    debugSchedule("All validations passed -> calling postAd", { scheduledDateTime });
    postAd(scheduledDateTime);
  };
  


  const postAd = async (scheduledDateTime = null) => {
    const catId = categoryPath.at(-1)?.id;
  
    debugSchedule("postAd called", { scheduledDateTime, catId });
  
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
      ...(Object.keys(customFieldTranslations).length > 0 && { custom_field_translations: customFieldTranslations }),
      region_code: defaultDetails?.region_code?.toUpperCase() || "",
      ...(scheduledDateTime ? { scheduled_at: scheduledDateTime } : {}),
    };
  
    debugSchedule("payload built", {
      scheduled_at_in_payload: allData.scheduled_at,
      slug: allData.slug,
      keys: Object.keys(allData),
    });
  
    try {
      setIsAdPlaced(true);
      const res = await addItemApi.addItem(allData);
  
      debugSchedule("API response", {
        error: res?.data?.error,
        message: res?.data?.message,
        data: res?.data?.data,
        status: res?.status,
      });
  
      if (res?.data?.error === false) {
        // 🔧 Clear draft on successful submission
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasDraft(false);
        setLastSaved(null);
        
        setIsScheduledAd(!!scheduledDateTime);
        setScheduledAt(scheduledDateTime);
        setOpenSuccessModal(true);
        setCreatedAdSlug(res?.data?.data[0]?.slug);
        debugSchedule("SUCCESS: scheduled flags set", { isScheduled: !!scheduledDateTime, scheduledDateTime });
      } else {
        toast.error(res?.data?.message);
        debugSchedule("BACKEND returned error=true", res?.data);
      }
    } catch (error) {
      debugSchedule("API throw/catch error", {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
      });
      console.error(error);
    } finally {
      setIsAdPlaced(false);
    }
  };

  

  const handleGoBack = () => {
    setStep((prev) => {
      if (customFields.length === 0 && step === 4) {
        return prev - 2;
      } else {
        return prev - 1;
      }
    });
  };

  const fetchMoreCategory = async () => {
    setIsLoadMoreCat(true);
    try {
      const response = await categoryApi.getCategory({
        page: `${currentPage + 1}`,
        category_id: lastItemId,
      });
      const { data } = response.data;
      setCategories((prev) => [...prev, ...data.data]);
      setCurrentPage(data?.current_page);
      setLastPage(data?.last_page);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoadMoreCat(false);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 1 && !disabledTab.categoryTab) {
      setStep(1);
    } else if (tab === 2 && !disabledTab.detailTab) {
      setStep(2);
    } else if (tab === 3 && !disabledTab.extraDetailTabl) {
      setStep(3);
    } else if (tab === 4 && !disabledTab.images) {
      setStep(4);
    } else if (tab === 5 && !disabledTab.location) {
      setStep(5);
    }
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
    setExtraDetails({
      [defaultLangId]: {},
    });

    if (step !== 1) {
      setStep(1);
      setDisabledTab({
        selectCategory: false,
        details: true,
        extraDet: true,
        img: true,
        loc: true,
      });
    }
    if (categoryPath.length > 0) {
      categoryPath.pop();
    }
  };

  // 🎨 Step configuration
  const steps = [
    { id: 1, label: t("selectedCategory"), icon: Circle, disabled: disabledTab.categoryTab },
    { id: 2, label: t("details"), icon: Circle, disabled: disabledTab.detailTab },
    ...(customFields?.length > 0 ? [{ id: 3, label: t("extraDetails"), icon: Circle, disabled: disabledTab.extraDetailTabl }] : []),
    { id: 4, label: t("images"), icon: Circle, disabled: disabledTab.images },
    { id: 5, label: t("location"), icon: Circle, disabled: disabledTab.location },
  ];

  const getStepProgress = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === step);
    
    if (stepIndex < currentIndex) return 100;
    if (stepIndex === currentIndex) {
      switch (stepId) {
        case 1: return categoryPath.length > 0 ? 100 : 0;
        case 2: return (defaultDetails.name && defaultDetails.description) ? 100 : 50;
        case 3: return Object.keys(currentExtraDetails).length > 0 ? 100 : 0;
        case 4: return uploadedImages.length > 0 ? 100 : 0;
        case 5: return location?.address ? 100 : 0;
        default: return 0;
      }
    }
    return 0;
  };

  return (
    <Layout>
      {/* 🔧 DRAFT RESTORATION MODAL */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Pronađen nacrt oglasa</h3>
                <p className="text-sm text-gray-500">
                  Sačuvan {lastSaved ? new Date(lastSaved).toLocaleString('hr') : 'ranije'}
                </p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Pronašli smo nedovršen oglas. Želite li nastaviti gdje ste stali ili početi ispočetka?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={clearDraft}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Počni ispočetka
              </button>
              <button
                onClick={restoreDraft}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Nastavi
              </button>
            </div>
          </div>
        </div>
      )}

      <BreadCrumb title2={t("adListing")} />
      <div className="container">
        <div className="flex flex-col gap-8 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-medium">{t("adListing")}</h1>
              
              {/* 🔧 AUTO-SAVE INDICATOR */}
              {hasDraft && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {isSaving ? (
                    <>
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Spremam...</span>
                    </>
                  ) : lastSaved ? (
                    <>
                      <Save className="w-4 h-4 text-green-500" />
                      <span>Sačuvano u {lastSaved.toLocaleTimeString('hr', { hour: '2-digit', minute: '2-digit' })}</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
            
            {/* 🏆 Quality Score Badge */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 rounded-full">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">{completenessScore}%</span>
                <span className="text-sm text-muted-foreground">{t("dovršen")}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2 columns */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* 📊 Progress Stepper */}
              <div className="border rounded-lg p-6 bg-white shadow-sm">
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full" style={{ zIndex: 0 }} />
                  
                  {/* Active Progress Bar */}
                  <div 
                    className="absolute top-5 left-0 h-1 bg-primary rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(steps.findIndex(s => s.id === step) / (steps.length - 1)) * 100}%`,
                      zIndex: 1
                    }}
                  />

                  {/* Steps */}
                  <div className="relative flex justify-between" style={{ zIndex: 2 }}>
                    {steps.map((s, idx) => {
                      const progress = getStepProgress(s.id);
                      const isActive = s.id === step;
                      const isCompleted = progress === 100;
                      
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                          <button
                            onClick={() => handleTabClick(s.id)}
                            disabled={s.disabled}
                            className={`
                              relative w-10 h-10 rounded-full flex items-center justify-center
                              transition-all duration-300 transform
                              ${isActive ? 'scale-110 shadow-lg' : 'scale-100'}
                              ${isCompleted ? 'bg-primary text-white' : 'bg-white border-2'}
                              ${isActive && !isCompleted ? 'border-primary border-4' : 'border-gray-300'}
                              ${s.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}
                            `}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                {idx + 1}
                              </span>
                            )}
                            
                            {/* Pulse animation for active step */}
                            {isActive && !isCompleted && (
                              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                            )}
                          </button>
                          
                          <span className={`
                            text-xs font-medium text-center max-w-[80px]
                            ${isActive ? 'text-primary' : 'text-gray-500'}
                          `}>
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Language Selector */}
              {(step == 2 || (step === 3 && hasTextbox)) && (
                <div className="flex justify-end">
                  <AdLanguageSelector
                    langId={langId}
                    setLangId={setLangId}
                    languages={languages}
                    setTranslations={setTranslations}
                  />
                </div>
              )}

              {/* Selected Category Path */}
              {(step == 1 || step == 2) && categoryPath?.length > 0 && (
                <div className="flex flex-col gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="font-medium text-sm text-primary">{t("selectedCategory")}</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryPath?.map((item, index) => (
                      <button
                        key={item.id}
                        className="text-sm px-3 py-1 bg-white rounded-full hover:bg-primary/10 transition-colors border border-primary/20"
                        onClick={() => handleSelectedTabClick(item?.id)}
                      >
                        {item.translated_name || item.name}
                        {index !== categoryPath.length - 1 && " →"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step Content */}
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
                  setUploadedImages={setUploadedImages}
                  otherImages={otherImages}
                  setOtherImages={setOtherImages}
                  uploadedVideo={uploadedVideo}
                  setUploadedVideo={setUploadedVideo}
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

            {/* 📱 Live Preview Panel - 1 column */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                {/* Header with Device Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-lg">{t("Pregled oglasa")}</h3>
                  </div>
                  
                  {/* 📱 DEVICE TOGGLE - NEW */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setIsMobilePreview(false)}
                      className={`p-1.5 rounded-md transition-all ${!isMobilePreview ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Desktop pregled"
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsMobilePreview(true)}
                      className={`p-1.5 rounded-md transition-all ${isMobilePreview ? 'bg-white shadow-sm text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                      title="Mobilni pregled"
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ad Preview Card */}
                <div className={`border rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300 ${isMobilePreview ? 'max-w-[280px] mx-auto' : ''}`}>
                  {/* Image Preview */}
                  <div className={`relative bg-gray-100 ${isMobilePreview ? 'aspect-square' : 'aspect-video'}`}>
                    {uploadedImages.length > 0 ? (
                      <img 
                        src={URL.createObjectURL(uploadedImages[0])} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Upload className={`mx-auto mb-2 ${isMobilePreview ? 'w-8 h-8' : 'w-12 h-12'}`} />
                          <p className={isMobilePreview ? 'text-xs' : 'text-sm'}>{t("Bez slike")}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Image count badge */}
                    {(uploadedImages.length > 0 || otherImages.length > 0) && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                        {uploadedImages.length + otherImages.length} {t("slika")}
                      </div>
                    )}
                  </div>

                  {/* Content Preview */}
                  <div className={`space-y-3 ${isMobilePreview ? 'p-3' : 'p-4'}`}>
                    {/* Title */}
                    <h4 className={`font-semibold line-clamp-2 ${isMobilePreview ? 'text-sm' : 'text-lg'}`}>
                      {defaultDetails.name || t("Vaš naslov oglasa ovdje")}
                    </h4>

                    {/* Price */}
                    {!is_job_category && (
                      <p className={`font-bold text-primary ${isMobilePreview ? 'text-xl' : 'text-2xl'}`}>
                        {defaultDetails.price ? `${defaultDetails.price} KM` : "0 KM"}
                      </p>
                    )}

                    {is_job_category && (
                      <div className={`flex gap-2 ${isMobilePreview ? 'text-xs flex-wrap' : 'text-sm'}`}>
                        {defaultDetails.min_salary && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {t("from")} {defaultDetails.min_salary} KM
                          </span>
                        )}
                        {defaultDetails.max_salary && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                            {t("to")} {defaultDetails.max_salary} KM
                          </span>
                        )}
                      </div>
                    )}

                    {/* Location */}
                    <div className={`flex items-center gap-2 text-gray-500 ${isMobilePreview ? 'text-xs' : 'text-sm'}`}>
                      <MapPin className={isMobilePreview ? 'w-3 h-3' : 'w-4 h-4'} />
                      <span>{location?.city || t("Lokacija oglasa")}</span>
                    </div>

                    {/* Quality Badges */}
                    {qualityBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t">
                        {qualityBadges.map((badge, idx) => (
                          <span 
                            key={idx}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-white ${badge.color} ${isMobilePreview ? 'text-[10px]' : 'text-xs'}`}
                            title={badge.tip}
                          >
                            {badge.icon} {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 📊 SEO Score - NEW */}
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">SEO Ocjena</span>
                    </div>
                    <span className={`font-bold text-lg ${
                      seoScore.score >= 80 ? 'text-green-600' : 
                      seoScore.score >= 50 ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                      {seoScore.score}/100
                    </span>
                  </div>
                  
                  {/* SEO Progress Bar */}
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        seoScore.score >= 80 ? 'bg-green-500' : 
                        seoScore.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${seoScore.score}%` }}
                    />
                  </div>
                  
                  {/* SEO Tips */}
                  {seoScore.tips.length > 0 && (
                    <div className="space-y-1.5">
                      {seoScore.tips.slice(0, 3).map((tip, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 text-xs p-2 rounded ${
                            tip.type === 'error' ? 'bg-red-50 text-red-700' :
                            tip.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {tip.type === 'error' ? <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> :
                           tip.type === 'warning' ? <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" /> :
                           <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                          <span>{tip.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tips & Completeness */}
                <div className="mt-4 space-y-4">
                  {/* Completeness Progress */}
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

                  {/* Dynamic Tips based on current step */}
                  {currentTips.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Savjeti za ovaj korak</p>
                      {currentTips.map((tip, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 p-3 rounded-lg ${
                            tip.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-blue-50 border border-blue-200'
                          }`}
                        >
                          <span className={tip.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'}>
                            {tip.icon}
                          </span>
                          <p className={`text-xs ${tip.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}`}>
                            {tip.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional Tips */}
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