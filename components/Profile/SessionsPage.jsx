"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { logoutSuccess } from "@/redux/reducer/authSlice";
import { sessionApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import FirebaseData from "@/utils/Firebase";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  LogOut,
  MapPin,
  Monitor,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "@/components/Common/UnifiedIconPack";

const formatDateTime = (value) => {
  if (!value) return "Nije dostupno";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Nije dostupno";
  return date.toLocaleString("bs-BA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPlatform = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "Nepoznato";
  if (normalized === "ios") return "iOS";
  if (normalized === "android") return "Android";
  if (normalized === "web") return "Web";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getDeviceIcon = (session) => {
  const type = String(session?.device_type || "").toLowerCase();
  const platform = String(session?.platform || "").toLowerCase();
  if (type === "mobile" || platform === "android" || platform === "ios") return Smartphone;
  return Monitor;
};

const isCurrentSession = (session, currentSessionId) => {
  return Boolean(session?.is_current) || Number(session?.id) === Number(currentSessionId);
};

function SessionCard({ session, currentSessionId }) {
  const DeviceIcon = getDeviceIcon(session);
  const current = isCurrentSession(session, currentSessionId);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <DeviceIcon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {session?.device_name || "Nepoznat uređaj"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platforma: {formatPlatform(session?.platform)} • {session?.browser || "Nepoznat preglednik"} •{" "}
                {session?.os || "Nepoznat OS"}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              Zadnja aktivnost: {formatDateTime(session?.last_active_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              IP: {session?.ip_address || "Nije dostupno"}
            </span>
          </div>
        </div>

        {current ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Trenutna sesija
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Aktivna
          </span>
        )}
      </div>
    </article>
  );
}

export default function SessionsPage() {
  const router = useRouter();
  const { signOut } = FirebaseData();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const fetchSessions = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) setRefreshing(true);
      else setLoading(true);

      const res = await sessionApi.getActiveSessions();
      const payload = res?.data?.data || {};
      const rows = Array.isArray(payload?.sessions) ? payload.sessions : [];

      setSessions(rows);
      setCurrentSessionId(payload?.current_session_id ?? null);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri učitavanju sesija.");
      setSessions([]);
      setCurrentSessionId(null);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const sessionCountText = useMemo(() => {
    const count = sessions.length;
    if (count === 1) return "1 aktivna sesija";
    if (count >= 2 && count <= 4) return `${count} aktivne sesije`;
    return `${count} aktivnih sesija`;
  }, [sessions.length]);

  const currentSession = useMemo(
    () => sessions.find((session) => isCurrentSession(session, currentSessionId)) || null,
    [sessions, currentSessionId]
  );

  const otherSessions = useMemo(
    () => sessions.filter((session) => !isCurrentSession(session, currentSessionId)),
    [sessions, currentSessionId]
  );

  const handleLogoutAllDevices = async () => {
    if (isLoggingOutAll) return;

    const shouldContinue = window.confirm(
      "Sigurno želite odjaviti sve uređaje? Ovo uključuje i trenutni uređaj."
    );
    if (!shouldContinue) return;

    setIsLoggingOutAll(true);
    try {
      const response = await sessionApi.logoutAllDevices({ keep_current: false });
      if (response?.data?.error) {
        toast.error(response?.data?.message || "Odjava sa uređaja nije uspjela.");
        return;
      }

      try {
        await signOut();
      } catch {
        // Firebase odjava je best-effort.
      }

      logoutSuccess();
      toast.success("Odjavljeni ste sa svih uređaja.");
      router.replace("/");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Greška pri odjavi sa svih uređaja.");
    } finally {
      setIsLoggingOutAll(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Uređaji i sesije</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pregledajte gdje je račun prijavljen i po potrebi odjavite sve uređaje.
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              {sessionCountText}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchSessions({ silent: true })}
              disabled={loading || refreshing || isLoggingOutAll}
              className="border-slate-200 dark:border-slate-700"
            >
              {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Osvježi
            </Button>
            <Button
              type="button"
              onClick={handleLogoutAllDevices}
              disabled={loading || isLoggingOutAll}
              className="bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
            >
              {isLoggingOutAll ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Odjavi sve uređaje
            </Button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((idx) => (
            <div
              key={`session-skeleton-${idx}`}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Trenutno nema aktivnih sesija za prikaz.
        </section>
      ) : (
        <div className="space-y-4">
          {currentSession ? (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Trenutno prijavljeni uređaj</h2>
              <SessionCard session={currentSession} currentSessionId={currentSessionId} />
            </section>
          ) : null}

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Svi prijavljeni uređaji</h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <SessionCard key={`session-${session?.id}`} session={session} currentSessionId={currentSessionId} />
              ))}
            </div>
          </section>

          {!otherSessions.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Nema drugih aktivnih uređaja osim trenutnog.
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
