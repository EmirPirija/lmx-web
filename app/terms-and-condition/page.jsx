import TermsAndCondition from "@/components/PagesComponent/StaticPages/TermsAndCondition";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";


export const dynamic = "force-dynamic";


export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "terms-and-conditions",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const TermsAndConditionPage = () => {
  return <TermsAndCondition />;
};
export default TermsAndConditionPage;
