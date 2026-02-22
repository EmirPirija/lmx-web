"use client";
import Header from "../Common/Header";
import Footer from "../Footer/Footer";
import PushNotificationLayout from "./PushNotificationLayout";
import Loading from "@/app/loading";
import UnderMaintenance from "../../public/assets/something_went_wrong.svg";
import { t } from "@/utils";
import { useClientLayoutLogic } from "./useClientLayoutLogic";
import CustomImage from "../Common/CustomImage";
import ScrollToTopButton from "./ScrollToTopButton";
import { AdaptiveMobileDockProvider } from "./AdaptiveMobileDock";
import { usePathname } from "next/navigation";
import { useEffect } from "react";


export default function Layout({ children }) {
  const { isLoading, isMaintenanceMode, isRedirectToLanding } =
    useClientLayoutLogic();
  const pathname = usePathname();
  const isHomepageRoute = pathname === "/";

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const root = document.documentElement;
    let rafId = null;

    const update = () => {
      const y = window.scrollY || window.pageYOffset || 0;
      const offset = Math.min(y * 0.42, 7200);
      const wave = Math.sin(y * 0.009) * 34;
      root.style.setProperty("--lmx-scroll-offset", `${offset.toFixed(2)}px`);
      root.style.setProperty("--lmx-scroll-wave", `${wave.toFixed(2)}px`);
      rafId = null;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      root.style.removeProperty("--lmx-scroll-offset");
      root.style.removeProperty("--lmx-scroll-wave");
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (isRedirectToLanding) {
    return null;
  }

  if (isMaintenanceMode) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-2">
        <CustomImage
          src={UnderMaintenance}
          alt="Maintenance Mode"
          height={255}
          width={255}
        />
        <p className="text-center max-w-[40%]">{"Stranica je na održavanju i privremeno nedostupna."}</p>
      </div>
    );
  }

  return (
    <PushNotificationLayout>
      <AdaptiveMobileDockProvider>
        <div
          className={`flex flex-col min-h-screen ${
            isHomepageRoute ? "lmx-home-container-scope" : "lmx-fullwidth-container-scope"
          }`}
          style={{ paddingBottom: "var(--adaptive-mobile-dock-space, 0px)" }}
        >
          <Header />
          <div className="flex-1 bg-[#f0f3f9] dark:bg-slate-900 pb-8">
            {children}
          </div>
          <ScrollToTopButton />
          <Footer />
        </div>
      </AdaptiveMobileDockProvider>
    </PushNotificationLayout>
  );
}
