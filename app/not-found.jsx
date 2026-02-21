"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Layout from "@/components/Layout/Layout";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Compass,
  Home,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
} from "@/components/Common/UnifiedIconPack";

const QUICK_LINKS = [
  {
    href: "/ads",
    label: "Pregledaj oglase",
    description: "Pogledaj najnovije i aktivne oglase.",
    icon: Search,
  },
  {
    href: "/ad-listing",
    label: "Objavi oglas",
    description: "Dodaj oglas i poveži se s kupcima.",
    icon: Compass,
  },
  {
    href: "/map-search",
    label: "Pretraga na mapi",
    description: "Pronađi oglase po lokaciji.",
    icon: MapPin,
  },
  {
    href: "/contact-us",
    label: "Kontakt podrške",
    description: "Javi nam ako je link neispravan.",
    icon: RefreshCw,
  },
];

const NotFound = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const missingPath = useMemo(() => {
    if (!pathname) return "/";
    try {
      return decodeURIComponent(pathname);
    } catch {
      return pathname;
    }
  }, [pathname]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchValue.trim();
    if (!value) {
      router.push("/ads");
      return;
    }
    router.push(`/ads?query=${encodeURIComponent(value)}`);
  };

  return (
    <Layout>
      <section className="container py-8 lg:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_18px_45px_-28px_rgba(2,6,23,0.35)] dark:border-slate-700/60 dark:bg-slate-900/95 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-400/10" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-primary">
                <SearchX className="h-3.5 w-3.5" />
                Greška 404
              </span>

              <h1 className="mt-4 text-2xl font-black leading-tight text-slate-900 dark:text-white sm:text-3xl">
                Stranica nije pronađena
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
                Link je možda promijenjen, obrisan ili pogrešno unesen. Možeš se vratiti nazad, otvoriti početnu ili
                odmah pretražiti oglase.
              </p>

              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Tražena putanja:</span>
                <span className="truncate font-mono">{missingPath}</span>
              </div>

              <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Pretraži oglase..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
                <button
                  type="submit"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                  Pretraži
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Nazad
                </button>
                <Link
                  href="/"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Home className="h-4 w-4" />
                  Početna
                </Link>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                    isRefreshing && "pointer-events-none opacity-60"
                  )}
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                  Osvježi
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-slate-200/80 bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
