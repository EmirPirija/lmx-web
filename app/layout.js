import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/redux/store/providers";
import { Toaster } from "@/components/ui/sonner";

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

export default function RootLayout({ children }) {
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
