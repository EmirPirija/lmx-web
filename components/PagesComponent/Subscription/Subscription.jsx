"use client";
import { useEffect, useState } from "react";
import AddListingPlanCard from "@/components/PagesComponent/Cards/AddListingPlanCard";
import {
  assigFreePackageApi,
  getPackageApi,
  getPaymentSettingsApi,
} from "@/utils/api";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { t } from "@/utils";
import PaymentModal from "./PaymentModal";
import { CurrentLanguageData, getIsRtl } from "@/redux/reducer/languageSlice";
import { useSelector } from "react-redux";
import Layout from "@/components/Layout/Layout";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { toast } from "@/utils/toastBs";
import BankDetailsModal from "./BankDetailsModal";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import AdListingPublicPlanCardSkeleton from "@/components/Skeletons/AdListingPublicPlanCardSkeleton";
import { getIsFreAdListing } from "@/redux/reducer/settingSlice";
import { useNavigate } from "@/components/Common/useNavigate";
import { PROMO_BENEFITS, PROMO_HEADLINE, PROMO_SUBHEAD, isPromoFreeAccessEnabled } from "@/lib/promoMode";

const Subscription = () => {
  const isRTL = useSelector(getIsRtl);
  const { navigate } = useNavigate();
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const promoEnabled = isPromoFreeAccessEnabled();

  const [listingPackages, setListingPackages] = useState([]);
  const hasListingDiscount = listingPackages?.some(
    (p) => p?.discount_in_percentage > 0
  );
  const [isListingPackagesLoading, setIsListingPackagesLoading] =
    useState(false);

  const [selectedPackage, setSelectedPackage] = useState(null);

  const [adPackages, setAdPackages] = useState([]);
  const hasAdDiscount = adPackages.some((p) => p.discount_in_percentage > 0);
  const [isAdPackagesLoading, setIsAdPackagesLoading] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [packageSettings, setPackageSettings] = useState(null);
  const isLoggedIn = useSelector(getIsLoggedIn);
  const isFreeAdListing = useSelector(getIsFreAdListing);

  useEffect(() => {
    if (!isFreeAdListing) {
      handleFetchListingPackages();
    }
    handleFetchFeaturedPackages();
  }, [CurrentLanguage?.id]);

  useEffect(() => {
    if (showPaymentModal && !promoEnabled) {
      handleFetchPaymentSetting();
    }
  }, [showPaymentModal, promoEnabled]);

  const handleFetchPaymentSetting = async () => {
    setIsLoading(true);
    try {
      const res = await getPaymentSettingsApi.getPaymentSettings();
      const { data } = res.data;
      setPackageSettings(data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchListingPackages = async () => {
    try {
      setIsListingPackagesLoading(true);
      const res = await getPackageApi.getPackage({ type: "item_listing" });
      setListingPackages(res?.data?.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsListingPackagesLoading(false);
    }
  };

  const handleFetchFeaturedPackages = async () => {
    try {
      setIsAdPackagesLoading(true);
      const res = await getPackageApi.getPackage({ type: "advertisement" });
      setAdPackages(res.data?.data);
    } catch (error) {
      console.log(error);
    } finally {
      setIsAdPackagesLoading(false);
    }
  };

  const handlePurchasePackage = (pckg) => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    if (promoEnabled) {
      assignPackage(pckg.id);
      return;
    }
    if (pckg?.final_price === 0) {
      assignPackage(pckg.id);
    } else {
      setShowPaymentModal(true);
      setSelectedPackage(pckg);
    }
  };

  const assignPackage = async (id) => {
    try {
      const res = await assigFreePackageApi.assignFreePackage({
        package_id: id,
      });
      const data = res?.data;
      if (data?.error === false) {
        toast.success(data.message);
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Aktivacija paketa nije uspjela.");
      console.log(error);
    }
  };

  return (
    <Layout>
      <BreadCrumb title2={"Pretplata"} />
      <div className="container">
        {promoEnabled ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200">
            <p className="font-semibold">{PROMO_HEADLINE}</p>
            <p className="mt-1 text-xs">{PROMO_SUBHEAD}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PROMO_BENEFITS.map((benefit) => (
                <span
                  key={benefit}
                  className="rounded-full border border-emerald-300/80 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/35 dark:bg-slate-900 dark:text-emerald-200"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {isListingPackagesLoading ? (
          <AdListingPublicPlanCardSkeleton />
        ) : (
          listingPackages?.length > 0 && (
            <div className="flex flex-col gap-4 mt-8">
              <h1 className="text-2xl font-medium">Privremeno nedo</h1>
              <div className="relative">
                <Carousel
                  key={isRTL ? "rtl" : "ltr"}
                  opts={{
                    align: "start",
                    containScroll: "trim",
                    direction: isRTL ? "rtl" : "ltr",
                  }}
                >
                  <CarouselPrevious className="hidden md:flex absolute top-1/2 ltr:left-2 rtl:right-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full z-10" />
                  <CarouselNext className="hidden md:flex absolute top-1/2 ltr:right-2 rtl:left-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full z-10" />
                  <CarouselContent
                    className={`sm:gap-4 ${hasListingDiscount ? "pt-6" : ""}`}
                  >
                    {listingPackages?.map((pckg) => (
                      <CarouselItem
                        key={pckg.id}
                        className="basis-[90%] sm:basis-[75%] md:basis-[55%] lg:basis-[45%] xl:basis-[35%] 2xl:basis-[30%]"
                      >
                        <AddListingPlanCard
                          pckg={pckg}
                          handlePurchasePackage={handlePurchasePackage}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            </div>
          )
        )}

        {isAdPackagesLoading ? (
          <AdListingPublicPlanCardSkeleton />
        ) : (
          <div className="flex flex-col gap-4 mt-8">
            <h1 className="text-2xl font-medium">{"Plan istaknutog oglasa"}</h1>
            <div className="relative">
              <Carousel
                key={isRTL ? "rtl" : "ltr"}
                opts={{
                  align: "start",
                  containScroll: "trim",
                  direction: isRTL ? "rtl" : "ltr",
                }}
                className="w-full"
              >
                <CarouselPrevious className="hidden md:flex absolute top-1/2 ltr:left-2 rtl:right-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full z-10" />
                <CarouselNext className="hidden md:flex absolute top-1/2 ltr:right-2 rtl:left-2 rtl:scale-x-[-1] -translate-y-1/2 bg-primary text-white rounded-full z-10" />
                <CarouselContent
                  className={`sm:gap-4 ${hasAdDiscount ? "pt-6" : ""}`}
                >
                  {adPackages?.map((pckg) => (
                    <CarouselItem
                      key={pckg.id}
                      className="basis-[90%] sm:basis-[75%] md:basis-[55%] lg:basis-[45%] xl:basis-[35%] 2xl:basis-[30%]"
                    >
                      <AddListingPlanCard
                        pckg={pckg}
                        handlePurchasePackage={handlePurchasePackage}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        )}

        {!promoEnabled ? (
          <>
            <PaymentModal
              showPaymentModal={showPaymentModal}
              setShowPaymentModal={setShowPaymentModal}
              selectedPackage={selectedPackage}
              setListingPackages={setListingPackages}
              setAdPackages={setAdPackages}
              packageSettings={packageSettings}
              isLoading={isLoading}
            />
            <BankDetailsModal
              packageId={selectedPackage?.id}
              bankDetails={packageSettings?.bankTransfer}
            />
          </>
        ) : null}
      </div>
    </Layout>
  );
};

export default Subscription;
