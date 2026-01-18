"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { membershipApi } from "@/utils/api";
import {
  setMembershipTiers,
  setMembershipTiersLoading,
} from "@/redux/reducer/membershipSlice";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import MembershipTierSelector from "@/components/PagesComponent/Membership/MembershipTierSelector";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { t } from "@/utils";
import { toast } from "sonner";
import Checkauth from "@/HOC/Checkauth";

const MembershipUpgradePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  
  const tierParam = searchParams.get("tier");
  const { data: tiers, loading } = useSelector((state) => state.Membership.membershipTiers);
  
  const [selectedTier, setSelectedTier] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const hasFetched = useRef(false);

  console.log('🔍 RENDER:', { 
    hasFetched: hasFetched.current, 
    loading, 
    tiersCount: tiers?.length,
    selectedTier: selectedTier?.name 
  });

  useEffect(() => {
    console.log('⚡ useEffect CALLED', { 
      hasFetched: hasFetched.current, 
      loading, 
      hasTiers: !!tiers?.length 
    });

    if (hasFetched.current || loading || (tiers && tiers.length > 0)) {
      console.log('⏭️ SKIPPING fetch');
      return;
    }

    const fetchTiers = async () => {
      console.log('📡 FETCHING tiers...');
      hasFetched.current = true;
      dispatch(setMembershipTiersLoading(true));
      
      try {
        const res = await membershipApi.getMembershipTiers();
        console.log('✅ API Response:', res.data);
        
        if (!res.data.error) {
          dispatch(setMembershipTiers(res.data.data));
          console.log('✅ Tiers SET in Redux');
        } else {
          console.error('❌ API Error:', res.data.message);
          toast.error(res.data.message || t("errorFetchingData"));
        }
      } catch (error) {
        console.error('❌ Fetch Error:', error);
        toast.error(t("errorFetchingData"));
      } finally {
        dispatch(setMembershipTiersLoading(false));
        console.log('✅ Loading set to FALSE');
      }
    };

    fetchTiers();
  }, []);

  useEffect(() => {
    if (tiers && tiers.length > 0 && tierParam && !selectedTier) {
      const tier = tiers.find(t => t.slug === tierParam);
      if (tier) {
        console.log('✅ Auto-selecting tier:', tier.name);
        setSelectedTier(tier);
      }
    }
  }, [tiers, tierParam, selectedTier]);

  const handleUpgrade = async () => {
    if (!selectedTier) {
      toast.error(t("pleaseSelectATier"));
      return;
    }

    setIsProcessing(true);
    try {
      const res = await membershipApi.upgradeMembership({
        tier_id: selectedTier.id,
        payment_method: "stripe",
      });

      if (!res.data.error) {
        toast.success(t("membershipUpgradedSuccessfully"));
        router.push("/profile");
      } else {
        toast.error(res.data.message || t("upgradeFailed"));
      }
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
      
      <div className="container mt-8 mb-12">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          {t("back")}
        </Button>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("chooseMembershipPlan")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t("selectPlanThatFitsYourNeeds")}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <MembershipTierSelector
                tiers={tiers || []}
                selectedTier={selectedTier}
                onSelectTier={setSelectedTier}
              />

              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={handleUpgrade}
                  disabled={!selectedTier || isProcessing}
                  className="min-w-[200px]"
                >
                  {isProcessing ? t("processing") : t("proceedToPayment")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(MembershipUpgradePage);
