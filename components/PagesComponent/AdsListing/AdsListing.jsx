"use client";
import { useEffect, useState, useMemo } from "react";
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
import { CheckCircle2, Circle, Award, TrendingUp, Zap, Star, Upload, MapPin } from "lucide-react";

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

  // 🏆 Calculate quality badges
  const qualityBadges = useMemo(() => {
    const badges = [];

    return badges;
  }, [uploadedImages, otherImages, defaultDetails, completenessScore]);

  // Load recent categories from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentCategories");
    if (stored) {
      setRecentCategories(JSON.parse(stored));
    }
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
 
    if (!catId) {
      toast.error(t("selectCategory"));
      return setStep(1);
    }
 
    if (scheduledDateTime) {
      setScheduledAt(scheduledDateTime);
    }
 
    if (isEmpty(name) || isEmpty(description) || isEmpty(contact)) {
      toast.error(t("completeDetails"));
      return setStep(2);
    }
 
    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      toast.error(t("invalidPhoneNumber"));
      return setStep(2);
    }
 
    if (is_job_category) {
      const min = min_salary ? Number(min_salary) : null;
      const max = max_salary ? Number(max_salary) : null;
 
      if (min !== null && min < 0) {
        toast.error(t("enterValidSalaryMin"));
        return setStep(2);
      }
      if (max !== null && max < 0) {
        toast.error(t("enterValidSalaryMax"));
        return setStep(2);
      }
      if (min !== null && max !== null) {
        if (min === max) {
          toast.error(t("salaryMinCannotBeEqualMax"));
          return setStep(2);
        }
        if (min > max) {
          toast.error(t("salaryMinCannotBeGreaterThanMax"));
          return setStep(2);
        }
      }
    } else {
      if (!isPriceOptional && isEmpty(price)) {
        toast.error(t("completeDetails"));
        return setStep(2);
      }
      if (!isEmpty(price) && isNegative(price)) {
        toast.error(t("enterValidPrice"));
        return setStep(2);
      }
    }
 
    if (!isEmpty(video_link) && !isValidURL(video_link)) {
      toast.error(t("enterValidUrl"));
      return setStep(2);
    }
 
    if (!isEmpty(slug) && !SLUG_RE.test(slug.trim())) {
      toast.error(t("addValidSlug"));
      return setStep(2);
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
      return setStep(3);
    }
    
    if (uploadedImages.length === 0) {
      toast.error(t("uploadMainPicture"));
      setStep(4);
      return;
    }
    
    if (
      !location?.country ||
      !location?.state ||
      !location?.city ||
      !location?.address
    ) {
      toast.error(t("pleaseSelectCity"));
      return;
    }
    
    postAd(scheduledDateTime); 
  };


  const postAd = async (scheduledDateTime = null) => {
    const catId = categoryPath.at(-1)?.id;
    const customFieldTranslations =
      prepareCustomFieldTranslations(extraDetails);

    const customFieldFiles = prepareCustomFieldFiles(
      extraDetails,
      defaultLangId
    );
    const nonDefaultTranslations = filterNonDefaultTranslations(
      translations,
      defaultLangId
    );

    const allData = {
      name: defaultDetails.name,
      slug: defaultDetails.slug.trim(),
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
      ...(Object.keys(nonDefaultTranslations).length > 0 && {
        translations: nonDefaultTranslations,
      }),
      ...(Object.keys(customFieldTranslations).length > 0 && {
        custom_field_translations: customFieldTranslations,
      }),
      region_code: defaultDetails?.region_code?.toUpperCase() || "",
      ...(scheduledDateTime && { scheduled_at: scheduledDateTime }),

    };
    
    if (is_job_category) {
      if (defaultDetails.min_salary) {
        allData.min_salary = defaultDetails.min_salary;
      }
      if (defaultDetails.max_salary) {
        allData.max_salary = defaultDetails.max_salary;
      }
    } else {
      allData.price = defaultDetails.price;
    }

    try {
      setIsAdPlaced(true);
      const res = await addItemApi.addItem(allData);
      if (res?.data?.error === false) {
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
      <BreadCrumb title2={t("adListing")} />
      <div className="container">
        <div className="flex flex-col gap-8 mt-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">{t("adListing")}</h1>
            
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
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">{t("Pregled oglasa")}</h3>
                </div>

                {/* Ad Preview Card */}
                <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  {/* Image Preview */}
                  <div className="relative aspect-video bg-gray-100">
                    {uploadedImages.length > 0 ? (
                      <img 
                        src={URL.createObjectURL(uploadedImages[0])} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <Upload className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">{t("Bez slike")}</p>
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
                  <div className="p-4 space-y-3">
                    {/* Title */}
                    <h4 className="font-semibold text-lg line-clamp-2">
                      {defaultDetails.name || t("Vaš naslov oglasa ovdje")}
                    </h4>

                    {/* Price */}
                    {!is_job_category && (
                      <p className="text-2xl font-bold text-primary">
                        {defaultDetails.price ? `${defaultDetails.price} KM` : "0 KM"}
                      </p>
                    )}

                    {is_job_category && (
                      <div className="flex gap-2 text-sm">
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

                    {/* Description */}
                    {/* <p className="text-sm text-gray-600 line-clamp-3">
                      {defaultDetails.description || t("Vaš opis ovdje")}
                    </p> */}

                    {/* Location */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{location?.city || t("Lokacija oglasa")}</span>
                    </div>

                    {/* Quality Badges */}
                    {qualityBadges.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {qualityBadges.map((badge, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-1 rounded-full text-white ${badge.color}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tips & Completeness */}
                <div className="mt-6 space-y-4">
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

                  {/* Tips */}
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
        />
      </div>
    </Layout>
  );
};

export default Checkauth(AdsListing);