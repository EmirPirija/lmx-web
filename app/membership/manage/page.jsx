"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Crown,
  RefreshCcw,
  Store,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Checkauth from "@/HOC/Checkauth";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { Button } from "@/components/ui/button";
import { membershipApi } from "@/utils/api";
import {
  setUserMembership,
  setUserMembershipError,
  setUserMembershipLoading,
} from "@/redux/reducer/membershipSlice";
import { cn } from "@/lib/utils";

const TIER_THEME = {
  free: {
    icon: CheckCircle2,
    gradient: "from-slate-600 via-slate-700 to-slate-800",
    label: "Besplatni plan",
  },
  pro: {
    icon: Crown,
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    label: "LMX Pro",
  },
  shop: {
    icon: Store,
    gradient: "from-sky-500 via-blue-600 to-indigo-600",
    label: "LMX Shop",
  },
};

const formatMembershipDate = (dateValue) => {
  if (!dateValue) return "Nije dostupno";
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "Nije dostupno";
  return parsedDate.toLocaleDateString("bs-BA");
};

const MembershipManagePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: membership, loading } = useSelector((state) => state.Membership.userMembership);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchMembership = useCallback(async () => {
    dispatch(setUserMembershipLoading(true));
    dispatch(setUserMembershipError(null));
    try {
      const res = await membershipApi.getUserMembership();
      dispatch(setUserMembership(res?.data?.data || null));
    } catch (error) {
      console.error("Error fetching membership:", error);
      dispatch(setUserMembershipError("Greška pri učitavanju članstva"));
      toast.error("Greška pri učitavanju članstva.");
    } finally {
      dispatch(setUserMembershipLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const normalizedTier = useMemo(() => {
    const apiTier = String(membership?.tier || "free").toLowerCase();
    if (apiTier.includes("shop")) return "shop";
    if (apiTier.includes("pro")) return "pro";
    return "free";
  }, [membership]);

  const theme = TIER_THEME[normalizedTier] || TIER_THEME.free;
  const Icon = theme.icon;

  const isFreePlan = normalizedTier === "free";
  const membershipLabel = theme.label;
  const membershipStatus = String(membership?.status || "active");
  const isActive = membership?.is_active ?? membershipStatus === "active";
  const membershipStatusLabel = isActive
    ? "Aktivan"
    : membershipStatus.includes("cancel")
    ? "Otkazan"
    : membershipStatus.includes("expire")
    ? "Istekao"
    : membershipStatus.includes("pend")
    ? "Na čekanju"
    : "Neaktivan";

  const handleCancelMembership = async () => {
    if (isFreePlan) {
      toast.info("Trenutno koristiš besplatni plan.");
      return;
    }

    const confirmed = window.confirm("Da li sigurno želiš otkazati aktivni plan?");
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const res = await membershipApi.cancelMembership();
      if (res?.data?.error === false) {
        toast.success("Članstvo je uspješno otkazano.");
        await fetchMembership();
        return;
      }
      toast.error(res?.data?.message || "Otkazivanje plana nije uspjelo.");
    } catch (error) {
      console.error("Error cancelling membership:", error);
      toast.error("Greška pri otkazivanju plana.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Layout>
      <BreadCrumb title2="Upravljanje članstvom" />

      <div className="container mb-12 mt-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 rounded-full">
          <ArrowLeft size={18} className="mr-2" />
          Nazad
        </Button>

        <div className="mx-auto max-w-3xl">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl bg-gradient-to-br p-7 text-white shadow-lg",
                  theme.gradient
                )}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                <div className="relative z-10">
                  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                        <Icon className="h-7 w-7" />
                      </span>
                      <div>
                        <p className="text-sm text-white/85">Trenutni plan</p>
                        <h2 className="text-3xl font-bold">{membershipLabel}</h2>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                        isActive ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/20 text-red-100"
                      )}
                    >
                      {membershipStatusLabel}
                    </span>
                  </div>

                  <div className="grid gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/75">Aktiviran</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatMembershipDate(membership?.started_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/75">Ističe</p>
                      <p className="mt-1 text-sm font-semibold">
                        {membership?.expires_at ? formatMembershipDate(membership?.expires_at) : "Bez isteka"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Akcije</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={fetchMembership}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Osvježi
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    className="h-11 rounded-full"
                    onClick={() => router.push("/membership/upgrade")}
                  >
                    {isFreePlan ? "Aktiviraj plan" : "Promijeni plan"}
                  </Button>

                  <Button
                    variant="outline"
                    className="h-11 rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-400/40 dark:text-red-300 dark:hover:bg-red-500/10"
                    onClick={handleCancelMembership}
                    disabled={isFreePlan || isCancelling}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {isFreePlan ? "Nema plana za otkazivanje" : "Otkaži plan"}
                  </Button>
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                  {isActive && !isFreePlan
                    ? "Tvoj plan je trenutno aktivan."
                    : isFreePlan
                    ? "Trenutno koristiš besplatni plan."
                    : "Plan trenutno nije aktivan."}
                </div>
              </div>

              {membership?.expires_at ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <CalendarClock className="mt-0.5 h-5 w-5 text-primary" />
                    <p className="text-sm">
                      Plan ističe <strong>{formatMembershipDate(membership.expires_at)}</strong>. Nadogradi
                      ili promijeni plan prije isteka da zadržiš sve pogodnosti.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(MembershipManagePage);
