import FaqsPage from "@/components/PagesComponent/Faq/FaqsPage";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "faqs",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const page = () => {
  return <FaqsPage />;
};

export default page;
