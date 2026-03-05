import StructuredData from "@/components/Layout/StructuredData";
import BlogDetailPage from "@/components/PagesComponent/BlogDetail/BlogDetailPage";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { fetchBackendJson, shouldSkipSeo } from "@/lib/server/seo-metadata";

const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, ""); // Regular expression to remove HTML tags
};

// Function to format the date correctly (ISO 8601)
const formatDate = (dateString) => {
  // Remove microseconds and ensure it follows ISO 8601 format
  const validDateString = dateString.slice(0, 19) + "Z"; // Remove microseconds and add 'Z' for UTC
  return validDateString;
};

export const generateMetadata = async ({ params, searchParams }) => {
  try {
    if (shouldSkipSeo()) return;
    const slugParams = await params;
    const langParams = await searchParams;
    const langCode = langParams?.lang || "en";
    const responseData = await fetchBackendJson({
      path: "blogs",
      query: { slug: slugParams?.slug },
      langCode,
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    const data = responseData?.data?.data[0];

    const plainTextDescription = data?.translated_description?.replace(
      /<\/?[^>]+(>|$)/g,
      ""
    );

    return {
      title: data?.translated_title || process.env.NEXT_PUBLIC_META_TITLE,
      description: plainTextDescription
        ? plainTextDescription
        : process.env.NEXT_PUBLIC_META_DESCRIPTION,
      openGraph: {
        images: data?.image ? [data?.image] : [],
      },
      keywords: data?.translated_tags || process.env.NEXT_PUBLIC_META_kEYWORDS,
    };
  } catch {
    return null;
  }
};

const fetchSingleBlogItem = async (slug, langCode) => {
  try {
    if (shouldSkipSeo()) return;
    const responseData = await fetchBackendJson({
      path: "blogs",
      query: { slug },
      langCode,
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    return responseData?.data?.data[0] || [];
  } catch {
    return [];
  }
};

const BlogPage = async ({ params, searchParams }) => {
  const { slug } = await params;
  const langCode = (await searchParams).lang || "en";
  const singleBlog = await fetchSingleBlogItem(slug, langCode);

  const jsonLd = singleBlog
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: singleBlog?.translated_title,
        description: singleBlog?.translated_description
          ? stripHtml(singleBlog.translated_description)
          : "No description available", // Strip HTML from description
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/blogs/${singleBlog?.slug}`,
        image: singleBlog?.image,
        datePublished: singleBlog?.created_at
          ? formatDate(singleBlog.created_at)
          : "", // Format date to ISO 8601
        keywords: singleBlog?.translated_tags
          ? singleBlog.translated_tags.join(", ")
          : "", // Adding tags as keywords
      }
    : null;

  return (
    <>
      <StructuredData data={jsonLd} />
      <BlogDetailPage slug={slug} />
    </>
  );
};

export default BlogPage;
