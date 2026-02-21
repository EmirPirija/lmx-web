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


export default function Layout({ children }) {
  const { isLoading, isMaintenanceMode, isRedirectToLanding } =
    useClientLayoutLogic();
  const pathname = usePathname();
  const isHomepageRoute = pathname === "/";

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
