"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { membershipApi } from "@/utils/api";
import {
  setUserMembership,
  setUserMembershipLoading,
} from "@/redux/reducer/membershipSlice";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Crown, Store } from "lucide-react";
import { t } from "@/utils";
import { toast } from "sonner";
import Checkauth from "@/HOC/Checkauth";

const MembershipManagePage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { data: membership, loading } = useSelector(
    (state) => state.Membership.userMembership
  );

  useEffect(() => {
    fetchMembership();
  }, []);

  const fetchMembership = async () => {
    dispatch(setUserMembershipLoading(true));
    try {
      const res = await membershipApi.getUserMembership();
      if (!res.data.error) {
        dispatch(setUserMembership(res.data.data));
      }
    } catch (error) {
      console.error("Error fetching membership:", error);
      toast.error(t("errorFetchingData"));
    }
  };

  const handleCancelMembership = async () => {
    if (!confirm(t("areYouSureYouWantToCancelMembership"))) {
      return;
    }

    try {
      const res = await membershipApi.cancelMembership();
      if (!res.data.error) {
        toast.success(t("membershipCancelledSuccessfully"));
        fetchMembership();
      } else {
        toast.error(res.data.message || t("cancelFailed"));
      }
    } catch (error) {
      console.error("Error cancelling membership:", error);
      toast.error(t("errorCancellingMembership"));
    }
  };

  const tierConfig = {
    pro: { icon: Crown, gradient: "from-amber-400 to-yellow-600", name: "LMX Pro" },
    shop: { icon: Store, gradient: "from-blue-500 to-indigo-600", name: "LMX Shop" },
  };

  const config = tierConfig[membership?.tier?.toLowerCase()] || tierConfig.pro;
  const Icon = config.icon;

  return (
    <Layout>
      <BreadCrumb title2={t("manageMembership")} />
      
      <div className="container mt-8 mb-12">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft size={18} className="mr-2" />
          {t("back")}
        </Button>

        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-8 text-white shadow-xl`}>
              <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Icon size={32} />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">{t("currentPlan")}</p>
                    <h2 className="text-3xl font-bold">{config.name}</h2>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="opacity-90">{t("status")}:</span>
                    <span className="font-semibold capitalize">{membership?.status || 'Active'}</span>
                  </div>
                  
                  {membership?.started_at && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">{t("startedOn")}:</span>
                      <span className="font-semibold">
                        {new Date(membership.started_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {membership?.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="opacity-90">{t("expiresOn")}:</span>
                      <span className="font-semibold">
                        {new Date(membership.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                    onClick={() => router.push("/membership/upgrade")}
                  >
                    {t("changePlan")}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/30 text-white hover:bg-red-500/50"
                    onClick={handleCancelMembership}
                  >
                    {t("cancelMembership")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(MembershipManagePage);
