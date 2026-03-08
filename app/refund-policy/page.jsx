import RefundPolicy from "@/components/PagesComponent/StaticPages/RefundPolicy";
import { buildSeoMetadata, fetchSeoPage } from "@/lib/seoRuntime";


export const generateMetadata = async ({ searchParams }) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;
    const params = await searchParams;
    const langCode = params?.lang || "en";
    const seo = await fetchSeoPage("refund-policy", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: "/refund-policy",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const RefundPolicyPage = () => {
  return <RefundPolicy />;
};
export default RefundPolicyPage;
