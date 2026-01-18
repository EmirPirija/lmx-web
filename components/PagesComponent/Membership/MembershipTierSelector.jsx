"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { membershipApi } from "@/utils/api";
import { setMembershipTiers, setMembershipTiersLoading } from "@/redux/reducer/membershipSlice";
import { Button } from "@/components/ui/button";
import { Crown, Store, Check } from "lucide-react";
import { toast } from "sonner";
import { t, formatPriceAbbreviated } from "@/utils";

const MembershipTierSelector = ({ onSelectTier }) => {
  const dispatch = useDispatch();
  const { data: tiers, loading } = useSelector((state) => state.Membership.membershipTiers);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    dispatch(setMembershipTiersLoading(true));
    try {
      const res = await membershipApi.getMembershipTiers();
      if (!res.data.error) {
        dispatch(setMembershipTiers(res.data.data));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("errorFetchingTiers"));
    }
  };

  const handleSelect = (tier) => {
    setSelectedTier(tier.id);
    onSelectTier?.(tier);
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    </div>;
  }

  const tierConfigs = {
    pro: {
      icon: Crown,
      gradient: "from-amber-400 to-yellow-600",
      hoverGradient: "hover:from-amber-500 hover:to-yellow-700",
      name: "LMX Pro",
      tagline: t("forPowerUsers"),
      features: [
        t("unlimitedListings"),
        t("priorityCustomerSupport"),
        t("advancedAnalytics"),
        t("proBadge"),
        t("highlightedListings"),
        t("noAds"),
      ],
    },
    shop: {
      icon: Store,
      gradient: "from-blue-500 to-indigo-600",
      hoverGradient: "hover:from-blue-600 hover:to-indigo-700",
      name: "LMX Shop",
      tagline: t("forBusinessOwners"),
      features: [
        t("allProFeatures"),
        t("businessProfile"),
        t("multipleLocations"),
        t("bulkUpload"),
        t("dedicatedAccountManager"),
        t("apiAccess"),
        t("customBranding"),
      ],
    },
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {tiers && tiers.map((tier) => {
        const config = tierConfigs[tier.slug?.toLowerCase()];
        if (!config) return null;

        const Icon = config.icon;
        const isSelected = selectedTier === tier.id;

        return (
          <div
            key={tier.id}
            className={`
              relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer
              ${isSelected 
                ? 'border-gray-900 dark:border-white shadow-2xl scale-105' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
            `}
            onClick={() => handleSelect(tier)}
          >
            {/* Header */}
            <div className={`bg-gradient-to-br ${config.gradient} p-6 text-white`}>
              <div className="flex items-center gap-3 mb-2">
                <Icon size={32} />
                <div>
                  <h3 className="text-2xl font-bold">{config.name}</h3>
                  <p className="text-sm opacity-90">{config.tagline}</p>
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatPriceAbbreviated(tier.price)}</span>
                <span className="text-sm opacity-80">/{tier.duration_days} {t("days")}</span>
              </div>
            </div>

            {/* Features */}
            <div className="p-6 bg-white dark:bg-gray-800">
              <ul className="space-y-3">
                {config.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full mt-6 bg-gradient-to-r ${config.gradient} ${config.hoverGradient} text-white border-0`}
                onClick={() => handleSelect(tier)}
              >
                {isSelected ? t("selected") : t("selectPlan")}
              </Button>
            </div>

            {/* Popular Badge (optional - za shop tier) */}
            {tier.slug === 'shop' && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                {t("popular")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MembershipTierSelector;
