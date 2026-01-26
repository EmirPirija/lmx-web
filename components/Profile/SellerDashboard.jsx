"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import CustomLink from "@/components/Common/CustomLink";
import { cn } from "@/lib/utils";

import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  membershipApi,
  getNotificationList,
  getMyItemsApi,
  getMyReviewsApi,
  sellerSettingsApi,
  chatListApi,
} from "@/utils/api";

import {
  FiPlusCircle,
  FiLayers,
  FiMessageSquare,
  FiSettings,
  FiTrendingUp,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiStar,
} from "react-icons/fi";

// ---------- helpers (robust za različite backend payload-e) ----------
const getApiData = (res) => res?.data?.data ?? null;

const extractList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const extractTotal = (payload) => {
  if (!payload) return 0;
  if (typeof payload?.total === "number") return payload.total;
  if (typeof payload?.meta?.total === "number") return payload.meta.total;
  if (typeof payload?.pagination?.total === "number") return payload.pagination.total;
  if (typeof payload?.meta?.pagination?.total === "number") return payload.meta.pagination.total;
  return 0;
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const toRating = (v) => {
  const n = toNum(v);
  return n === null ? "0.0" : n.toFixed(1);
};

// ---------- UI atoms ----------
function Card({ title, subtitle, right, children, className = "" }) {
  return (
    <div className={cn("bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden", className)}>
      {(title || subtitle || right) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone = "default" }) {
  const toneCls =
    tone === "good"
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : tone === "warn"
      ? "bg-amber-50 border-amber-200 text-amber-700"
      : tone === "bad"
      ? "bg-red-50 border-red-200 text-red-700"
      : "bg-slate-50 border-slate-200 text-slate-700";

  return (
    <div className={cn("rounded-2xl border p-4 flex items-start gap-3", toneCls)}>
      <div className="w-10 h-10 rounded-xl bg-white/70 border border-white/50 flex items-center justify-center shrink-0">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold opacity-80">{label}</div>
        <div className="text-2xl font-extrabold leading-tight mt-0.5">{value}</div>
        {hint && <div className="text-xs opacity-80 mt-1">{hint}</div>}
      </div>
    </div>
  );
}

function ActionButton({ href, icon: Icon, title, desc }) {
  return (
    <CustomLink
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors p-4 flex items-start gap-3"
    >
      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/10 flex items-center justify-center shrink-0 group-hover:scale-[1.02] transition-transform">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{desc}</div>
      </div>
    </CustomLink>
  );
}

function Progress({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
      <div className="h-full bg-primary rounded-full" style={{ width: `${v}%` }} />
    </div>
  );
}

function Pill({ children, tone = "default" }) {
  const cls =
    tone === "pro"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "shop"
      ? "bg-blue-50 text-blue-800 border-blue-200"
      : tone === "ok"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", cls)}>{children}</span>;
}

// ---------- main ----------
export default function SellerDashboard() {
  const userData = useSelector(userSignUpData);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    membershipTier: "free",
    activeAds: 0,
    totalViews: 0,
    unreadNotifications: 0,
    unreadMessages: 0,
    rating: "0.0",
  });

  const [seller, setSeller] = useState(null); // seller settings payload (dinamično)

  const fetchAll = useCallback(async () => {
    if (!userData) return;

    setLoading(true);

    try {
      const results = await Promise.allSettled([
        membershipApi.getUserMembership({}),
        getNotificationList.getNotification({ page: 1 }),
        getMyItemsApi.getMyItems({
          status: "approved",
          user_id: userData?.id,
          offset: 0,
          limit: 1,
        }),
        getMyReviewsApi.getMyReviews({ page: 1 }),
        sellerSettingsApi.getSettings(),
        Promise.all([
          chatListApi.chatList({ type: "buyer", page: 1 }),
          chatListApi.chatList({ type: "seller", page: 1 }),
        ]),
      ]);

      const [membershipRes, notifRes, adsRes, reviewsRes, sellerRes, chatRes] = results;

      // membership
      let membershipTier = String(userData?.membership_tier || "free").toLowerCase();
      if (membershipRes.status === "fulfilled") {
        const membershipData = getApiData(membershipRes.value);
        membershipTier = String(membershipData?.tier || membershipData?.membership_tier || membershipTier).toLowerCase();
      }

      // notifications
      let unreadNotifications = 0;
      if (notifRes.status === "fulfilled") {
        const payload = getApiData(notifRes.value);
        const list = extractList(payload);
        unreadNotifications = list.filter((n) => !n?.read_at && !n?.is_read).length;
      }

      // ads
      let activeAds = 0;
      if (adsRes.status === "fulfilled") {
        const payload = getApiData(adsRes.value);
        activeAds = extractTotal(payload) || payload?.total || 0;
      }

      // rating
      let ratingFromReviews = null;
      if (reviewsRes.status === "fulfilled") {
        const payload = getApiData(reviewsRes.value);
        ratingFromReviews = toNum(payload?.average_rating);
      }

      const ratingFallback =
        toNum(userData?.average_rating) ??
        toNum(userData?.avg_rating) ??
        toNum(userData?.rating);

      const rating = toRating(ratingFromReviews ?? ratingFallback);

      // seller settings
      let sellerSettingsPayload = null;
      if (sellerRes.status === "fulfilled") {
        const data = sellerRes.value?.data;
        if (data?.error === false) sellerSettingsPayload = data?.data || null;
      }

      // unread messages (buyer + seller)
      let unreadMessages = 0;
      if (chatRes.status === "fulfilled") {
        const [buyerRes, sellerChatsRes] = chatRes.value;
        const buyerChats = extractList(buyerRes?.data?.data);
        const sellerChats = extractList(sellerChatsRes?.data?.data);

        let count = 0;
        [...buyerChats, ...sellerChats].forEach((chat) => {
          if (chat?.is_muted === true) return;
          count += Number(chat?.unread_chat_count || 0);
        });
        unreadMessages = count;
      }

      setSeller(sellerSettingsPayload);

      setStats({
        membershipTier,
        activeAds,
        totalViews: userData?.total_views || userData?.profile_views || 0,
        unreadNotifications,
        unreadMessages,
        rating,
      });
    } catch (e) {
      console.error("SellerDashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isPro = stats.membershipTier === "pro" || stats.membershipTier === "shop";
  const isShop = stats.membershipTier === "shop";

  const sellerSummary = useMemo(() => {
    const vacation = Boolean(seller?.vacation_mode);
    const business = Boolean(seller?.business_registration);
    const hasDesc = Boolean((seller?.description || "").trim());
    const hasDisplay = Boolean((seller?.display_name || "").trim());
    const hasLocation = Boolean(seller?.region_id || seller?.city_id);

    const whatsappOk = seller?.show_whatsapp ? Boolean((seller?.whatsapp_number || "").trim()) : true;
    const viberOk = seller?.show_viber ? Boolean((seller?.viber_number || "").trim()) : true;

    const contactOk = whatsappOk && viberOk;

    const checks = [
      Boolean((userData?.name || "").trim()),
      Boolean((userData?.email || "").trim() || (userData?.phone || "").trim()),
      hasDisplay,
      hasDesc,
      hasLocation,
      contactOk,
    ];

    const done = checks.filter(Boolean).length;
    const total = checks.length;
    const percent = Math.round((done / total) * 100);

    return {
      vacation,
      business,
      percent,
      missing: {
        display: !hasDisplay,
        desc: !hasDesc,
        location: !hasLocation,
        contact: !contactOk,
      },
    };
  }, [seller, userData]);

  return (
    <div className="space-y-6">
      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          icon={FiLayers}
          label="Aktivni oglasi"
          value={loading ? "…" : stats.activeAds}
          hint="Oglasi koji su trenutno aktivni"
          tone="default"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Pregledi profila"
          value={loading ? "…" : stats.totalViews}
          hint="Ukupno pregleda (profil/oglašivač)"
          tone="default"
        />
        <StatCard
          icon={FiMessageSquare}
          label="Nepročitane poruke"
          value={loading ? "…" : stats.unreadMessages}
          hint="Buyer + Seller razgovori"
          tone={stats.unreadMessages > 0 ? "warn" : "good"}
        />
        <StatCard
          icon={FiStar}
          label="Prosječna ocjena"
          value={loading ? "…" : stats.rating}
          hint="Na osnovu recenzija"
          tone={Number(stats.rating) >= 4 ? "good" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Brze radnje"
            subtitle="Najčešće opcije za prodaju"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionButton
                href="/ad-listing"
                icon={FiPlusCircle}
                title="Dodaj oglas"
                desc="Postavi novi oglas i kreni sa prodajom."
              />
              <ActionButton
                href="/my-ads"
                icon={FiLayers}
                title="Uredi oglase"
                desc="Upravljaj aktivnim, isteklim i arhiviranim oglasima."
              />
              <ActionButton
                href="/chat"
                icon={FiMessageSquare}
                title="Poruke"
                desc="Odgovori kupcima brže i povećaj prodaju."
              />
              <ActionButton
                href="/profile/seller-settings"
                icon={FiSettings}
                title="Postavke prodavača"
                desc="Uredi prikaz profila prodavača, kontakte i status."
              />
            </div>
          </Card>

          <Card
            title="Pro / Shop"
            subtitle="Sve o tvom paketu i benefitima"
            right={
              <div className="flex items-center gap-2">
                {isShop ? (
                  <Pill tone="shop">Shop</Pill>
                ) : isPro ? (
                  <Pill tone="pro">Pro</Pill>
                ) : (
                  <Pill>Free</Pill>
                )}
              </div>
            }
          >
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">
                  {isShop ? "Shop paket aktivan" : isPro ? "Pro paket aktivan" : "Trenutno si na Free paketu"}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {isPro
                    ? "Imaš premium pogodnosti (bolji prikaz, više povjerenja, više prodaje)."
                    : "Nadogradi da dobiješ bolji prikaz i brži rast prodaje."}
                </div>

                <ul className="mt-3 text-sm text-slate-700 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600">•</span> Više povjerenja (bolji profil prodavača)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600">•</span> Više prodaje (bolja konverzija iz poruka)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-600">•</span> Brže odgovaranje = bolji rang i dojam
                  </li>
                </ul>
              </div>

              <div className="shrink-0">
                <CustomLink
                  href="/user-subscription"
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm border transition-colors",
                    isPro
                      ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "bg-primary border-primary text-white hover:opacity-90"
                  )}
                >
                  {isPro ? "Upravljaj paketom" : "Nadogradi paket"}
                </CustomLink>
              </div>
            </div>
          </Card>

          <Card
            title="Notifikacije i sigurnost"
            subtitle="Uredi stvari koje direktno utiču na prodaju"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FiShield /> Notifikacije
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Nepročitano: <span className="font-extrabold text-slate-800">{loading ? "…" : stats.unreadNotifications}</span>
                </div>
                <CustomLink
                  href="/notifications"
                  className="inline-flex mt-3 text-sm font-bold text-primary hover:opacity-80"
                >
                  Otvori obavijesti →
                </CustomLink>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 bg-white">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FiCheckCircle className="text-emerald-600" /> Savjet
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Brži odgovor na poruke podiže povjerenje i povećava šansu prodaje.
                </div>
                <CustomLink
                  href="/chat"
                  className="inline-flex mt-3 text-sm font-bold text-primary hover:opacity-80"
                >
                  Idi na poruke →
                </CustomLink>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <Card
            title="Spremnost profila prodavača"
            subtitle="Što si kompletiraniji, to se lakše prodaje"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-extrabold text-slate-900">
                {loading ? "…" : `${sellerSummary.percent}%`}
              </div>
              {sellerSummary.percent >= 85 ? (
                <Pill tone="ok">Odlično</Pill>
              ) : sellerSummary.percent >= 60 ? (
                <Pill tone="warn">Može bolje</Pill>
              ) : (
                <Pill>Počni</Pill>
              )}
            </div>

            <div className="mt-3">
              <Progress value={loading ? 0 : sellerSummary.percent} />
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {sellerSummary.missing.display && (
                <div className="flex items-start gap-2 text-slate-700">
                  <FiAlertCircle className="mt-0.5 text-amber-600" />
                  <span>Nedostaje <b>naziv prikaza</b> (display name).</span>
                </div>
              )}
              {sellerSummary.missing.desc && (
                <div className="flex items-start gap-2 text-slate-700">
                  <FiAlertCircle className="mt-0.5 text-amber-600" />
                  <span>Dodaj <b>opis</b> (kratko ko si i šta prodaješ).</span>
                </div>
              )}
              {sellerSummary.missing.location && (
                <div className="flex items-start gap-2 text-slate-700">
                  <FiAlertCircle className="mt-0.5 text-amber-600" />
                  <span>Postavi <b>lokaciju</b> (regija/grad).</span>
                </div>
              )}
              {sellerSummary.missing.contact && (
                <div className="flex items-start gap-2 text-slate-700">
                  <FiAlertCircle className="mt-0.5 text-amber-600" />
                  <span>Ako pališ WhatsApp/Viber, upiši i <b>broj</b>.</span>
                </div>
              )}

              {!sellerSummary.missing.display &&
                !sellerSummary.missing.desc &&
                !sellerSummary.missing.location &&
                !sellerSummary.missing.contact && (
                  <div className="flex items-start gap-2 text-emerald-800">
                    <FiCheckCircle className="mt-0.5 text-emerald-600" />
                    <span>Sve bitno je popunjeno. Super!</span>
                  </div>
                )}
            </div>

            <div className="mt-4">
              <CustomLink
                href="/profile/seller-settings"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Uredi postavke prodavača
              </CustomLink>
            </div>
          </Card>

          <Card title="Status prodavača" subtitle="Brzi pregled važnih stvari">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Tip</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {sellerSummary.business ? "Registrovana djelatnost" : "Fizičko lice"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Odmor</span>
                <span className={cn("text-sm font-extrabold", sellerSummary.vacation ? "text-amber-700" : "text-emerald-700")}>
                  {sellerSummary.vacation ? "Uključeno" : "Isključeno"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Paket</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {isShop ? "Shop" : isPro ? "Pro" : "Free"}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Preporuka" subtitle="Mali koraci koji donose više prodaje">
            <div className="text-sm text-slate-700">
              <b>Top 3:</b>
              <ol className="mt-2 space-y-1 list-decimal list-inside text-sm text-slate-700">
                <li>Uredi opis profila prodavača (kratko i jasno).</li>
                <li>Uključi samo kontakt metode koje stvarno koristiš.</li>
                <li>Odgovaraj brzo — kupci najčešće kupe od prvog koji odgovori.</li>
              </ol>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <CustomLink
                href="/my-ads"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm border border-slate-200 bg-white hover:bg-slate-50"
              >
                Upravljaj oglasima
              </CustomLink>
              <CustomLink
                href="/chat"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm border border-slate-200 bg-white hover:bg-slate-50"
              >
                Idi na poruke
              </CustomLink>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
