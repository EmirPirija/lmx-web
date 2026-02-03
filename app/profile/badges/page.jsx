"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";

import ProfileLayout from "@/components/Profile/ProfileLayout";
import BadgeList from "@/components/PagesComponent/Gamification/BadgeList";
import UserLevel from "@/components/PagesComponent/Gamification/UserLevel";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Checkauth from "@/HOC/Checkauth";
import { gamificationApi } from "@/utils/api";
import {
  setUserBadges,
  setUserBadgesLoading,
  setAllBadges,
  setAllBadgesLoading,
  setUserPoints,
  setUserPointsLoading,
} from "@/redux/reducer/gamificationSlice";
import { cn } from "@/lib/utils";

import {
  Award,
  Lock,
  Unlock,
  Search,
  Eye,
  EyeOff,
  Trophy,
  Target,
  Zap,
  Loader2,
} from "lucide-react";

// ============================================
// COMPONENTS
// ============================================

function StatCard({ icon: Icon, label, value, sublabel, color }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-lg border border-slate-200/50 dark:border-slate-700/50"
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-20", `bg-gradient-to-br ${color}`)} />
      <div className="relative z-10">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg", `bg-gradient-to-br ${color}`)}>
          <Icon size={28} className="text-white" />
        </div>
        <div className="text-4xl font-black text-slate-900 dark:text-white">{value}</div>
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">{label}</div>
        {sublabel && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</div>}
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const BadgesPage = () => {
  const dispatch = useDispatch();

  const { data: userBadges, loading: badgesLoading } = useSelector((state) => state.Gamification.userBadges);
  const { data: allBadges, loading: allBadgesLoading } = useSelector((state) => state.Gamification.allBadges);
  const { data: userPoints, loading: userPointsLoading } = useSelector((state) => state.Gamification.userPoints);

  const [activeTab, setActiveTab] = useState("earned");
  const [query, setQuery] = useState("");
  const [showDescriptions, setShowDescriptions] = useState(false);

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

      const earned = badgesRes?.data?.data ?? { badges: [] };
      const all = allBadgesRes?.data?.data ?? [];
      const points = pointsRes?.data?.data ?? undefined;

      dispatch(setUserBadges(earned));
      dispatch(setAllBadges(all));
      dispatch(setUserPoints(points));
    } catch (e) {
      dispatch(setUserBadges({ badges: [] }));
      dispatch(setAllBadges([]));
    } finally {
      dispatch(setUserBadgesLoading(false));
      dispatch(setAllBadgesLoading(false));
      dispatch(setUserPointsLoading(false));
    }
  };

  const earnedBadges = userBadges?.badges || [];
  const earnedBadgeIds = useMemo(() => earnedBadges.map((b) => b.id), [earnedBadges]);

  const lockedBadges = useMemo(() => {
    const all = Array.isArray(allBadges) ? allBadges : [];
    if (!all.length) return [];
    return all.filter((b) => !earnedBadgeIds.includes(b.id));
  }, [allBadges, earnedBadgeIds]);

  const filteredEarned = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return earnedBadges;
    return earnedBadges.filter((b) => String(b?.name || b?.title || b?.slug || "").toLowerCase().includes(q));
  }, [earnedBadges, query]);

  const filteredLocked = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lockedBadges;
    return lockedBadges.filter((b) => String(b?.name || b?.title || b?.slug || "").toLowerCase().includes(q));
  }, [lockedBadges, query]);

  return (
    <ProfileLayout title="Moji bedževi" subtitle="Pregled zarađenih postignuća i napretka">
      <div className="space-y-8">
        {/* User Level */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <UserLevel userPoints={userPoints} showProgress={true} />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Unlock}
            label="Zarađeni bedževi"
            value={earnedBadges.length}
            sublabel="Tvoja dostignuća"
            color="from-green-500 to-emerald-600"
          />
          <StatCard
            icon={Lock}
            label="Zaključani bedževi"
            value={lockedBadges.length}
            sublabel="Otključaj nastavkom aktivnosti"
            color="from-slate-500 to-slate-700"
          />
          <StatCard
            icon={Trophy}
            label="Ukupno bedževa"
            value={Array.isArray(allBadges) ? allBadges.length : 0}
            sublabel="Svi dostupni bedževi"
            color="from-amber-500 to-orange-600"
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretraži bedževe..."
              className="h-12 pl-11 rounded-2xl border-2"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowDescriptions((v) => !v)}
            className="h-12 gap-2 rounded-2xl border-2"
          >
            {showDescriptions ? <EyeOff size={18} /> : <Eye size={18} />}
            {showDescriptions ? "Sakrij opise" : "Prikaži opise"}
          </Button>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 dark:bg-slate-700 rounded-2xl p-1 mb-6">
              <TabsTrigger value="earned" className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
                <Unlock size={16} />
                Zarađeni ({earnedBadges.length})
              </TabsTrigger>
              <TabsTrigger value="locked" className="rounded-xl gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-500 data-[state=active]:to-slate-700 data-[state=active]:text-white">
                <Lock size={16} />
                Zaključani ({lockedBadges.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="earned">
              {badgesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl">
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-2xl mx-auto" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mt-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <BadgeList
                  badges={filteredEarned}
                  emptyMessage="Još nemaš zarađenih bedževa."
                  size="lg"
                  showDescription={showDescriptions}
                />
              )}
            </TabsContent>

            <TabsContent value="locked">
              {allBadgesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="animate-pulse p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl">
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-600 rounded-2xl mx-auto" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded mt-3" />
                    </div>
                  ))}
                </div>
              ) : (
                <BadgeList
                  badges={filteredLocked}
                  locked
                  emptyMessage="Sve si otključao. Svaka čast!"
                  size="lg"
                  showDescription={showDescriptions}
                />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </ProfileLayout>
  );
};

export default Checkauth(BadgesPage);
