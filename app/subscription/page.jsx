import Subscription from "@/components/PagesComponent/Subscription/Subscription";
import { buildSeoMetadata, fetchSeoPage } from "@/lib/seoRuntime";

export const generateMetadata = async ({ searchParams }) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return;
  try {
    const langCode = (await searchParams)?.lang || "en";
    const seo = await fetchSeoPage("subscription", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: "/subscription",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const SubscriptionPage = () => {
  return <Subscription />;
};

export default SubscriptionPage;
