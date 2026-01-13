"use client";
import { useEffect, useState, useMemo } from "react";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import {
  editItemApi,
  getCustomFieldsApi,
  getMyItemsApi,
  getParentCategoriesApi,
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
// Dodani icon importi iz lucide-react da odgovaraju adslisting.jsx
import { CheckCircle2, Circle, Award, TrendingUp, Zap, Star, Upload, MapPin } from "lucide-react";


const EditListing = ({ id }) => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [step, setStep] = useState(1);
  const [CreatedAdSlug, setCreatedAdSlug] = useState("");
  const [openSuccessModal, setOpenSuccessModal] = useState(false);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [OtherImages, setOtherImages] = useState([]);
  const [Location, setLocation] = useState({});
  const [filePreviews, setFilePreviews] = useState({});
  const [deleteImagesId, setDeleteImagesId] = useState("");
  const [isAdPlaced, setIsAdPlaced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [video, setVideo] = useState(null);

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

  // 🎯 Izračunavanje rezultata kompletnosti (Completeness Score) - KOPIRANO I PRILAGOĐENO IZ ADS LISTING
  const completenessScore = useMemo(() => {
    let score = 0;
    
    // Step 1: Category (Uvijek 20% kod edita jer je već odabrana)
    if (selectedCategoryPath.length > 0) score += 20;

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
      if (OtherImages.length >= 3) score += 10;
      else score += (OtherImages.length / 3) * 10;
    }

    // Step 5: Location (20%)
    if (Location?.country && Location?.state && Location?.city && Location?.address) {
      score += 20;
    }

    return Math.round(score);
  }, [selectedCategoryPath, defaultDetails, customFields, currentExtraDetails, uploadedImages, OtherImages, Location]);

  // 🏆 Kvalitetne značke - KOPIRANO IZ ADS LISTING
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

      // --- FIX POČINJE OVDJE ---
      // Ako je slika string, stavi je u niz. Ako nema slike, stavi prazan niz.
      setUploadedImages(listingData?.image ? [listingData.image] : []);
      // Osiguraj da je gallery_images uvijek niz
      setOtherImages(listingData?.gallery_images || []);
      // --- FIX ZAVRŠAVA OVDJE ---
      setVideo(listingData?.video || null);

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
    if (step == 4 && customFields?.length == 0) {
      setStep((prev) => prev - 2);
    } else {
      setStep((prev) => prev - 1);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 1) {
      setStep(1);
    } else if (tab === 2) {
      setStep(2);
    } else if (tab === 3) {
      setStep(3);
    } else if (tab === 4) {
      setStep(4);
    }
  };

  const submitExtraDetails = () => {
    setStep(3);
  };

  const SLUG_RE = /^[a-z0-9-]+$/i;
  const isEmpty = (x) => !x || !x.toString().trim();
  const isNegative = (n) => Number(n) < 0;

  const handleFullSubmission = () => {
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

    // ✅ Validate phone number ONLY if user entered one as it is optional
    if (Boolean(contact) && !isValidPhoneNumber(`+${country_code}${contact}`)) {
      toast.error(t("invalidPhoneNumber"));
      return setStep(1);
    }

    if (is_job_category) {
      const min = min_salary ? Number(min_salary) : null;
      const max = max_salary ? Number(max_salary) : null;

      // Salary fields are optional, but validate if provided
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
      if (!isPriceOptional && isEmpty(price)) {
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
      setStep(1);
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
    editAd();
  };

  const editAd = async () => {
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
 
    const allData = {
      id: id,
      name: defaultDetails.name,
      slug: defaultDetails.slug.trim(),
      description: defaultDetails?.description,
      price: defaultDetails.price,
      contact: defaultDetails.contact,
      region_code: defaultDetails?.region_code?.toUpperCase() || "",
      video_link: defaultDetails?.video_link,
      image: (uploadedImages[0] instanceof File || uploadedImages[0] instanceof Blob) ? uploadedImages[0] : null,
      gallery_images: OtherImages,
      address: Location?.address,
      latitude: Location?.lat,
      longitude: Location?.long,
      custom_field_files: customFieldFiles,
      country: Location?.country,
      video: (video instanceof File) ? video : null,
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
    };
 
    if (is_job_category) {
      allData.min_salary = defaultDetails.min_salary;
      allData.max_salary = defaultDetails.max_salary;
    } else {
      allData.price = defaultDetails.price;
      // DODANO - Akcija/Sale polja
      allData.is_on_sale = defaultDetails.is_on_sale || false;
      allData.old_price = defaultDetails.is_on_sale ? defaultDetails.old_price : null;
    }
 
    // 🔍 DEBUG - Šta šaljemo na API
    console.log('🚀 SENDING TO API - SALE FIELDS:', {
      is_on_sale: allData.is_on_sale,
      old_price: allData.old_price,
      price: allData.price,
    });
    
    try {
      setIsAdPlaced(true);
      const res = await editItemApi.editItem(allData);
      if (res?.data?.error === false) {
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

  // 🎨 Konfiguracija koraka za Stepper (prilagođeno za Edit - nema odabira kategorije kao korak 1)
  const steps = [
    { id: 1, label: t("details"), icon: Circle, disabled: false },
    ...(customFields?.length > 0 ? [{ id: 2, label: t("extraDetails"), icon: Circle, disabled: false }] : []),
    { id: 3, label: t("images"), icon: Circle, disabled: false },
    { id: 4, label: t("location"), icon: Circle, disabled: false },
  ];

  const getStepProgress = (stepId) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === step);
    
    if (stepIndex < currentIndex) return 100;
    if (stepIndex === currentIndex) {
      // Logika za trenutni korak u Edit modu
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

  // Helper za prikaz slike (može biti string URL ili File objekt)
// Helper za prikaz slike
const getPreviewImage = () => {
  // Provjeri da li postoji glavna slika
  if (uploadedImages && uploadedImages.length > 0) {
    const img = uploadedImages[0];

    // Slučaj 1: Nova slika (File objekt)
    if (img instanceof Blob || img instanceof File) {
      return URL.createObjectURL(img);
    }
    
    // Slučaj 2: Postojeća slika sa servera (String URL)
    if (typeof img === 'string') {
      return img;
    }
  }
  
  // Fallback: Ako nema glavne slike, prikaži prvu iz galerije (opcionalno)
  if (OtherImages && OtherImages.length > 0) {
     const galleryImg = OtherImages[0];
     // API za galeriju nekad vraća objekt {id:..., image: 'url'}, nekad samo string
     if (typeof galleryImg === 'string') return galleryImg;
     if (galleryImg?.image) return galleryImg.image;
     if (galleryImg instanceof File) return URL.createObjectURL(galleryImg);
  }

  return null;
};


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
                 {/* 🏆 Quality Score Badge - NOVO */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 rounded-full">
                    <Award className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-primary">{completenessScore}%</span>
                    <span className="text-sm text-muted-foreground">{t("dovršen")}</span>
                  </div>
                </div>
              </div>

              {/* GRID LAYOUT DA ODGOVARA ADS LISTING */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* LIJEVA STRANA - FORMA (2 KOLONE) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* 📊 Progress Stepper - NOVI DIZAJN */}
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
                                className={`
                                  relative w-10 h-10 rounded-full flex items-center justify-center
                                  transition-all duration-300 transform
                                  ${isActive ? 'scale-110 shadow-lg' : 'scale-100'}
                                  ${isCompleted ? 'bg-primary text-white' : 'bg-white border-2'}
                                  ${isActive && !isCompleted ? 'border-primary border-4' : 'border-gray-300'}
                                  ${'hover:scale-105 cursor-pointer'}
                                `}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                  <span className={`text-sm font-semibold ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                    {idx + 1}
                                  </span>
                                )}
                                
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

                  {/* Selected Category Path */}
                  {step === 1 &&
                    selectedCategoryPath &&
                    selectedCategoryPath?.length > 0 && (
                      <div className="flex flex-col gap-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="font-medium text-sm text-primary">
                          {t("selectedCategory")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedCategoryPath?.map((item, index) => {
                            const shouldShowComma =
                              selectedCategoryPath.length > 1 &&
                              index !== selectedCategoryPath.length - 1;
                            return (
                              <span className="text-primary font-medium" key={item.id}>
                                {item.name}
                                {shouldShowComma && ", "}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                  )}

                  {/* Glavni sadržaj komponenti */}
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
                      />
                    )}

                    {step == 3 && (
                      <EditComponentThree
                        setUploadedImages={setUploadedImages}
                        uploadedImages={uploadedImages}
                        OtherImages={OtherImages}
                        setOtherImages={setOtherImages}
                        handleImageSubmit={handleImageSubmit}
                        handleGoBack={handleGoBack}
                        setDeleteImagesId={setDeleteImagesId}
                        video={video}
                        setVideo={setVideo}
                      />
                    )}

                    {step == 4 && (
                      <EditComponentFour
                        handleGoBack={handleGoBack}
                        location={Location}
                        setLocation={setLocation}
                        handleFullSubmission={handleFullSubmission}
                        isAdPlaced={isAdPlaced}
                      />
                    )}
                  </div>
                </div>

                {/* 📱 DESNA STRANA - LIVE PREVIEW PANEL - NOVO */}
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
                        {getPreviewImage() ? (
                          <img 
                            src={getPreviewImage()} 
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
                        {(uploadedImages.length > 0 || OtherImages.length > 0) && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                            {uploadedImages.length + OtherImages.length} {t("slika")}
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

                        {/* Location */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{Location?.city || t("Lokacija oglasa")}</span>
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
          />
        </>
      )}
    </Layout>
  );
};

export default Checkauth(EditListing);