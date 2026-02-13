"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, CreditCard, RefreshCcw } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import Checkauth from "@/HOC/Checkauth";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import MembershipTierSelector from "@/components/PagesComponent/Membership/MembershipTierSelector";
import { Button } from "@/components/ui/button";
import { membershipApi } from "@/utils/api";
import {
  setUserMembership,
  setMembershipTiers,
  setMembershipTiersError,
  setMembershipTiersLoading,
} from "@/redux/reducer/membershipSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { extractApiData, resolveMembership, resolveMembershipActivity } from "@/lib/membership";
import { cn } from "@/lib/utils";
import { getRealMembershipBenefits } from "@/lib/membershipBenefits";

const PAYMENT_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "bank_transfer", label: "Bankovni prijenos" },
  { value: "paypal", label: "PayPal" },
];
const ACTIVE_PLAN_BLOCK_MESSAGE =
  "Imaš aktivno članstvo. Prije nove kupovine otkaži trenutno članstvo ili sačekaj njegov istek.";

const MembershipUpgradePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const userData = useSelector(userSignUpData);

  const tierParam = searchParams.get("tier");
  const { data: tierState, loading } = useSelector((state) => state.Membership.membershipTiers);
  const cachedMembership = useSelector((state) => state.Membership.userMembership?.data);
  const tiers = useMemo(() => (Array.isArray(tierState) ? tierState : []), [tierState]);

  const [selectedTier, setSelectedTier] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [isMembershipResolving, setIsMembershipResolving] = useState(true);

  const hasFetchedTiers = useRef(false);

  const fetchTiers = useCallback(async () => {
    dispatch(setMembershipTiersLoading(true));
    dispatch(setMembershipTiersError(null));

    try {
      const tiersRes = await membershipApi.getMembershipTiers();
      const payload = extractApiData(tiersRes);
      dispatch(setMembershipTiers(Array.isArray(payload) ? payload : []));
    } catch (error) {
      console.error("Greška pri učitavanju planova članstva:", error);
      dispatch(setMembershipTiersError("Greška pri učitavanju planova"));
      toast.error("Greška pri učitavanju planova.");
    } finally {
      dispatch(setMembershipTiersLoading(false));
    }
  }, [dispatch]);

  const fetchCurrentMembership = useCallback(async () => {
    setIsMembershipResolving(true);
    try {
      const membershipRes = await membershipApi.getUserMembership();
      const membershipPayload = extractApiData(membershipRes);
      const normalizedMembership = membershipPayload && typeof membershipPayload === "object"
        ? membershipPayload
        : null;

      setCurrentMembership(normalizedMembership);
      dispatch(setUserMembership(normalizedMembership));
    } catch (error) {
      console.error("Greška pri učitavanju trenutnog članstva:", error);
    } finally {
      setIsMembershipResolving(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (hasFetchedTiers.current || tiers.length > 0 || loading) return;
    hasFetchedTiers.current = true;
    fetchTiers();
  }, [fetchTiers, tiers.length, loading]);

  useEffect(() => {
    fetchCurrentMembership();
  }, [fetchCurrentMembership]);

  useEffect(() => {
    if (!currentMembership && cachedMembership) {
      setCurrentMembership(cachedMembership);
      setIsMembershipResolving(false);
    }
  }, [cachedMembership, currentMembership]);

  useEffect(() => {
    if (tiers.length === 0) return;
    if (selectedTier) return;

    if (tierParam) {
      const normalizedParam = String(tierParam).trim().toLowerCase();
      const tierByParam = tiers.find((tier) => {
        const candidates = [
          tier?.slug,
          tier?.id,
          tier?.name,
          tier?.tier,
          tier?.tier_name,
        ]
          .map((value) => String(value ?? "").trim().toLowerCase())
          .filter(Boolean);

        return candidates.some(
          (candidate) =>
            candidate === normalizedParam ||
            candidate.includes(normalizedParam) ||
            normalizedParam.includes(candidate)
        );
      });
      if (tierByParam) {
        setSelectedTier(tierByParam);
        return;
      }
    }

    setSelectedTier(tiers[0]);
  }, [tiers, tierParam, selectedTier]);

  const selectedTierBenefits = useMemo(() => {
    if (!selectedTier) return [];

    const realBenefits = getRealMembershipBenefits(selectedTier);
    if (realBenefits.length > 0) return realBenefits;

    if (Array.isArray(selectedTier?.features) && selectedTier.features.length > 0) {
      return selectedTier.features
        .map((feature) => {
          if (typeof feature === "string") return feature;
          if (feature && typeof feature === "object") {
            return feature.label || feature.name || feature.value || null;
          }
          return null;
        })
        .filter(Boolean);
    }

    if (selectedTier?.permissions && typeof selectedTier.permissions === "object") {
      return Object.entries(selectedTier.permissions)
        .filter(([, enabled]) => Boolean(enabled))
        .map(([key]) =>
          String(key)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        );
    }

    return [];
  }, [selectedTier]);

  const membershipResolverSources = useMemo(() => {
    if (currentMembership) {
      return [currentMembership, currentMembership?.membership].filter(Boolean);
    }
    if (cachedMembership) {
      return [cachedMembership, cachedMembership?.membership].filter(Boolean);
    }
    return [userData, userData?.membership].filter(Boolean);
  }, [cachedMembership, currentMembership, userData]);

  const resolvedMembership = useMemo(
    () => resolveMembership(...membershipResolverSources),
    [membershipResolverSources]
  );

  const normalizedCurrentTier = resolvedMembership?.tier || "free";
  const membershipActivity = useMemo(
    () =>
      resolveMembershipActivity(...membershipResolverSources),
    [membershipResolverSources]
  );

  const hasActivePaidPlan = useMemo(() => {
    if (!resolvedMembership?.isPremium) return false;
    return Boolean(membershipActivity?.isActive);
  }, [membershipActivity, resolvedMembership]);
  const isUpgradeLocked = hasActivePaidPlan && !isMembershipResolving;

  const activePlanExpiry = useMemo(
    () =>
      currentMembership?.expires_at ||
      currentMembership?.membership?.expires_at ||
      cachedMembership?.expires_at ||
      cachedMembership?.membership?.expires_at ||
      userData?.membership?.expires_at ||
      userData?.expires_at ||
      membershipActivity?.expiresAt ||
      null,
    [cachedMembership, currentMembership, membershipActivity?.expiresAt, userData]
  );

  const formatMembershipDate = (dateValue) => {
    if (!dateValue) return "Nije dostupno";
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return "Nije dostupno";
    return parsedDate.toLocaleDateString("bs-BA");
  };

  const handleUpgrade = async () => {
    if (isUpgradeLocked) {
      toast.info(ACTIVE_PLAN_BLOCK_MESSAGE);
      return;
    }

    if (!selectedTier?.id) {
      toast.error("Odaberi plan prije nastavka.");
      return;
    }

    try {
      const membershipRes = await membershipApi.getUserMembership();
      const latestMembership = extractApiData(membershipRes);
      const latestResolvedMembership = resolveMembership(latestMembership, latestMembership?.membership);
      const latestMembershipActivity = resolveMembershipActivity(
        latestMembership,
        latestMembership?.membership
      );

      if (latestResolvedMembership?.isPremium && latestMembershipActivity?.isActive) {
        const normalizedMembership = latestMembership && typeof latestMembership === "object"
          ? latestMembership
          : null;
        setCurrentMembership(normalizedMembership);
        dispatch(setUserMembership(normalizedMembership));
        toast.info(ACTIVE_PLAN_BLOCK_MESSAGE);
        return;
      }
    } catch (error) {
      console.error("Greška pri provjeri trenutnog članstva:", error);
    }

    setIsProcessing(true);
    try {
      const res = await membershipApi.upgradeMembership({
        tier_id: selectedTier.id,
        payment_method: paymentMethod,
      });

      if (res?.data?.error === false) {
        toast.success("Članstvo je uspješno nadograđeno.");
        router.push("/membership/manage");
        return;
      }

      toast.error(res?.data?.message || "Nadogradnja nije uspjela.");
    } catch (error) {
      console.error("Greška pri nadogradnji članstva:", error);
      toast.error("Greška pri nadogradnji članstva.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Layout>
      <BreadCrumb title2="Nadogradnja članstva" />

      <div className="container mb-12 mt-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 rounded-full">
          <ArrowLeft size={18} className="mr-2" />
          Nazad
        </Button>

        <div className="mx-auto max-w-6xl">
          <div className="mb-7 text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Odaberi plan članstva
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Odaberi LMX Pro ili LMX Shop plan i potvrdi nadogradnju.
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
            {isMembershipResolving ? (
              <p>Učitavanje statusa članstva...</p>
            ) : hasActivePaidPlan ? (
              <div className="space-y-1.5">
                <p>
                  Trenutno aktivno članstvo:{" "}
                  <strong>{normalizedCurrentTier === "shop" ? "LMX Shop" : "LMX Pro"}</strong>
                  {activePlanExpiry
                    ? ` (važi do ${formatMembershipDate(activePlanExpiry)})`
                    : ""}.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dok je članstvo aktivno, nova kupovina nije dostupna. Otkaži trenutno članstvo
                  ili sačekaj njegov istek.
                </p>
              </div>
            ) : (
              <p>Trenutno nemaš aktivan plaćeni plan.</p>
            )}
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : tiers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Trenutno nema dostupnih planova članstva.
              </p>
              <Button className="mt-4 rounded-full" variant="outline" onClick={fetchTiers}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Osvježi planove
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
              <div
                className={cn(
                  isUpgradeLocked && "pointer-events-none opacity-60 saturate-75"
                )}
                aria-disabled={isUpgradeLocked}
              >
                <MembershipTierSelector
                  tiers={tiers}
                  selectedTier={selectedTier}
                  onSelectTier={isUpgradeLocked ? () => {} : setSelectedTier}
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Potvrda nadogradnje
                </h2>

                {isUpgradeLocked ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-100">
                      Nadogradnja je zaključana dok je trenutno članstvo aktivno.
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        size="lg"
                        className="h-11 rounded-full"
                        onClick={() => router.push("/membership/manage")}
                      >
                        Upravljaj članstvom
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="h-11 rounded-full"
                        onClick={fetchCurrentMembership}
                      >
                        Osvježi status
                      </Button>
                    </div>
                  </div>
                ) : selectedTier ? (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Odabrani plan
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                        {selectedTier?.name}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        {selectedTier?.description || "Paket članstva"}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {selectedTier?.price ? `${selectedTier.price} EUR` : "0 EUR"} /{" "}
                        {selectedTier?.duration_days || 30} dana
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Stavke paketa: {selectedTierBenefits.length}
                      </p>
                      {selectedTierBenefits.length > 0 && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Stvarne pogodnosti u LMX-web
                          </p>
                          <ul className="space-y-1.5">
                            {selectedTierBenefits.slice(0, 4).map((benefit, index) => (
                              <li
                                key={`${selectedTier?.id}-benefit-${index}`}
                                className="text-xs text-slate-700 dark:text-slate-200"
                              >
                                - {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                          disabled={isUpgradeLocked}
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
                      disabled={!selectedTier || isProcessing || isUpgradeLocked}
                    >
                      {isProcessing ? "Obrada..." : "Nastavi na plaćanje"}
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
