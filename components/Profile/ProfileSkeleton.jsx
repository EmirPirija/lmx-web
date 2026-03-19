"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProfileSkeleton — prati tačnu strukturu Profile.jsx:
 *  - Header kard: avatar | ime + email + dugme | linkovi
 *  - Donji pojasevi sa javnim profilom
 *  - Dvije kolone: osnovi podaci + kontakt | notifikacije + verifikacija
 */
const ProfileSkeleton = () => (
  <div className="mx-auto max-w-5xl space-y-6">
    {/* ── Header kard ─────────────────────────────────────── */}
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 dark:border-slate-700 dark:bg-slate-900/90">
      <div className="p-5 sm:p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* avatar + ime */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-2xl flex-shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-6 w-40 rounded-xl" />
              <Skeleton className="h-4 w-52 rounded-lg" />
              <Skeleton className="h-7 w-32 rounded-xl" />
            </div>
          </div>
          {/* akcijska dugmad */}
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto">
            <Skeleton className="h-9 w-full lg:w-36 rounded-xl" />
            <Skeleton className="h-9 w-full lg:w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {/* javni profil pojas */}
      <div className="border-t border-slate-200/70 bg-slate-50/70 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/40 sm:px-6 lg:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48 rounded-lg" />
            <Skeleton className="h-3 w-64 rounded-md" />
          </div>
          <Skeleton className="h-8 w-28 rounded-xl" />
        </div>
      </div>
    </div>

    {/* ── Dvije kolone ────────────────────────────────────── */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Lijeva kolona: osnovi podaci + kontakt */}
      <div className="space-y-6">
        {/* Osnovi podaci */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 dark:border-slate-700 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-36 rounded-lg" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Kontakt */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 dark:border-slate-700 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Lokacija */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 dark:border-slate-700 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-24 rounded-lg" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>

      {/* Desna kolona: notifikacije + verifikacija */}
      <div className="space-y-6">
        {/* Notifikacije */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 dark:border-slate-700 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-3 w-56 rounded-md" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        </div>

        {/* Verifikacija */}
        <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 dark:border-slate-700 dark:bg-slate-900/90 space-y-4">
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

export default ProfileSkeleton;
