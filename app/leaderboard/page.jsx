"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Trophy, Flame, Rocket, Medal, RefreshCw } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";

import Layout from "@/components/Layout/Layout";
import LeaderboardCard from "@/components/PagesComponent/Gamification/LeaderboardCard";
import { gamificationApi } from "@/utils/api";
import { updateMetadata } from "@/utils";
import {
  setLeaderboard,
  setLeaderboardLoading,
  setLeaderboardError,
  setLeaderboardFilter,
} from "@/redux/reducer/gamificationSlice";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "weekly", label: "Sedmično" },
  { value: "monthly", label: "Mjesečno" },
  { value: "all-time", label: "Ukupno" },
];

const HeroBadge = ({ icon: Icon, label, value, tone = "amber" }) => {
  const toneMap = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/60 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
        <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-lg", toneMap[tone])}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
};

export default function LeaderboardPage() {
  const dispatch = useDispatch();
  const leaderboardState = useSelector((state) => state.Gamification.leaderboard);
  const leaderboard = leaderboardState?.data;
  const loading = Boolean(leaderboardState?.loading);
  const error = leaderboardState?.error;
  const currentFilter = leaderboardState?.filter || "weekly";

  const [page, setPage] = useState(1);

  useEffect(() => {
    updateMetadata({
      title: "Ljestvica - LMX",
      description: "Najaktivniji korisnici platforme po bodovima i aktivnosti",
    });
  }, []);

  const fetchLeaderboard = async (period, pageNum) => {
    dispatch(setLeaderboardLoading(true));

    try {
      const response = await gamificationApi.getLeaderboard({
        period,
        page: pageNum,
        per_page: 20,
      });

      if (response?.data?.error) {
        dispatch(setLeaderboardError(response?.data?.message || "Greška"));
        toast.error(response?.data?.message || "Ne mogu učitati ljestvicu.");
        return;
      }

      dispatch(setLeaderboard(response?.data?.data || null));
    } catch (err) {
      console.error("Leaderboard fetch error", err);
      dispatch(setLeaderboardError("Ne mogu učitati ljestvicu."));
      toast.error("Ne mogu učitati ljestvicu.");
    }
  };

  useEffect(() => {
    fetchLeaderboard(currentFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilter, page]);

  const users = leaderboard?.users || [];

  const hero = useMemo(() => {
    return {
      totalUsers: leaderboard?.total || 0,
      topPoints: users[0]?.total_points || 0,
      topStreak: users[0]?.streak_days || 0,
    };
  }, [leaderboard, users]);

  const maxPage = Math.max(1, Number(leaderboard?.last_page || 1));

  const handleFilterChange = (newFilter) => {
    if (newFilter === currentFilter) return;
    dispatch(setLeaderboardFilter(newFilter));
    setPage(1);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-900 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <Trophy className="h-4 w-4 text-amber-500" />
            LMX ljestvica
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Najaktivniji korisnici platforme</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Prodaja, kupovina, reel performanse i momentum score na jednom mjestu.</p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HeroBadge icon={Medal} label="Broj rangiranih" value={hero.totalUsers.toLocaleString("bs-BA")} tone="amber" />
            <HeroBadge icon={Rocket} label="Najviše bodova" value={hero.topPoints.toLocaleString("bs-BA")} tone="sky" />
            <HeroBadge icon={Flame} label="Najduži niz" value={`${hero.topStreak} dana`} tone="rose" />
          </div>
        </motion.div>

        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => handleFilterChange(filter.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition",
                currentFilter === filter.value
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-900/20 p-4">
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>
              <button
                type="button"
                onClick={() => fetchLeaderboard(currentFilter, page)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-600 dark:text-rose-300"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Pokušaj ponovo
              </button>
            </div>
          ) : users.length ? (
            <div className="space-y-3">
              {users.map((user, index) => (
                <LeaderboardCard
                  key={user.id}
                  user={user}
                  rank={(page - 1) * (leaderboard?.per_page || 20) + index + 1}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-900/60 p-8 text-center text-sm text-slate-500 dark:text-slate-300">
              Nema podataka za izabrani period.
            </div>
          )}
        </div>

        {users.length > 0 && maxPage > 1 && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Nazad
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Stranica {page} / {maxPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(maxPage, prev + 1))}
              disabled={page >= maxPage}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              Naprijed
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
