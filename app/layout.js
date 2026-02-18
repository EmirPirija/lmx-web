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

// Metadata (SEO)
export const generateMetadata = () => {
  return {
    title: process.env.NEXT_PUBLIC_META_TITLE,
    description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
    keywords: process.env.NEXT_PUBLIC_META_kEYWORDS,
    openGraph: {
      title: process.env.NEXT_PUBLIC_META_TITLE,
      description: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      keywords: process.env.NEXT_PUBLIC_META_kEYWORDS,
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
        className={`
          ${manrope.className} 
          bg-white text-black 
          dark:bg-gray-900 dark:text-white 
          transition-colors duration-300 
          !pointer-events-auto relative
        `}
      >
        {/* 1. ThemeProvider mora obuhvatiti cijelu aplikaciju */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          
          {/* 2. Redux Providers */}
          <Providers>
            {children}
            <PromoWelcomeModal />
            <CompareFloatingBar />
            <Toaster position="top-center" />
          </Providers>


          {/* 4. Ostali globalni elementi */}
          <div id="recaptcha-container"></div>
          
        </ThemeProvider>
      </body>
    </html>
  );
}
