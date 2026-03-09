import MapSearchPage from "@/components/MapSearchPage";
import { buildSeoMetadata, fetchSeoPage } from "@/lib/seoRuntime";

export const generateMetadata = async ({ searchParams }) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return;

  try {
    const langCode = (await searchParams)?.lang || "en";
    const seo = await fetchSeoPage("map-search", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: "Pretraga na mapi | Oglasi",
      fallbackDescription:
        "Pronađite oglase na interaktivnoj mapi - nekretnine, automobili i više",
      fallbackKeywords: "mapa, oglasi, nekretnine, pretraga, lokacija",
      canonicalPath: "/pretraga-mapa",
    });
  } catch (error) {
    console.error("Error fetching Map Search MetaData:", error);
    return null;
  }
};

export default function MapSearchPageRoute() {
  return <MapSearchPage />;
}
