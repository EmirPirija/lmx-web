import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/redux/store/providers";
import { Toaster } from "@/components/ui/sonner";
import StructuredData from "@/components/Layout/StructuredData";
import {
  buildGlobalSeoSchemas,
  buildSeoMetadata,
  fetchGlobalSeo,
  fetchSystemSettingsSeo,
} from "@/lib/seoRuntime";

import CompareFloatingBar from "@/components/Compare/CompareFloatingBar";

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
export const generateMetadata = async () => {
  const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_WEB_URL);
  const globalSeo =
    process.env.NEXT_PUBLIC_SEO === "false"
      ? null
      : await fetchGlobalSeo("en");
  const metadata = buildSeoMetadata({
    seo: globalSeo,
    fallbackTitle:
      process.env.NEXT_PUBLIC_META_TITLE ||
      "LMX - Marketplace za kupovinu i prodaju u BiH",
    fallbackDescription:
      process.env.NEXT_PUBLIC_META_DESCRIPTION ||
      "Objavi oglas i kupuj/prodaj proizvode i usluge širom BiH na LMX marketplace platformi.",
    fallbackKeywords:
      process.env.NEXT_PUBLIC_META_KEYWORDS ||
      process.env.NEXT_PUBLIC_META_kEYWORDS ||
      "LMX, marketplace BiH, oglasi, kupovina, prodaja",
    canonicalPath: "/",
    fallbackImage: `${siteUrl}/apple-touch-icon.png`,
  });
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(siteUrl),
    ...metadata,
    verification: googleVerification
      ? {
          google: googleVerification,
        }
      : undefined,
  };
};

export default async function RootLayout({ children }) {
  const globalSeo =
    process.env.NEXT_PUBLIC_SEO === "false"
      ? null
      : await fetchGlobalSeo("en");
  const systemSettings =
    process.env.NEXT_PUBLIC_SEO === "false"
      ? null
      : await fetchSystemSettingsSeo();
  const globalSchemas =
    process.env.NEXT_PUBLIC_SEO === "false"
      ? []
      : buildGlobalSeoSchemas({
          seo: globalSeo,
          systemSettings,
        });

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
        {globalSchemas.length > 0 ? <StructuredData data={globalSchemas} /> : null}

        {/* 1. ThemeProvider mora obuhvatiti cijelu aplikaciju */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          
          {/* 2. Redux Providers */}
          <div className="lmx-app-surface">
            <Providers>
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
