import AboutUs from "@/components/PagesComponent/StaticPages/AboutUs";
import { buildSeoMetadata, fetchSeoPage } from "@/lib/seoRuntime";

export const generateMetadata = async ({ searchParams }) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;
    const params = await searchParams;
    const langCode = params?.lang || "en";
    const seo = await fetchSeoPage("about-us", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: "/o-nama",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const AboutUsPage = () => {
  return <AboutUs />;
};

export default AboutUsPage;
