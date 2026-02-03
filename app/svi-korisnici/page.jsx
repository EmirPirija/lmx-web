"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";

import { t, updateMetadata } from "@/utils";
import { usersApi } from "@/utils/api";
import CustomImage from "@/components/Common/CustomImage";

const MEMBERSHIP_FILTERS = [
  { value: "all", label: "Svi korisnici" },
  { value: "shop", label: "Shop" },
  { value: "pro", label: "Pro" },
  { value: "regular", label: "Obični" },
];

const getMembershipTier = (user) => {
  const rawTier =
    user?.membership_tier ||
    user?.membership?.tier?.slug ||
    user?.membership?.tier ||
    user?.membership?.tier_name ||
    user?.membership?.plan ||
    user?.tier ||
    "free";
  return String(rawTier).toLowerCase();
};

const getUserName = (user) => {
  if (user?.name) return user.name;
  if (user?.full_name) return user.full_name;
  if (user?.username) return user.username;
  const first = user?.first_name || "";
  const last = user?.last_name || "";
  return `${first} ${last}`.trim() || "Nepoznat korisnik";
};

const getUserLocation = (user) => {
  const parts = [
    user?.city,
    user?.state,
    user?.country,
    user?.location,
  ].filter(Boolean);
  return parts.join(", ");
};

const getShopName = (user) =>
  user?.shop?.name ||
  user?.shop_name ||
  user?.store_name ||
  user?.company_name ||
  user?.business_name ||
  "";

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("bs-BA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getUsersList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.users)) return payload.data.data.users;
  return [];
};

const getPaginationMeta = (payload) => {
  if (!payload || Array.isArray(payload)) return null;
  return (
    payload?.pagination ||
    payload?.meta ||
    payload?.data?.pagination ||
    payload?.data?.meta ||
    payload
  );
};

const SviKorisniciPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    updateMetadata({
      title: "Svi korisnici - LMX",
      description: "Pregled svih korisnika koji su se prijavili na LMX.",
    });
  }, []);

  useEffect(() => {
    fetchUsers({ reset: true });
  }, []);

  const fetchUsers = async ({ reset } = {}) => {
    setLoading(true);
    try {
      const response = await usersApi.getAllUsers({
        page: reset ? 1 : page,
        per_page: 24,
      });
      const data = response?.data?.data || response?.data;
      const list = getUsersList(data);
      const meta = getPaginationMeta(data);
      const total = Number(meta?.total || meta?.total_count || meta?.count || list.length);
      const perPage = Number(meta?.per_page || meta?.perPage || meta?.limit || list.length);
      const currentPage = Number(meta?.current_page || meta?.page || (reset ? 1 : page));
      setHasMore(currentPage * perPage < total);
      setPage(currentPage);
      setUsers((prev) => (reset ? list : [...prev, ...list]));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("errorFetchingUsers") || "Greška pri učitavanju korisnika.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const membershipTier = getMembershipTier(user);
      const shopName = getShopName(user);
      const hasShop = Boolean(shopName) || membershipTier === "shop";
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "shop" && hasShop) ||
        (activeFilter === "pro" && membershipTier === "pro") ||
        (activeFilter === "regular" &&
          (membershipTier === "free" || membershipTier === "regular"));

      if (!matchesFilter) return false;

      if (!term) return true;
      const searchText = [
        getUserName(user),
        user?.email,
        user?.phone,
        shopName,
        getUserLocation(user),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchText.includes(term);
    });
  }, [users, searchTerm, activeFilter]);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/70">
      <div className="container mx-auto px-4 py-10">
        <section className="rounded-3xl border border-slate-200/60 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
                LMX zajednica
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
                Svi korisnici
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Pregled svih korisnika, shop profila i Pro članova. Filtriraj i
                pronađi tačno ono što ti treba.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {users.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                ukupno korisnika
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/90 px-4 py-2 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
              <User size={18} className="text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Pretraži po imenu, emailu, shopu..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {MEMBERSHIP_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeFilter === filter.value
                      ? "bg-primary text-white shadow"
                      : "border border-slate-200/70 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-200"
                  }`}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-2xl border border-slate-200/60 bg-white/80 dark:border-slate-800/80 dark:bg-slate-900/70"
                />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredUsers.map((user) => {
                  const membershipTier = getMembershipTier(user);
                  const shopName = getShopName(user);
                  const hasShop = Boolean(shopName) || membershipTier === "shop";
                  const location = getUserLocation(user);
                  const joinedAt = formatDate(user?.created_at || user?.joined_at);
                  const membershipLabel =
                    membershipTier === "shop"
                      ? "Shop"
                      : membershipTier === "pro"
                      ? "Pro"
                      : "Obični";

                  return (
                    <div
                      key={user?.id || user?.email || getUserName(user)}
                      className="group flex h-full flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-slate-200/70 bg-slate-100 dark:border-slate-800/80 dark:bg-slate-800">
                            <CustomImage
                              src={
                                user?.profile ||
                                user?.avatar ||
                                user?.image ||
                                user?.profile_image ||
                                "/assets/Transperant_Placeholder.png"
                              }
                              alt={getUserName(user)}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-white">
                              {getUserName(user)}
                            </p>
                            {joinedAt && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Pridružio se: {joinedAt}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                          {membershipLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {hasShop && (
                          <span className="flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
                            <BadgeCheck size={14} />
                            Shop profil
                          </span>
                        )}
                        {user?.verified && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                            Verifikovan
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                        {user?.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-slate-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        {user?.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                        {location && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-slate-400" />
                            <span className="truncate">{location}</span>
                          </div>
                        )}
                        {shopName && (
                          <div className="flex items-center gap-2">
                            <Store size={16} className="text-slate-400" />
                            <span className="truncate">{shopName}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-auto rounded-2xl border border-slate-200/70 bg-slate-50/80 px-3 py-2 text-xs text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400">
                        ID: {user?.id || "N/A"} · Tip: {membershipLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => fetchUsers({ reset: false })}
                    className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
                    type="button"
                  >
                    Učitaj još
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/80 p-10 text-center text-slate-500 dark:border-slate-800/80 dark:bg-slate-900/70 dark:text-slate-300">
              Trenutno nema korisnika za prikaz.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SviKorisniciPage;
