"use client";
import { Button } from "@/components/ui/button";
import ReusableAlertDialog from "@/components/Common/ReusableAlertDialog";
import { createFeaturedItemApi, getLimitsApi } from "@/utils/api";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "@/components/Common/useNavigate";
import { MdRocketLaunch } from "react-icons/md";

const MakeFeaturedAd = ({ item_id, setProductDetails }) => {
  const [isGettingLimits, setIsGettingLimits] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const { navigate } = useNavigate();

  const handleCreateFeaturedAd = async () => {
    try {
      setIsGettingLimits(true);
      const res = await getLimitsApi.getLimits({
        package_type: "advertisement",
      });

      if (res?.data?.error === false) {
        setModalConfig({
          title: "Istakni oglas",
          description: "Da li želite istaknuti ovaj oglas?",
          cancelText: "Odustani",
          confirmText: "Da",
          onConfirm: createFeaturedAd,
        });
      } else {
        setModalConfig({
          title: "Nemate pretplatu",
          description:
            "Za isticanje oglasa potrebno je imati aktivnu pretplatu.",
          cancelText: "Zatvori",
          confirmText: "Kupi pretplatu",
          onConfirm: () => navigate("/user-subscription"),
        });
      }

      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsGettingLimits(false);
    }
  };

  const createFeaturedAd = async () => {
    try {
      setIsConfirmLoading(true);
      const res = await createFeaturedItemApi.createFeaturedItem({
        item_id,
        positions: "home_screen",
      });

      if (res?.data?.error === false) {
        toast.success("Oglas je uspješno istaknut");
        setProductDetails((prev) => ({
          ...prev,
          is_feature: true,
        }));
        setIsModalOpen(false);
      } else {
        toast.error(res?.data?.message || "Greška pri isticanju");
      }
    } catch (error) {
      console.error(error);
      toast.error("Došlo je do greške");
    } finally {
      setIsConfirmLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Lijeva strana: ikona + tekst */}
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 shrink-0">
            <MdRocketLaunch className="text-2xl" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
              Istakni oglas
            </p>
            <p className="mt-1 text-sm sm:text-base font-semibold text-slate-900">
              Učinite svoj oglas vidljivijim i privucite više kupaca.
            </p>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              Istaknuti oglasi se prikazuju na boljim pozicijama i dobijaju
              više pregleda.
            </p>
          </div>
        </div>

        {/* Desna strana: dugme */}
        <div className="w-full sm:w-auto">
          <Button
            onClick={handleCreateFeaturedAd}
            disabled={isGettingLimits}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 sm:px-5 py-2.5 text-sm"
          >
            {isGettingLimits ? (
              <>
                <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                Provjeravam...
              </>
            ) : (
              <>
                <MdRocketLaunch className="text-lg" />
                <span>Istakni oglas</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <ReusableAlertDialog
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        cancelText={modalConfig.cancelText}
        confirmText={modalConfig.confirmText}
        confirmDisabled={isConfirmLoading}
      />
    </>
  );
};

export default MakeFeaturedAd;
