"use client";

import CustomLink from "@/components/Common/CustomLink";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import FirebaseData from "@/utils/Firebase";
import { logoutSuccess, userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { deleteUserApi, logoutApi, chatListApi, getNotificationList } from "@/utils/api";
import { deleteUser, getAuth } from "firebase/auth";

import ReusableAlertDialog from "../Common/ReusableAlertDialog";
import { useNavigate } from "../Common/useNavigate";

// UI
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// Icons
import { FiUser } from "react-icons/fi";
import {
  BiChat,
  BiDollarCircle,
  BiReceipt,
  BiSearch,
  BiShoppingBag,
  BiTrashAlt,
} from "react-icons/bi";
import { IoMdNotificationsOutline } from "react-icons/io";
import { LiaAdSolid } from "react-icons/lia";
import { LuHeart } from "react-icons/lu";
import { MdOutlineRateReview, MdWorkOutline } from "react-icons/md";
import { RiLogoutCircleLine } from "react-icons/ri";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { HiOutlineBadgeCheck } from "react-icons/hi";

const ProfileNavigation = () => {
  const dispatch = useDispatch();
  const { navigate } = useNavigate();
  const pathname = usePathname();

  const userData = useSelector(userSignUpData);
  const isLoggedIn = useSelector(getIsLoggedIn);

  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showMoreDesktop, setShowMoreDesktop] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  // ✅ BADGE STATE
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const { signOut } = FirebaseData();

  const badgeText = (n) => {
    const num = Number(n) || 0;
    if (num <= 0) return "";
    return num > 99 ? "99+" : String(num);
  };

  const extractList = (res) => {
    const root = res?.data;
    if (!root || root?.error) return [];
    const layer = root?.data;

    if (Array.isArray(layer)) return layer;
    if (layer && Array.isArray(layer?.data)) return layer.data;

    return [];
  };

  // ✅ Dohvati broj nepročitanih poruka (buyer + seller), isto kao u HomeMobileMenu logici :contentReference[oaicite:0]{index=0}
  useEffect(() => {
    let mounted = true;

    const fetchUnreadChats = async () => {
      if (!isLoggedIn) {
        setUnreadMessages(0);
        return;
      }

      try {
        const [buyerRes, sellerRes] = await Promise.all([
          chatListApi.chatList({ type: "buyer", page: 1 }),
          chatListApi.chatList({ type: "seller", page: 1 }),
        ]);

        if (!mounted) return;

        const buyerChats = extractList(buyerRes);
        const sellerChats = extractList(sellerRes);

        let count = 0;

        buyerChats.forEach((chat) => {
          if (chat?.is_muted === true) return;
          count += Number(chat?.unread_chat_count || 0);
        });

        sellerChats.forEach((chat) => {
          if (chat?.is_muted === true) return;
          count += Number(chat?.unread_chat_count || 0);
        });

        setUnreadMessages(count);
      } catch (e) {
        console.error("Greška prilikom dohvatanja broja poruka:", e);
      }
    };

    fetchUnreadChats();
    const interval = setInterval(fetchUnreadChats, 30000); // refresh svakih 30s :contentReference[oaicite:1]{index=1}

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, pathname]);

  // ✅ Dohvati broj nepročitanih obavijesti (logika kao u ProfileDropdown: !read_at && !is_read) :contentReference[oaicite:2]{index=2}
  useEffect(() => {
    let mounted = true;

    const fetchUnreadNotifications = async () => {
      if (!isLoggedIn) {
        setUnreadNotifications(0);
        return;
      }

      try {
        const res = await getNotificationList.getNotification({ page: 1 });
        if (!mounted) return;

        const list = extractList(res);

        const unread = list.filter((n) => !n?.read_at && !n?.is_read).length;
        setUnreadNotifications(unread);
      } catch (e) {
        console.error("Greška prilikom dohvatanja obavijesti:", e);
      }
    };

    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 45000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn, pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();

      const res = await logoutApi.logoutApi({
        ...(userData?.fcm_id && { fcm_token: userData?.fcm_id }),
      });

      if (res?.data?.error === false) {
        dispatch(logoutSuccess());
        toast.success("Uspješno ste se odjavili.");
        setIsLogoutOpen(false);
        if (pathname !== "/") navigate("/");
      } else {
        toast.error(res?.data?.message || "Odjava nije uspjela. Pokušajte ponovo.");
      }
    } catch (e) {
      console.log("Odjava nije uspjela:", e);
      toast.error("Odjava nije uspjela. Pokušajte ponovo.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDeleteAcc = async () => {
    try {
      setIsDeleting(true);
      const auth = getAuth();
      const user = auth.currentUser;

      await deleteUser(user);
      await deleteUserApi.deleteUser();

      dispatch(logoutSuccess());
      toast.success("Račun je uspješno izbrisan.");

      setIsDeleteOpen(false);
      if (pathname !== "/") navigate("/");
    } catch (error) {
      console.error("Greška prilikom brisanja računa:", error?.message);
      if (error?.code === "auth/requires-recent-login") {
        dispatch(logoutSuccess());
        toast.error("Molimo da se prijavite ponovo, pa pokušajte brisanje računa.");
        setIsDeleteOpen(false);
      } else {
        toast.error("Brisanje računa nije uspjelo. Pokušajte ponovo.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isActive = (href) => pathname === href;

  const Badge = ({ value }) => {
    const text = badgeText(value);
    if (!text) return null;
    return (
      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
        {text}
      </span>
    );
  };

  const NavCard = ({ href, icon: Icon, label, subtle, badge }) => (
    <CustomLink
      href={href}
      className={[
        "group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
        isActive(href)
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
      ].join(" ")}
    >
      <div
        className={[
          "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
          isActive(href)
            ? "bg-white/15"
            : subtle
            ? "bg-slate-100"
            : "bg-primary/10",
        ].join(" ")}
      >
        <Icon
          size={20}
          className={[
            "transition-colors",
            isActive(href)
              ? "text-primary-foreground"
              : subtle
              ? "text-slate-500"
              : "text-primary",
          ].join(" ")}
        />
        <Badge value={badge} />
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{label}</div>
        <div
          className={[
            "text-[11px] truncate",
            isActive(href) ? "text-white/80" : "text-slate-500",
          ].join(" ")}
        >
          {isActive(href) ? "Trenutno otvoreno" : "Otvori"}
        </div>
      </div>
    </CustomLink>
  );

  // Desktop “osnovno”
  const desktopPrimary = useMemo(
    () => [
      { href: "/profile", icon: FiUser, label: "Profil" },
      { href: "/chat", icon: BiChat, label: "Poruke", badge: unreadMessages },
      { href: "/notifications", icon: IoMdNotificationsOutline, label: "Obavijesti", badge: unreadNotifications },
      { href: "/my-ads", icon: LiaAdSolid, label: "Moji oglasi" },
      { href: "/favorites", icon: LuHeart, label: "Omiljeni" },
      { href: "/profile/saved-searches", icon: BiSearch, label: "Spašene pretrage" },
      { href: "/user-subscription", icon: BiDollarCircle, label: "Pretplata" },
      { href: "/purchases", icon: BiShoppingBag, label: "Moje kupovine" },
    ],
    [unreadMessages, unreadNotifications]
  );

  // Desktop “više”
  const desktopMore = [
    { href: "/transactions", icon: BiReceipt, label: "Transakcije", subtle: true },
    { href: "/reviews", icon: MdOutlineRateReview, label: "Recenzije", subtle: true },
    { href: "/profile/badges", icon: HiOutlineBadgeCheck, label: "Bedževi", subtle: true },
    { href: "/job-applications", icon: MdWorkOutline, label: "Prijave za posao", subtle: true },
  ];

  // Mobile bottom nav (4 + Više)
  const mobileMain = useMemo(
    () => [
      { href: "/profile", icon: FiUser, label: "Profil" },
      { href: "/chat", icon: BiChat, label: "Poruke", badge: unreadMessages },
      { href: "/my-ads", icon: LiaAdSolid, label: "Oglasi" },
      { href: "/favorites", icon: LuHeart, label: "Omiljeni" },
    ],
    [unreadMessages]
  );

  const MobileNavItem = ({ href, icon: Icon, label, badge }) => (
    <CustomLink
      href={href}
      className={[
        "relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all duration-200",
        isActive(href) ? "text-primary" : "text-gray-500",
      ].join(" ")}
    >
      <div className="relative">
        <Icon size={22} className="shrink-0" />
        <Badge value={badge} />
      </div>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </CustomLink>
  );

  const MobileMoreRow = ({ href, icon: Icon, label, badge }) => (
    <button
      type="button"
      onClick={() => {
        setMoreSheetOpen(false);
        navigate(href);
      }}
      className={[
        "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border transition-colors text-left",
        isActive(href)
          ? "bg-primary/10 border-primary/30 text-primary"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
          <Icon size={18} className={isActive(href) ? "text-primary" : "text-slate-500"} />
          <Badge value={badge} />
        </div>
        <span className="text-sm font-semibold truncate">{label}</span>
      </div>

      {badgeText(badge) ? (
        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-full">
          {badgeText(badge)}
        </span>
      ) : null}
    </button>
  );

  const moreHasBadge = unreadNotifications > 0;

  return (
    <>
      {/* =========================
          DESKTOP: Header + GRID NAV
         ========================= */}
      <div className="hidden sm:block">
        {/* User header */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden shadow-sm shrink-0 border border-primary/10">
                {userData?.profile_image ? (
                  <img src={userData.profile_image} alt="Korisnik" className="h-full w-full object-cover" />
                ) : (
                  <FiUser size={20} />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {userData?.name || "Korisnik"}
                </h3>
                <p className="text-sm text-slate-500 truncate">
                  {userData?.email || userData?.phone || ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsLogoutOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                title="Odjavi se"
                type="button"
              >
                <RiLogoutCircleLine size={18} />
                <span className="hidden lg:inline">Odjavi se</span>
              </button>

              <button
                onClick={() => setIsDeleteOpen(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                title="Izbriši račun"
                type="button"
              >
                <BiTrashAlt size={18} />
                <span className="hidden lg:inline">Izbriši račun</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation grid */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="px-6 pt-5 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Navigacija profila</h4>
                <p className="text-xs text-slate-500 mt-0.5">Sve najvažnije na jednom mjestu</p>
              </div>

              <button
                type="button"
                onClick={() => setShowMoreDesktop((v) => !v)}
                className="text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                {showMoreDesktop ? "Sakrij dodatno" : "Prikaži dodatno"}
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {desktopPrimary.map((x) => (
                <NavCard
                  key={x.href}
                  href={x.href}
                  icon={x.icon}
                  label={x.label}
                  badge={x.badge}
                />
              ))}
            </div>

            {showMoreDesktop && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Dodatne opcije
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {desktopMore.map((x) => (
                    <NavCard
                      key={x.href}
                      href={x.href}
                      icon={x.icon}
                      label={x.label}
                      subtle
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =========================
          MOBILE: Header + Bottom Nav + More Sheet
         ========================= */}
      <div className="sm:hidden">
        {/* Mobile user header */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 mb-4">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary overflow-hidden shadow-sm shrink-0 border border-primary/10">
              {userData?.profile_image ? (
                <img src={userData.profile_image} alt="Korisnik" className="h-full w-full object-cover" />
              ) : (
                <FiUser size={18} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {userData?.name || "Korisnik"}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {userData?.email || userData?.phone || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Spacer because bottom nav is fixed */}
        <div className="h-16" />
      </div>

      {/* Mobile sticky bottom nav */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg pb-safe">
        <div className="grid grid-cols-5 gap-0">
          {mobileMain.map((x) => (
            <MobileNavItem
              key={x.href}
              href={x.href}
              icon={x.icon}
              label={x.label}
              badge={x.badge}
            />
          ))}

          {/* MORE -> SHEET */}
          <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className={[
                  "relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg transition-all duration-200",
                  "text-gray-500",
                ].join(" ")}
              >
                <div className="relative">
                  <HiOutlineDotsHorizontal size={22} className="shrink-0" />
                  {moreHasBadge ? (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-white" />
                  ) : null}
                </div>
                <span className="text-[10px] font-medium leading-none">Više</span>
              </button>
            </SheetTrigger>

            <SheetContent side="bottom" className="p-0 rounded-t-3xl max-h-[90vh] overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900">Više opcija</div>
                  <div className="text-xs text-slate-500">Sve ostalo vezano za profil</div>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreSheetOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700"
                >
                  Zatvori
                </button>
              </div>

              <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(90vh-60px)]">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Prečice
                </div>

                <MobileMoreRow
                  href="/notifications"
                  icon={IoMdNotificationsOutline}
                  label="Obavijesti"
                  badge={unreadNotifications}
                />
                <MobileMoreRow href="/profile/saved-searches" icon={BiSearch} label="Spašene pretrage" />
                <MobileMoreRow href="/user-subscription" icon={BiDollarCircle} label="Pretplata" />
                <MobileMoreRow href="/purchases" icon={BiShoppingBag} label="Moje kupovine" />

                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Dodatno
                  </div>

                  <MobileMoreRow href="/transactions" icon={BiReceipt} label="Transakcije" />
                  <MobileMoreRow href="/reviews" icon={MdOutlineRateReview} label="Recenzije" />
                  <MobileMoreRow href="/profile/badges" icon={HiOutlineBadgeCheck} label="Bedževi" />
                  <MobileMoreRow href="/job-applications" icon={MdWorkOutline} label="Prijave za posao" />
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMoreSheetOpen(false);
                      setIsLogoutOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <RiLogoutCircleLine size={18} className="text-slate-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">Odjavi se</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMoreSheetOpen(false);
                      setIsDeleteOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                      <BiTrashAlt size={18} className="text-red-600" />
                    </div>
                    <span className="text-sm font-semibold text-red-700">Izbriši račun</span>
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Dialogs */}
      <ReusableAlertDialog
        open={isLogoutOpen}
        onCancel={() => setIsLogoutOpen(false)}
        onConfirm={handleLogout}
        title="Potvrda odjave"
        description="Jeste li sigurni da se želite odjaviti?"
        cancelText="Otkaži"
        confirmText="Da, odjavi me"
        confirmDisabled={isLoggingOut}
      />

      <ReusableAlertDialog
        open={isDeleteOpen}
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteAcc}
        title="Brisanje računa"
        description={
          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <p className="text-red-800 text-sm font-bold mb-2">Upozorenje:</p>
            <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
              <li>Svi vaši oglasi i transakcije će biti obrisani</li>
              <li>Podaci računa se ne mogu vratiti</li>
              <li>Pretplata će biti otkazana</li>
              <li>Poruke i spašeni sadržaji će biti izgubljeni</li>
            </ul>
          </div>
        }
        cancelText="Otkaži"
        confirmText="Da, izbriši račun"
        confirmDisabled={isDeleting}
      />

      <style jsx global>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  );
};

export default ProfileNavigation;
