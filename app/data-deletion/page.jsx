import DataDeletion from "@/components/PagesComponent/StaticPages/DataDeletion";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "data-deletion",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
    fallback: {
      title: "Brisanje podataka",
      description:
        "Informacije o zahtjevu, rokovima i postupku brisanja korisničkih podataka na LMX platformi.",
      keywords: "brisanje podataka, privatnost, lmx",
    },
  });
};

const DataDeletionPage = () => {
  return <DataDeletion />;
};

export default DataDeletionPage;
