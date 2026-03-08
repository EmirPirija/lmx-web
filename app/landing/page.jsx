import Layout from "@/components/Layout/Layout";
import AnythingYouWant from "@/components/PagesComponent/LandingPage/AnythingYouWant";
import OurBlogs from "@/components/PagesComponent/LandingPage/OurBlogs";
import QuickAnswers from "@/components/PagesComponent/LandingPage/QuickAnswers";
import WorkProcess from "@/components/PagesComponent/LandingPage/WorkProcess";
import { buildSeoMetadata, fetchSeoPage } from "@/lib/seoRuntime";


export const generateMetadata = async ({ searchParams }) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;
    const params = await searchParams;
    const langCode = params?.lang || "en";
    const seo = await fetchSeoPage("landing", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: "/landing",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const LandingPage = () => {
  return (
    <Layout>
      <AnythingYouWant />
      <WorkProcess />
      <OurBlogs />
      <QuickAnswers />
    </Layout>
  );
};

export default LandingPage;
