import AboutUs from "@/components/PagesComponent/StaticPages/AboutUs";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";


export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "about-us",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const AboutUsPage = () => {
  return <AboutUs />;
};

export default AboutUsPage;
