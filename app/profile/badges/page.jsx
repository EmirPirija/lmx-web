"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import BadgeList from "@/components/PagesComponent/Gamification/BadgeList";
import UserLevel from "@/components/PagesComponent/Gamification/UserLevel";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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

const StatCard = ({ label, value, sub }) => (
  <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
    <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">{label}</div>
    <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
    {sub ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{sub}</div> : null}
  </div>
);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // keep UI usable even if API fails
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
    <div className="space-y-6">
          {/* Level */}
          <UserLevel userPoints={userPoints} showProgress={true} />

          {/* Header controls */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">Postignuća</div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                Pregled zarađenih i zaključanih bedževa. Pretraga radi po nazivu.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pretraži bedževe…"
                className="h-11 w-full sm:w-[260px] rounded-2xl"
              />

              <button
                type="button"
                onClick={() => setShowDescriptions((v) => !v)}
                className={cn(
                  "h-11 px-4 rounded-2xl border font-semibold text-sm transition shadow-sm",
                  "border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/60",
                  "text-slate-800 dark:text-slate-100 hover:shadow-md"
                )}
              >
                {showDescriptions ? "Sakrij opise" : "Prikaži opise"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Zarađeni bedževi" value={earnedBadges.length} sub="Tvoja dostignuća do sada" />
            <StatCard label="Zaključani bedževi" value={lockedBadges.length} sub="Otključaj nastavkom aktivnosti" />
            <StatCard
              label="Ukupno bedževa"
              value={(Array.isArray(allBadges) ? allBadges.length : 0)}
              sub={userPointsLoading ? "Učitavam bodove…" : "Prati napredak kroz bodove i nivoe"}
            />
          </div>

          {/* Tabs */}
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100/70 dark:bg-slate-800/60 rounded-2xl p-1">
                <TabsTrigger value="earned" className="rounded-xl">
                  Zarađeni ({earnedBadges.length})
                </TabsTrigger>
                <TabsTrigger value="locked" className="rounded-xl">
                  Zaključani ({lockedBadges.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="earned" className="mt-6">
                {badgesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded mt-3" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded mt-2 w-3/4 mx-auto" />
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

              <TabsContent value="locked" className="mt-6">
                {allBadgesLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded mt-3" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded mt-2 w-3/4 mx-auto" />
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
          </div>
        </div>
    </div>
  );
};

export default BadgesPage;