import Layout from "@/components/Layout/Layout";
import StructuredData from "@/components/Layout/StructuredData";
import Home from "@/components/PagesComponent/Home/Home";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import {
  buildSeoMetadata,
  fetchSeoPage,
  getSeoCustomSchema,
} from "@/lib/seoRuntime";

const fetchJsonWithTimeout = async (
  url,
  { headers = {}, revalidate = SEO_REVALIDATE_SECONDS, timeoutMs = 1800 } = {},
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      next: {
        revalidate,
      },
    });
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const generateMetadata = async ({ searchParams }) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return;
  const langCode = (await searchParams)?.lang;

  try {
    const homeSeo = await fetchSeoPage("home", langCode || "en");
    return buildSeoMetadata({
      seo: homeSeo,
      fallbackTitle: process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription: process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: "/",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const fetchCategories = async (langCode) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return [];
  try {
    const data = await fetchJsonWithTimeout(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-categories?page=1&per_page=24&include_counts=0&tree_depth=0`,
      {
        headers: {
          "Content-Language": langCode || "en",
        },
      }
    );
    return data?.data?.data || [];
  } catch (error) {
    console.error("Error fetching Categories Data:", error);
    return [];
  }
};

const fetchProductItems = async (langCode) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return [];
  try {
    const data = await fetchJsonWithTimeout(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?page=1&limit=6&compact=1`,
      {
        headers: {
          "Content-Language": langCode || "en",
        },
      }
    );
    return data?.data?.data || [];
  } catch (error) {
    console.error("Error fetching Product Items Data:", error);
    return [];
  }
};

export default async function HomePage({ searchParams }) {
  const langCode = (await searchParams)?.lang;
  const homeSeo = await fetchSeoPage("home", langCode || "en");
  const [categoriesData, productItemsData] = await Promise.all([
    fetchCategories(langCode),
    fetchProductItems(langCode),
  ]);

  let jsonLd = null;
  const customSchema = getSeoCustomSchema(homeSeo);

  if (process.env.NEXT_PUBLIC_SEO !== "false") {
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [
        ...categoriesData.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Thing", // No "Category" type in Schema.org
            name: category?.translated_name,
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/oglasi?category=${category?.slug}`,
          },
        })),
        ...productItemsData.map((product, index) => ({
          "@type": "ListItem",
          position: categoriesData?.length + index + 1, // Ensure unique positions
          item: {
            "@type": "Product",
            name: product?.translated_item?.name,
            productID: product?.id,
            description: product?.translated_item?.description,
            image: product?.image,
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/oglas/${product?.slug}`,
            category: product?.category?.translated_name,
            ...(product?.price && {
              offers: {
                "@type": "Offer",
                price: product?.price,
                priceCurrency: "BAM",
              },
            }),
            countryOfOrigin: product?.translated_item?.country,
          },
        })),
      ],
    };

    if (Array.isArray(customSchema)) {
      jsonLd = [itemListSchema, ...customSchema];
    } else if (customSchema && typeof customSchema === "object") {
      jsonLd = [itemListSchema, customSchema];
    } else {
      jsonLd = itemListSchema;
    }
  }

  return (
    <>
      {jsonLd && <StructuredData data={jsonLd} />}
      <Layout>
        <Home productItemsData={productItemsData} />
      </Layout>
    </>
  );
}
