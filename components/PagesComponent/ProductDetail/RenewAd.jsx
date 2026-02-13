import { useNavigate } from "@/components/Common/useNavigate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIsFreAdListing } from "@/redux/reducer/settingSlice";
import { t } from "@/utils";
import { getPackageApi, renewItemApi } from "@/utils/api";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "@/utils/toastBs";
import { RefreshCw, Package, CheckCircle2, AlertCircle } from "@/components/Common/UnifiedIconPack";

const RenewAd = ({
  currentLanguageId,
  setProductDetails,
  item_id,
  setStatus,
}) => {
  const { navigate } = useNavigate();
  const [RenewId, setRenewId] = useState("");
  const [ItemPackages, setItemPackages] = useState([]);
  const [isRenewingAd, setIsRenewingAd] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  const isFreeAdListing = useSelector(getIsFreAdListing);

  const mapRenewToastMessage = (message) => {
    const raw = String(message || "").trim();
    if (!raw) return "Greška pri obnavljanju oglasa.";
    const lower = raw.toLowerCase();

    if (
      lower.includes("has not expired yet") ||
      lower.includes("cannot be renewed") ||
      lower.includes("not expired")
    ) {
      return "Oglas još nije spreman za ovu obnovu. Obnova pozicije je dostupna svakih 15 dana.";
    }
    if (lower.includes("please select package")) {
      return "Odaberi paket za obnovu isteklog oglasa.";
    }
    if (lower.includes("you have not purchased this package")) {
      return "Odabrani paket nije aktivan na tvom računu.";
    }
    return raw;
  };

  useEffect(() => {
    getItemsPackageData();
  }, [currentLanguageId]);

  const getItemsPackageData = async () => {
    try {
      setIsLoadingPackages(true);
      const res = await getPackageApi.getPackage({ type: "item_listing" });
      const { data } = res.data;
      setItemPackages(data || []);
      
      // Automatski odaberi prvi aktivni paket ili prvi dostupni
      const activePackage = data?.find(p => p.is_active);
      setRenewId(activePackage?.id || data?.[0]?.id || "");
    } catch (error) {
      console.log(error);
      toast.error(t("failedToLoadPackages") || "Greška pri učitavanju paketa");
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleRenewItem = async () => {
    if (!RenewId && !isFreeAdListing) {
      toast.error(t("pleaseSelectPackage") || "Molimo odaberite paket");
      return;
    }

    const subPackage = ItemPackages.find(
      (p) => Number(p.id) === Number(RenewId)
    );

    if (!isFreeAdListing && !subPackage?.is_active) {
      toast.error(t("purchasePackageFirst") || "Morate prvo kupiti ovaj paket");
      navigate("/user-subscription");
      return;
    }

    try {
      setIsRenewingAd(true);
      const res = await renewItemApi.renewItem({
        item_ids: item_id.toString(),
        ...(isFreeAdListing ? {} : { package_id: RenewId }),
      });

      if (res?.data?.error === false) {
        // Ažuriraj product details
        setProductDetails((prev) => ({
          ...prev,
          status: res?.data?.data?.status,
          expiry_date: res?.data?.data?.expiry_date,
        }));
        setStatus(res?.data?.data?.status);
        
        toast.success(res?.data?.message || "Oglas je uspješno obnovljen!");
        
        // Opcionalno: redirect nakon par sekundi
        setTimeout(() => {
          navigate("/my-ads");
        }, 1500);
      } else {
        toast.error(mapRenewToastMessage(res?.data?.message));
      }
    } catch (error) {
      console.error(error);
      toast.error(
        mapRenewToastMessage(
          error?.response?.data?.message || t("somethingWentWrong") || "Nešto je pošlo po zlu"
        )
      );
    } finally {
      setIsRenewingAd(false);
    }
  };

  const selectedPackage = ItemPackages.find(
    (p) => Number(p.id) === Number(RenewId)
  );

  return (
    <div className="flex flex-col border rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 flex items-center gap-2">
        <RefreshCw className="size-5 text-primary" />
        <h3 className="font-semibold text-gray-900">{t("renewAd") || "Obnovi oglas"}</h3>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-4">
        {/* Free listing info */}
        {isFreeAdListing && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="size-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-green-900">
                {t("freeRenewal") || "Besplatno obnavljanje"}
              </p>
              <p className="text-green-700 text-xs mt-1">
                {t("freeRenewalDesc") || "Vaš oglas će biti besplatno obnovljen"}
              </p>
            </div>
          </div>
        )}

        {/* Package selection */}
        {!isFreeAdListing && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Package className="size-4" />
                {t("selectPackage") || "Odaberi paket"}
              </label>
              
              <Select
                value={RenewId}
                onValueChange={(value) => setRenewId(value)}
                disabled={isLoadingPackages || isRenewingAd}
              >
                <SelectTrigger className="outline-none">
                  <SelectValue 
                    placeholder={
                      isLoadingPackages 
                        ? t("loading") || "Učitavanje..." 
                        : t("selectPackage") || "Odaberi paket"
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width]">
                  {ItemPackages.map((item) => (
                    <SelectItem 
                      value={item?.id} 
                      key={item?.id}
                      disabled={!item?.is_active}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium">
                          {item?.translated_name || item?.name}
                        </span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">
                            {item.duration} {t("days") || "dana"}
                          </span>
                          {item?.is_active && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                              {t("active") || "Aktivan"}
                            </span>
                          )}
                          {!item?.is_active && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {t("inactive") || "Neaktivan"}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected package info */}
            {selectedPackage && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      {selectedPackage?.translated_name || selectedPackage?.name}
                    </p>
                    <p className="text-blue-700 text-xs mt-1">
                      {t("adWillBeActiveFor") || "Oglas će biti aktivan"} {selectedPackage.duration} {t("days") || "dana"}
                    </p>
                    {!selectedPackage?.is_active && (
                      <p className="text-orange-600 text-xs mt-2 font-medium">
                        ⚠️ {t("packageNotActive") || "Ovaj paket nije aktivan. Potrebno je kupiti paket."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No packages warning */}
            {!isLoadingPackages && ItemPackages.length === 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-900">
                      {t("noPackagesAvailable") || "Nema dostupnih paketa"}
                    </p>
                    <p className="text-orange-700 text-xs mt-1">
                      {t("contactSupport") || "Molimo kontaktirajte podršku"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Renew button */}
        <button
          className="bg-primary hover:bg-primary/90 text-white font-medium w-full p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          onClick={handleRenewItem}
          disabled={
            isRenewingAd || 
            isLoadingPackages || 
            (!isFreeAdListing && ItemPackages.length === 0) ||
            (!isFreeAdListing && !RenewId)
          }
        >
          {isRenewingAd ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              {t("renewing") || "Obnavljanje..."}
            </>
          ) : (
            <>
              <RefreshCw className="size-4" />
              {t("renew") || "Obnovi oglas"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RenewAd;
