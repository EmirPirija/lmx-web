import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/redux/store/providers";
import { Toaster } from "@/components/ui/sonner";

import CompareFloatingBar from "@/components/Compare/CompareFloatingBar";
import { getAdminControlPlane } from "@/lib/server/adminControlPlane";
import AdminControlPlaneBootstrap from "@/components/Layout/AdminControlPlaneBootstrap";

// --- DARK MODE IMPORTI ---
import { ThemeProvider } from "@/components/ThemeProvider";
import PromoWelcomeModal from "@/components/Common/PromoWelcomeModal";

// Konfiguracija fonta
const manrope = Manrope({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const normalizeUrl = (value) => {
  if (!value || typeof value !== "string") return "https://lmx.ba";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

// Metadata (SEO)
export const generateMetadata = () => {
  const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_WEB_URL);
  const title =
    process.env.NEXT_PUBLIC_META_TITLE ||
    "LMX - Marketplace za kupovinu i prodaju u BiH";
  const description =
    process.env.NEXT_PUBLIC_META_DESCRIPTION ||
    "Objavi oglas i kupuj/prodaj proizvode i usluge širom BiH na LMX marketplace platformi.";
  const keywords =
    process.env.NEXT_PUBLIC_META_KEYWORDS ||
    process.env.NEXT_PUBLIC_META_kEYWORDS ||
    "LMX, marketplace BiH, oglasi, kupovina, prodaja";
  const ogImage = `${siteUrl}/apple-touch-icon.png`;
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords,
    alternates: {
      canonical: "/",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    verification: googleVerification
      ? {
          google: googleVerification,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: "LMX",
      type: "website",
      locale: "bs_BA",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "LMX marketplace",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
};

export default async function RootLayout({ children }) {
  const { controlPlane, settingsPayload } = await getAdminControlPlane();
  const isMaintenanceMode = Boolean(controlPlane?.maintenanceMode);

  if (isMaintenanceMode) {
    return (
      <html
        lang="en"
        web-version={process.env.NEXT_PUBLIC_WEB_VERSION}
        data-scroll-behavior="smooth"
        className="scroll-smooth"
        suppressHydrationWarning
      >
        <head />
        <body
          suppressHydrationWarning
          className={`${manrope.className} lmx-app-background text-black dark:text-white transition-colors duration-300`}
        >
          <div className="min-h-screen w-full bg-[#06080f] text-[#f6f8ff]">
            <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-8 py-12 text-center">
              <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs tracking-[0.14em] uppercase">
                Maintenance Mode
              </div>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight md:text-5xl">
                LMX je trenutno privremeno zatvoren.
              </h1>
              <p className="mt-4 max-w-2xl text-sm text-[#c8cfdd] md:text-base">
                Administratorska postavka održavanja je aktivna. Aplikacija će se automatski vratiti čim se
                održavanje završi.
              </p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      web-version={process.env.NEXT_PUBLIC_WEB_VERSION}
      data-scroll-behavior="smooth"
      className="scroll-smooth"
      // OBAVEZNO: Sprječava greške zbog neslaganja servera i klijenta kod tema
      suppressHydrationWarning
    >
      <head>
        {/* <Script async src="..." /> */}
      </head>
      
      <body 
        suppressHydrationWarning
        className={`
          ${manrope.className} 
          lmx-app-background text-black 
          dark:text-white 
          transition-colors duration-300 
          !pointer-events-auto relative
        `}
      >
        {/* 1. ThemeProvider mora obuhvatiti cijelu aplikaciju */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          
          {/* 2. Redux Providers */}
          <div className="lmx-app-surface">
            <Providers>
              <AdminControlPlaneBootstrap
                settingsPayload={settingsPayload}
                controlPlane={controlPlane}
              />
              {children}
              {/* <PromoWelcomeModal /> */}
              <CompareFloatingBar />
            </Providers>
          </div>
          <Toaster position="top-center" />


          {/* 4. Ostali globalni elementi */}
          <div id="recaptcha-container" suppressHydrationWarning></div>
          
        </ThemeProvider>
      </body>
    </html>
  );
}
