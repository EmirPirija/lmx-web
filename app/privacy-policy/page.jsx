import PrivacyPolicy from "@/components/PagesComponent/StaticPages/PrivacyPolicy";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "privacy-policy",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const PrivacyPolicyPage = () => {
  return <PrivacyPolicy />;
};
export default PrivacyPolicyPage;
