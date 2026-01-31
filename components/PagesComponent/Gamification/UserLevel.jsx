"use client";

import React, { useMemo } from "react";

/**
 * UserLevel.jsx (BS ijekavica)
 * - neutral/premium, bez šarenila
 */

const DEFAULT_POINTS = {
  total_points: 0,
  level: 1,
  level_name: "Početnik",
  points_to_next_level: 100,
  current_level_points: 0,
};

function safeNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function formatInt(n) {
  try {
    return safeNumber(n).toLocaleString("bs-BA");
  } catch {
    return String(safeNumber(n));
  }
}

function deriveLevelName(level) {
  const l = safeNumber(level, 1);
  if (l >= 30) return "Legenda čaršije";
  if (l >= 20) return "Majstor trgovine";
  if (l >= 12) return "Iskusni prodavač";
  if (l >= 6) return "Aktivan član";
  return "Početnik";
}

export default function UserLevel({ userPoints, showProgress = true }) {
  const points = userPoints || DEFAULT_POINTS;

  const total = safeNumber(points.total_points);
  const level = safeNumber(points.level, 1);
  const next = safeNumber(points.points_to_next_level, 100);
  const cur = safeNumber(points.current_level_points, 0);

  const levelName = points.level_name || deriveLevelName(level);

  const progress = useMemo(() => {
    const denom = Math.max(1, next);
    return Math.min(100, Math.max(0, (cur / denom) * 100));
  }, [cur, next]);

  return (
    <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-300">Tvoj nivo</div>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">Nivo {level}</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{levelName}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-300">Bodovi</div>
          <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{formatInt(total)}</div>
        </div>
      </div>

      {showProgress ? (
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300">
            <span>Napredak do sljedećeg nivoa</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {formatInt(cur)} / {formatInt(next)}
            </span>
          </div>

          <div className="mt-2 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-900 dark:bg-white transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}