"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { gamificationApi } from "@/utils/api";
import {
  setUserBadges,
  setUserBadgesLoading,
  setUserBadgesError,
  setAllBadges,
  setAllBadgesLoading,
  setUserPoints,
  setUserPointsLoading,
} from "@/redux/reducer/gamificationSlice";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import ProfileNavigation from "@/components/Profile/ProfileNavigation";
import BadgeList from "@/components/PagesComponent/Gamification/BadgeList";
import UserLevel from "@/components/PagesComponent/Gamification/UserLevel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Lock, Award } from "lucide-react";
import { t } from "@/utils";
import { toast } from "sonner";
import Checkauth from "@/HOC/Checkauth";

const BadgesPage = () => {
  const dispatch = useDispatch();
  const { data: userBadges, loading: badgesLoading } = useSelector(
    (state) => state.Gamification.userBadges
  );
  const { data: allBadges, loading: allBadgesLoading } = useSelector(
    (state) => state.Gamification.allBadges
  );
  const { data: userPoints } = useSelector((state) => state.Gamification.userPoints);

  const [activeTab, setActiveTab] = useState("earned");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    dispatch(setUserBadgesLoading(true));
    dispatch(setAllBadgesLoading(true));
    dispatch(setUserPointsLoading(true));

    try {
      const [badgesRes, allBadgesRes, pointsRes] = await Promise.all([
        gamificationApi.getUserBadges(),
        gamificationApi.getAllBadges(),
        gamificationApi.getUserPoints(),
      ]);

      if (!badgesRes.data.error) {
        dispatch(setUserBadges(badgesRes.data.data));
      }

      if (!allBadgesRes.data.error) {
        dispatch(setAllBadges(allBadgesRes.data.data));
      }

      if (!pointsRes.data.error) {
        dispatch(setUserPoints(pointsRes.data.data));
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast.error(t("errorFetchingData"));
      dispatch(setUserBadgesError(error.message));
    }
  };

  const earnedBadges = userBadges?.badges || [];
  const earnedBadgeIds = earnedBadges.map((b) => b.id);
  const lockedBadges =
    allBadges?.filter((badge) => !earnedBadgeIds.includes(badge.id)) || [];

  return (
    <Layout>
      <BreadCrumb title2={t("myBadges")} />
      
      <div className="container mt-8">
        <ProfileNavigation />

        <div className="mt-8 space-y-6">
          {/* User Level Card */}
          <UserLevel userPoints={userPoints} showProgress={true} />

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Trophy className="text-yellow-600 dark:text-yellow-400" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {earnedBadges.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t("earnedBadges")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <Lock className="text-gray-600 dark:text-gray-400" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {lockedBadges.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t("lockedBadges")}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Award className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allBadges?.length || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t("totalBadges")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="earned">
                {t("earned")} ({earnedBadges.length})
              </TabsTrigger>
              <TabsTrigger value="locked">
                {t("locked")} ({lockedBadges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earned" className="mt-6">
              {badgesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <BadgeList
                  badges={earnedBadges}
                  emptyMessage={t("youHaventEarnedAnyBadgesYet")}
                  size="lg"
                />
              )}
            </TabsContent>

            <TabsContent value="locked" className="mt-6">
              {allBadgesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <BadgeList
                  badges={lockedBadges}
                  emptyMessage={t("allBadgesUnlocked")}
                  size="lg"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Checkauth(BadgesPage);
