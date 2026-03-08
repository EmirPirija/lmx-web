import StructuredData from "@/components/Layout/StructuredData";
import BlogDetailPage from "@/components/PagesComponent/BlogDetail/BlogDetailPage";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import {
  buildSeoMetadata,
  fetchSeoPage,
  getSeoCustomSchema,
} from "@/lib/seoRuntime";

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
    if (process.env.NEXT_PUBLIC_SEO === "false") return;
    const slugParams = await params;
    const langParams = await searchParams;
    const langCode = langParams?.lang || "en";
    const blogsSeo = await fetchSeoPage("blogs", langCode || "en");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${slugParams?.slug}`,
      {
        headers: {
          "Content-Language": langCode || "en",
        },
        next: {
          revalidate: SEO_REVALIDATE_SECONDS,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch metadata");
    }

    const responseData = await response.json();
    const data = responseData?.data?.data[0];

    const plainTextDescription = data?.translated_description?.replace(
      /<\/?[^>]+(>|$)/g,
      ""
    );

    return buildSeoMetadata({
      seo: blogsSeo,
      fallbackTitle: data?.translated_title || process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription:
        plainTextDescription || process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords: Array.isArray(data?.translated_tags)
        ? data.translated_tags.join(", ")
        : data?.translated_tags ||
          process.env.NEXT_PUBLIC_META_KEYWORDS ||
          process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: `/blogs/${slugParams?.slug || ""}`,
      fallbackImage: data?.image || "/apple-touch-icon.png",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const fetchSingleBlogItem = async (slug, langCode) => {
  try {
    if (process.env.NEXT_PUBLIC_SEO === "false") return;
    const url = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}blogs?slug=${slug}`;
    const response = await fetch(url, {
      headers: {
        "Content-Language": langCode || "en",
      },
      next: {
        revalidate: SEO_REVALIDATE_SECONDS,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blog data");
    }

    const responseData = await response.json();
    return responseData?.data?.data[0] || [];
  } catch (error) {
    console.error("Error fetching Blog Items Data:", error);
    return [];
  }
};

const BlogPage = async ({ params, searchParams }) => {
  const { slug } = await params;
  const langCode = (await searchParams).lang || "en";
  const blogsSeo = await fetchSeoPage("blogs", langCode || "en");
  const customSchema = getSeoCustomSchema(blogsSeo);
  const singleBlog = await fetchSingleBlogItem(slug, langCode);

  const baseJsonLd = singleBlog
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

  let jsonLd = baseJsonLd;
  if (baseJsonLd && Array.isArray(customSchema)) {
    jsonLd = [baseJsonLd, ...customSchema];
  } else if (baseJsonLd && customSchema && typeof customSchema === "object") {
    jsonLd = [baseJsonLd, customSchema];
  }

  return (
    <>
      {jsonLd ? <StructuredData data={jsonLd} /> : null}
      <BlogDetailPage slug={slug} />
    </>
  );
};

export default BlogPage;
