"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Target, Sparkles } from "lucide-react";

import BadgeList from "@/components/PagesComponent/Gamification/BadgeList";
import UserLevel from "@/components/PagesComponent/Gamification/UserLevel";
import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";

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

const missionStatusClass = (status) => {
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (status === "in_progress") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
};

const missionStatusLabel = (status) => {
  if (status === "completed") return "Gotovo";
  if (status === "in_progress") return "U toku";
  return "Start";
};

const BadgesPage = () => {
  const dispatch = useDispatch();

  const { data: userBadges, loading: badgesLoading } = useSelector(
    (state) => state.Gamification.userBadges
  );
  const { data: allBadges, loading: allBadgesLoading } = useSelector(
    (state) => state.Gamification.allBadges
  );
  const { data: userPoints, loading: userPointsLoading } = useSelector(
    (state) => state.Gamification.userPoints
  );

  const [activeTab, setActiveTab] = useState("earned");
  const [query, setQuery] = useState("");
  const [showDescriptions, setShowDescriptions] = useState(false);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAllData = async () => {
    dispatch(setUserBadgesLoading(true));
    dispatch(setAllBadgesLoading(true));
    dispatch(setUserPointsLoading(true));
    setOverviewLoading(true);

    try {
      const [badgesRes, allBadgesRes, pointsRes, overviewRes] = await Promise.all([
        gamificationApi.getUserBadges(),
        gamificationApi.getAllBadges(),
        gamificationApi.getUserPoints(),
        gamificationApi.getOverview(),
      ]);

      const earned = badgesRes?.data?.data ?? { badges: [] };
      const all = allBadgesRes?.data?.data ?? [];
      const points = pointsRes?.data?.data ?? undefined;
      const overviewData = overviewRes?.data?.data ?? null;

      dispatch(setUserBadges(earned));
      dispatch(setAllBadges(all));
      dispatch(setUserPoints(points));
      setOverview(overviewData);
    } catch (e) {
      dispatch(setUserBadges({ badges: [] }));
      dispatch(setAllBadges([]));
      setOverview(null);
    } finally {
      dispatch(setUserBadgesLoading(false));
      dispatch(setAllBadgesLoading(false));
      dispatch(setUserPointsLoading(false));
      setOverviewLoading(false);
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
    return earnedBadges.filter((b) =>
      String(b?.name || b?.title || b?.slug || "").toLowerCase().includes(q)
    );
  }, [earnedBadges, query]);

  const filteredLocked = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lockedBadges;
    return lockedBadges.filter((b) =>
      String(b?.name || b?.title || b?.slug || "").toLowerCase().includes(q)
    );
  }, [lockedBadges, query]);

  const missions = overview?.missions || [];
  const ranks = overview?.ranks || {};
  const avatarOptions = overview?.avatar_options || [];

  return (
    <div className="space-y-6">
      <UserLevel userPoints={userPoints} showProgress={true} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Sedmicni rank" value={ranks?.weekly ? `#${ranks.weekly}` : "—"} sub="Pozicija ove sedmice" />
        <StatCard label="Mjesecni rank" value={ranks?.monthly ? `#${ranks.monthly}` : "—"} sub="Pozicija ovog mjeseca" />
        <StatCard label="All-time rank" value={ranks?.all_time ? `#${ranks.all_time}` : "—"} sub="Ukupni poredak" />
        <StatCard label="Streak" value={`${overview?.streak_days || 0} dana`} sub="Kontinuirana aktivnost" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">Postignuca</div>
          <div className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            Pregled zaradjenih i zakljucanih bedzeva. Pretraga radi po nazivu.
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pretrazi bedzeve..."
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
            {showDescriptions ? "Sakrij opise" : "Prikazi opise"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Zaradjeni bedzevi" value={earnedBadges.length} sub="Tvoja dostignuca do sada" />
        <StatCard label="Zakljucani bedzevi" value={lockedBadges.length} sub="Otkljucaj nastavkom aktivnosti" />
        <StatCard
          label="Ukupno bedzeva"
          value={Array.isArray(allBadges) ? allBadges.length : 0}
          sub={userPointsLoading ? "Ucitavam bodove..." : "Prati napredak kroz bodove i nivoe"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Target className="w-4 h-4 text-amber-500" />
            Aktivne misije
          </div>

          <div className="mt-3 space-y-2.5">
            {overviewLoading ? (
              <div className="text-sm text-slate-500 dark:text-slate-300">Ucitavam misije...</div>
            ) : missions.length ? (
              missions.slice(0, 4).map((mission) => (
                <div key={mission.id} className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{mission.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{mission.description}</p>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", missionStatusClass(mission.status))}>
                      {missionStatusLabel(mission.status)}
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-900 dark:bg-white"
                      style={{ width: `${Math.min(100, Number(mission.progress_percent || 0))}%` }}
                    />
                  </div>

                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-300">
                    {mission.progress}/{mission.target} • +{mission.reward_points} bodova
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500 dark:text-slate-300">Nema aktivnih misija.</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-violet-500" />
            Avatar opcije
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Biraj stil koji najbolje odgovara tvom profilu.</p>

          <div className="mt-3 grid grid-cols-8 gap-2">
            {avatarOptions.slice(0, 16).map((avatar) => (
              <div
                key={avatar.id}
                className={cn(
                  "h-10 w-10 rounded-xl border flex items-center justify-center",
                  avatar.is_premium
                    ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20"
                    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                )}
                title={avatar.label}
              >
                <LmxAvatarSvg avatarId={avatar.id} className="w-6 h-6" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100/70 dark:bg-slate-800/60 rounded-2xl p-1">
            <TabsTrigger value="earned" className="rounded-xl">
              Zaradjeni ({earnedBadges.length})
            </TabsTrigger>
            <TabsTrigger value="locked" className="rounded-xl">
              Zakljucani ({lockedBadges.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="mt-6">
            {badgesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded mt-3" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded mt-2 w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <BadgeList
                badges={filteredEarned}
                emptyMessage="Jos nemas zaradjenih bedzeva."
                size="lg"
                showDescription={showDescriptions}
              />
            )}
          </TabsContent>

          <TabsContent value="locked" className="mt-6">
            {allBadgesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4"
                  >
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
                emptyMessage="Sve si otkljucao. Svaka cast!"
                size="lg"
                showDescription={showDescriptions}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BadgesPage;
