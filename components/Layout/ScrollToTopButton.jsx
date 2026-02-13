import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { IoIosArrowUp } from "@/components/Common/UnifiedIconPack";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Koristimo window.scrollY jer je modernije od pageYOffset
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        // --- BAZNI STILOVI (Uvijek prisutni) ---
        "fixed bottom-7 right-7 z-[1000]",
        "flex items-center justify-center size-12",
        "bg-primary text-white rounded-full", // Krug umjesto kvadrata
        "shadow-lg shadow-primary/30", // Lijepa sjena u boji dugmeta
        "transition-all duration-500 ease-in-out", // Glatka tranzicija za sve
        
        // --- INTERAKCIJE (Hover & Active) ---
        "hover:bg-primary/90 hover:-translate-y-1 hover:shadow-xl", // Lebdi na hover
        "active:scale-90", // "Ulegne" na klik
        
        // --- LOGIKA POJAVLJIVANJA (UI MAGIC) ---
        isVisible 
          ? "opacity-0 translate-y-0 pointer-events-auto" // Vidljivo
          : "opacity-0 translate-y-8 pointer-events-none"   // Sakriveno (pomjereno dolje)
      )}
      aria-label="Vrati se na vrh"
    >
      <IoIosArrowUp size={24} />
    </button>
  );
};

export default ScrollToTopButton;