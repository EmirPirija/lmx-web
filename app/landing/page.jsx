import Layout from "@/components/Layout/Layout";
import AnythingYouWant from "@/components/PagesComponent/LandingPage/AnythingYouWant";
import OurBlogs from "@/components/PagesComponent/LandingPage/OurBlogs";
import QuickAnswers from "@/components/PagesComponent/LandingPage/QuickAnswers";
import WorkProcess from "@/components/PagesComponent/LandingPage/WorkProcess";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchSeoPageMetadata } from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "landing",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
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
