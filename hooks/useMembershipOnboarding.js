"use client";

import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "@/components/Common/useNavigate";
import { toast } from "@/utils/toastBs";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { settingsData } from "@/redux/reducer/settingSlice";
import { runtimeConfigData } from "@/redux/reducer/runtimeConfigSlice";
import { resolveMembership } from "@/lib/membership";
import {
  isMembershipOnboardingEnabled,
} from "@/lib/backendControls";
import {
  getMembershipUpgradePath,
  normalizeMembershipTier,
  resolveMembershipOnboardingTarget,
  writeMembershipOnboardingIntent,
} from "@/lib/membershipOnboarding";

export const useMembershipOnboarding = () => {
  const { navigate } = useNavigate();
  const userData = useSelector(userSignUpData);
  const systemSettings = useSelector(settingsData);
  const runtimeConfig = useSelector(runtimeConfigData);
  const membershipData = useSelector(
    (state) => state?.Membership?.userMembership?.data || null,
  );

  const resolvedMembership = useMemo(
    () =>
      resolveMembership(userData, membershipData, membershipData?.membership),
    [membershipData, userData],
  );

  const isTierEnabled = useCallback(
    (tier) =>
      isMembershipOnboardingEnabled(tier, systemSettings, runtimeConfig),
    [runtimeConfig, systemSettings],
  );

  const getOnboardingHref = useCallback(
    (tier) => getMembershipUpgradePath(normalizeMembershipTier(tier)),
    [],
  );

  const startOnboarding = useCallback(
    (tier = "pro") => {
      const normalizedTier = normalizeMembershipTier(tier);

      if (!isTierEnabled(normalizedTier)) {
        toast.info(
          normalizedTier === "shop"
            ? "Aktivacija LMX Shop paketa je trenutno privremeno nedostupna."
            : "Aktivacija LMX Pro paketa je trenutno privremeno nedostupna.",
        );
        return { ok: false, reason: "disabled" };
      }

      if (!userData) {
        writeMembershipOnboardingIntent(normalizedTier);
        setIsLoginOpen(true);
        return { ok: false, reason: "auth_required" };
      }

      const target = resolveMembershipOnboardingTarget({
        requestedTier: normalizedTier,
        membership: resolvedMembership,
      });

      navigate(target);
      return { ok: true, target };
    },
    [isTierEnabled, navigate, resolvedMembership, userData],
  );

  return {
    startOnboarding,
    getOnboardingHref,
    isTierEnabled,
    membership: resolvedMembership,
  };
};

export default useMembershipOnboarding;
