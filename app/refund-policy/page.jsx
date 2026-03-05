import RefundPolicy from "@/components/PagesComponent/StaticPages/RefundPolicy";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "refund-policy",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const RefundPolicyPage = () => {
  return <RefundPolicy />;
};
export default RefundPolicyPage;
