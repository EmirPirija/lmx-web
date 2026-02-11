"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CreditCard, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import Checkauth from "@/HOC/Checkauth";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import MembershipTierSelector from "@/components/PagesComponent/Membership/MembershipTierSelector";
import { Button } from "@/components/ui/button";
import { t } from "@/utils";
import { membershipApi } from "@/utils/api";
import {
  setMembershipTiers,
  setMembershipTiersError,
  setMembershipTiersLoading,
} from "@/redux/reducer/membershipSlice";
import { cn } from "@/lib/utils";

const PAYMENT_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "paypal", label: "PayPal" },
];

const MembershipUpgradePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const tierParam = searchParams.get("tier");
  const { data: tierState, loading } = useSelector((state) => state.Membership.membershipTiers);
  const tiers = useMemo(() => (Array.isArray(tierState) ? tierState : []), [tierState]);

  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);

  const hasFetched = useRef(false);

  const fetchTiers = useCallback(async () => {
    dispatch(setMembershipTiersLoading(true));
    dispatch(setMembershipTiersError(null));

    try {
      const res = await membershipApi.getMembershipTiers();
      const payload = Array.isArray(res?.data?.data) ? res.data.data : [];
      dispatch(setMembershipTiers(payload));
    } catch (error) {
      console.error("Failed to fetch membership tiers:", error);
      dispatch(setMembershipTiersError("Failed to fetch membership tiers"));
      toast.error(t("errorFetchingData"));
    } finally {
      dispatch(setMembershipTiersLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    if (hasFetched.current || tiers.length > 0 || loading) return;
    hasFetched.current = true;
    fetchTiers();
  }, [fetchTiers, tiers.length, loading]);

  useEffect(() => {
    if (tiers.length === 0) return;
    if (selectedTier) return;

    if (tierParam) {
      const tierByParam = tiers.find((tier) => String(tier?.slug) === String(tierParam));
      if (tierByParam) {
        setSelectedTier(tierByParam);
        return;
      }
    }

    setSelectedTier(tiers[0]);
  }, [tiers, tierParam, selectedTier]);

  const selectedTierFeaturesCount = useMemo(() => {
    if (!selectedTier?.features || !Array.isArray(selectedTier.features)) return 0;
    return selectedTier.features.length;
  }, [selectedTier]);

  const handleUpgrade = async () => {
    if (!selectedTier?.id) {
      toast.error(t("pleaseSelectATier"));
      return;
    }

    setIsProcessing(true);
    try {
      const res = await membershipApi.upgradeMembership({
        tier_id: selectedTier.id,
        payment_method: paymentMethod,
      });

      if (res?.data?.error === false) {
        toast.success(t("membershipUpgradedSuccessfully"));
        router.push("/membership/manage");
        return;
      }

      toast.error(res?.data?.message || t("upgradeFailed"));
    } catch (error) {
      console.error("Error upgrading membership:", error);
      toast.error(t("errorUpgradingMembership"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <BreadCrumb title2={t("upgradeMembership")} />

      <div className="container mb-12 mt-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 rounded-full">
          <ArrowLeft size={18} className="mr-2" />
          {t("back")}
        </Button>

        <div className="mx-auto max-w-6xl">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t("chooseMembershipPlan")}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Odaberi Pro ili Shop plan i potvrdi nadogradnju.
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : tiers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Trenutno nema dostupnih membership planova.
              </p>
              <Button className="mt-4 rounded-full" variant="outline" onClick={fetchTiers}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Osvježi planove
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <MembershipTierSelector
                tiers={tiers}
                selectedTier={selectedTier}
                onSelectTier={setSelectedTier}
              />

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Potvrda nadogradnje
                </h2>

                {selectedTier ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Odabrani plan
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {selectedTier?.name}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {selectedTier?.description || "Membership plan"}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {selectedTier?.price ? `${selectedTier.price} EUR` : "0 EUR"} /{" "}
                        {selectedTier?.duration_days || 30} dana
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Features: {selectedTierFeaturesCount}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="membership-payment-method"
                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Način plaćanja
                      </label>
                      <div className="relative">
                        <CreditCard className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <select
                          id="membership-payment-method"
                          value={paymentMethod}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                          className={cn(
                            "h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-all",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-primary"
                          )}
                        >
                          {PAYMENT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="h-11 w-full rounded-full"
                      onClick={handleUpgrade}
                      disabled={!selectedTier || isProcessing}
                    >
                      {isProcessing ? t("processing") : t("proceedToPayment")}
                    </Button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                    Odaberi plan da bi nastavio.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(MembershipUpgradePage);
