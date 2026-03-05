import StructuredData from "@/components/Layout/StructuredData";
import Blogs from "@/components/PagesComponent/Blogs/Blogs";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import {
  fetchBackendJson,
  fetchSeoPageMetadata,
  shouldSkipSeo,
} from "@/lib/server/seo-metadata";

export const dynamic = "force-dynamic";

export const generateMetadata = async ({ searchParams }) => {
  const params = await searchParams;
  return fetchSeoPageMetadata({
    page: "blogs",
    langCode: params?.lang || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const stripHtml = (html) => {
  return html.replace(/<[^>]*>/g, ""); // Regular expression to remove HTML tags
};

// Function to format the date correctly (ISO 8601)
const formatDate = (dateString) => {
  // Remove microseconds and ensure it follows ISO 8601 format
  const validDateString = dateString.slice(0, 19) + "Z"; // Remove microseconds and add 'Z' for UTC
  return validDateString;
};

const fetchBlogItems = async (langCode, tag) => {
  try {
    if (shouldSkipSeo()) return [];
    const data = await fetchBackendJson({
      path: "blogs",
      query: tag ? { tag } : {},
      langCode: langCode || "en",
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    return data?.data?.data || [];
  } catch {
    return [];
  }
};

const BlogsPage = async ({ searchParams }) => {
  const params = await searchParams;
  const langCode = params?.lang || "en";
  const tag = params?.tag || null;
  const blogItems = await fetchBlogItems(langCode, tag);

  const jsonLd = blogItems
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: blogItems.map((blog, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "BlogPosting",
            headline: blog?.translated_title,
            description: blog?.translated_description
              ? stripHtml(blog.translated_description)
              : "No description available", // Strip HTML from description
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/blogs/${blog?.slug}`,
            image: blog?.image,
            datePublished: blog?.created_at ? formatDate(blog.created_at) : "", // Format date to ISO 8601
            keywords: blog?.translated_tags
              ? blog.translated_tags.join(", ")
              : "", // Adding tags as keywords
          },
        })),
      }
    : null;
  return (
    <>
      <StructuredData data={jsonLd} />
      <Blogs />
    </>
  );
};

export default BlogsPage;
