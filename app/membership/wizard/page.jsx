"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import Checkauth from "@/HOC/Checkauth";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
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
import { normalizeMembershipTier } from "@/lib/membershipOnboarding";
import MembershipWizard from "@/components/PagesComponent/Membership/MembershipWizard";

const MembershipWizardPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const userData = useSelector(userSignUpData);

  const tierParam = searchParams.get("tier");
  const tier = normalizeMembershipTier(tierParam, "shop");

  const { data: tierState, loading } = useSelector((state) => state.Membership.membershipTiers);
  const cachedMembership = useSelector((state) => state.Membership.userMembership?.data);
  const tiers = useMemo(() => (Array.isArray(tierState) ? tierState : []), [tierState]);

  const [currentMembership, setCurrentMembership] = useState(null);
  const [isMembershipResolving, setIsMembershipResolving] = useState(true);

  const hasFetchedTiers = useRef(false);
  const redirectHandledRef = useRef(false);

  const fetchTiers = useCallback(async () => {
    dispatch(setMembershipTiersLoading(true));
    dispatch(setMembershipTiersError(null));
    try {
      const res = await membershipApi.getMembershipTiers();
      const payload = extractApiData(res);
      dispatch(setMembershipTiers(Array.isArray(payload) ? payload : []));
    } catch {
      dispatch(setMembershipTiersError("Greška pri učitavanju planova"));
      toast.error("Greška pri učitavanju planova.");
    } finally {
      dispatch(setMembershipTiersLoading(false));
    }
  }, [dispatch]);

  const fetchCurrentMembership = useCallback(async () => {
    setIsMembershipResolving(true);
    try {
      const res = await membershipApi.getUserMembership();
      const payload = extractApiData(res);
      const normalized = payload && typeof payload === "object" ? payload : null;
      setCurrentMembership(normalized);
      dispatch(setUserMembership(normalized));
    } catch {
      // tiho
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

  // Preusmjeri ako već ima aktivan plan
  const membershipResolverSources = useMemo(() => {
    const sources = [currentMembership || cachedMembership || userData].filter(Boolean);
    return sources;
  }, [cachedMembership, currentMembership, userData]);

  const resolvedMembership = useMemo(
    () => resolveMembership(...membershipResolverSources),
    [membershipResolverSources]
  );

  const membershipActivity = useMemo(
    () => resolveMembershipActivity(...membershipResolverSources),
    [membershipResolverSources]
  );

  useEffect(() => {
    if (isMembershipResolving || redirectHandledRef.current) return;

    const hasActivePlan = resolvedMembership?.isPremium && membershipActivity?.isActive;
    if (!hasActivePlan) return;

    if (tier === "shop" && resolvedMembership.isShop) {
      redirectHandledRef.current = true;
      toast.info("LMX Shop je već aktivan na vašem računu.");
      router.replace("/profile/shop-ops");
      return;
    }

    if (tier === "pro" && resolvedMembership.isPremium) {
      redirectHandledRef.current = true;
      toast.info("Već imate aktivno premium članstvo.");
      router.replace("/membership/manage");
    }
  }, [isMembershipResolving, membershipActivity?.isActive, resolvedMembership, router, tier]);

  const tierLabel = tier === "shop" ? "LMX Shop" : "LMX Pro";

  return (
    <Layout>
      <BreadCrumb title2={`${tierLabel} onboarding`} />

      <div className="container mb-16 mt-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 rounded-full"
        >
          <ArrowLeft size={18} className="mr-2" />
          Nazad
        </Button>

        {loading && tiers.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="h-11 w-11 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <MembershipWizard
            tier={tier}
            tiers={tiers}
            currentMembership={currentMembership}
          />
        )}
      </div>
    </Layout>
  );
};

export default Checkauth(MembershipWizardPage);
