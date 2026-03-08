import DataDeletion from "@/components/PagesComponent/StaticPages/DataDeletion";
import { buildSeoMetadata, fetchSeoPage } from "@/lib/seoRuntime";


export const generateMetadata = async ({ searchParams }) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;

    const params = await searchParams;
    const langCode = params?.lang || "en";
    const seo = await fetchSeoPage("data-deletion", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: "Brisanje podataka",
      fallbackDescription:
        "Informacije o zahtjevu, rokovima i postupku brisanja korisničkih podataka na LMX platformi.",
      fallbackKeywords: "brisanje podataka, privatnost, lmx",
      canonicalPath: "/data-deletion",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const DataDeletionPage = () => {
  return <DataDeletion />;
};

export default DataDeletionPage;
