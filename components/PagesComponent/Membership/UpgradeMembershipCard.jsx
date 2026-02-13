"use client";
import React, { useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { membershipApi } from "@/utils/api";
import {
  setUserMembership,
  setUserMembershipLoading,
  setMembershipTiers,
  setMembershipTiersLoading,
} from "@/redux/reducer/membershipSlice";
import { Button } from "@/components/ui/button";
import { Crown, Store, Check, Sparkles, ArrowRight } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";
import { useRouter } from "next/navigation";
import { extractApiData, resolveMembership, resolveMembershipActivity } from "@/lib/membership";
import { getRealMembershipBenefits } from "@/lib/membershipBenefits";

const UpgradeMembershipCard = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: membership } = useSelector((state) => state.Membership.userMembership);

  useEffect(() => {
    fetchMembershipData();
  }, []);

  const fetchMembershipData = async () => {
    dispatch(setUserMembershipLoading(true));
    dispatch(setMembershipTiersLoading(true));

    try {
      const [membershipRes, tiersRes] = await Promise.all([
        membershipApi.getUserMembership(),
        membershipApi.getMembershipTiers(),
      ]);

      if (!membershipRes.data.error) {
        const membershipPayload = extractApiData(membershipRes);
        dispatch(
          setUserMembership(
            membershipPayload && typeof membershipPayload === "object"
              ? membershipPayload
              : null
          )
        );
      }

      if (!tiersRes.data.error) {
        const tiersPayload = extractApiData(tiersRes);
        dispatch(setMembershipTiers(Array.isArray(tiersPayload) ? tiersPayload : []));
      }
    } catch (error) {
      console.error("Greška pri učitavanju članstva:", error);
      toast.error("Greška pri dohvatanju podataka o članstvu.");
    } finally {
      dispatch(setUserMembershipLoading(false));
      dispatch(setMembershipTiersLoading(false));
    }
  };

  const handleUpgradeClick = (tier) => {
    router.push(`/membership/upgrade?tier=${tier.id}`);
  };

  const resolvedMembership = useMemo(
    () => resolveMembership(membership, membership?.membership),
    [membership]
  );

  const membershipActivity = useMemo(
    () => resolveMembershipActivity(membership, membership?.membership),
    [membership]
  );

  const hasActivePaidPlan = resolvedMembership.isPremium && membershipActivity.isActive;
  const normalizedTier = resolvedMembership?.tier || "free";
  const membershipExpiry =
    membership?.expires_at ||
    membership?.membership?.expires_at ||
    membershipActivity?.expiresAt ||
    null;
  const proBenefits = getRealMembershipBenefits("pro");
  const shopBenefits = getRealMembershipBenefits("shop", { includeProForShop: false });

  // Ako je aktivan Pro ili Shop, prikaži status
  if (hasActivePaidPlan) {
    const tierConfig = {
      pro: { icon: Crown, gradient: "from-amber-400 to-yellow-600", name: "LMX Pro" },
      shop: { icon: Store, gradient: "from-blue-500 to-indigo-600", name: "LMX Shop" },
    };

    const config = tierConfig[normalizedTier] || tierConfig.pro;
    const Icon = config.icon;

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-white shadow-xl`}>
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-full">
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm opacity-90">Trenutni plan</p>
              <h3 className="text-2xl font-bold">{config.name}</h3>
            </div>
          </div>

          {membershipExpiry && (
            <p className="text-sm opacity-80">
              Ističe: {new Date(membershipExpiry).toLocaleDateString("bs-BA")}
            </p>
          )}

          <Button
            variant="outline"
            className="mt-4 w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
            onClick={() => router.push("/membership/manage")}
          >
            Upravljaj članstvom
          </Button>
        </div>
      </div>
    );
  }

  // Free tier - prikaži upgrade opcije
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-purple-100 dark:border-gray-700">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Sparkles className="text-purple-600 dark:text-purple-400" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Nadogradi članstvo
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Otključaj ekskluzivne mogućnosti i premium pogodnosti
            </p>
          </div>
        </div>

        {/* Tier Options */}
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          {/* PRO Tier */}
          <div
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleUpgradeClick({ id: 'pro', name: 'Pro' })}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
            <div className="relative z-10">
              <Crown className="text-white mb-2" size={28} />
              <h4 className="text-white font-bold text-lg">LMX Pro</h4>
              <p className="text-amber-100 text-xs mt-1">Napredna analitika oglasa i premium alati profila</p>
              <div className="flex items-center gap-1 mt-3 text-white">
                <span className="text-sm">Saznaj više</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>

          {/* SHOP Tier */}
          <div
            className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleUpgradeClick({ id: 'shop', name: 'Shop' })}
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-20 w-20 rounded-full bg-white/10 blur-xl"></div>
            <div className="relative z-10">
              <Store className="text-white mb-2" size={28} />
              <h4 className="text-white font-bold text-lg">LMX Shop</h4>
              <p className="text-blue-100 text-xs mt-1">Zalihe, SKU, računi kupcima i shop analitika</p>
              <div className="flex items-center gap-1 mt-3 text-white">
                <span className="text-sm">Saznaj više</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Preview */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Stvarne pogodnosti u LMX-web:
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">LMX Pro</p>
            {proBenefits.slice(0, 3).map((benefit, idx) => (
              <div key={`pro-${idx}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-green-600 dark:text-green-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">LMX Shop (dodatno)</p>
            {shopBenefits.slice(0, 3).map((benefit, idx) => (
              <div key={`shop-${idx}`} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-green-600 dark:text-green-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMembershipCard;
