import StructuredData from "@/components/Layout/StructuredData";
import Blogs from "@/components/PagesComponent/Blogs/Blogs";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import {
  buildSeoMetadata,
  fetchSeoPage,
  getSeoCustomSchema,
} from "@/lib/seoRuntime";


export const generateMetadata = async ({ searchParams }) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;
    const params = await searchParams;
    const langCode = params?.lang || "en";
    const seo = await fetchSeoPage("blogs", langCode || "en");
    return buildSeoMetadata({
      seo,
      fallbackTitle: process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: "/blog",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
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
    if (process.env.NEXT_PUBLIC_SEO === "false") return [];
    let url = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs`;

    if (tag) {
      url += `?tag=${encodeURIComponent(tag)}`;
    }

    const response = await fetch(url, {
      headers: {
        "Content-Language": langCode || "en",
      },
      next: {
        revalidate: SEO_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blogs json-ld data");
    }
    const data = await response.json();
    return data?.data?.data || [];
  } catch (error) {
    console.error("Error fetching Blog Items Data:", error);
    return [];
  }
};

const BlogsPage = async ({ searchParams }) => {
  const params = await searchParams;
  const langCode = params?.lang || "en";
  const tag = params?.tag || null;
  const blogsSeo = await fetchSeoPage("blogs", langCode || "en");
  const customSchema = getSeoCustomSchema(blogsSeo);
  const blogItems = await fetchBlogItems(langCode, tag);

  const baseJsonLd = blogItems
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
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/blog/${blog?.slug}`,
            image: blog?.image,
            datePublished: blog?.created_at ? formatDate(blog.created_at) : "", // Format date to ISO 8601
            keywords: blog?.translated_tags
              ? blog.translated_tags.join(", ")
              : "", // Adding tags as keywords
          },
        })),
      }
    : null;

  let jsonLd = baseJsonLd;
  if (baseJsonLd && Array.isArray(customSchema)) {
    jsonLd = [baseJsonLd, ...customSchema];
  } else if (baseJsonLd && customSchema && typeof customSchema === "object") {
    jsonLd = [baseJsonLd, customSchema];
  }

  return (
    <>
      {jsonLd ? <StructuredData data={jsonLd} /> : null}
      <Blogs />
    </>
  );
};

export default BlogsPage;
