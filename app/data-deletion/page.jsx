import DataDeletion from "@/components/PagesComponent/StaticPages/DataDeletion";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;

    const params = await searchParams;
    const langCode = params?.lang || "en";

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}seo-settings?page=data-deletion`,
      {
        headers: {
          "Content-Language": langCode || "en",
        },
        next: {
          revalidate: SEO_REVALIDATE_SECONDS,
        },
      }
    );

    const data = await res.json();
    const seo = data?.data?.[0];

    return {
      title: seo?.translated_title || "Brisanje podataka",
      description:
        seo?.translated_description ||
        "Informacije o zahtjevu, rokovima i postupku brisanja korisničkih podataka na LMX platformi.",
      openGraph: {
        images: seo?.image ? [seo?.image] : [],
      },
      keywords: seo?.translated_keywords || "brisanje podataka, privatnost, lmx",
    };
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return {
      title: "Brisanje podataka",
      description:
        "Informacije o zahtjevu, rokovima i postupku brisanja korisničkih podataka na LMX platformi.",
    };
  }
};

const DataDeletionPage = () => {
  return <DataDeletion />;
};

export default DataDeletionPage;
