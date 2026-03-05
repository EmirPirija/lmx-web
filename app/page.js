import Layout from "@/components/Layout/Layout";
import StructuredData from "@/components/Layout/StructuredData";
import Home from "@/components/PagesComponent/Home/Home";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import {
  fetchBackendJson,
  fetchSeoPageMetadata,
  shouldSkipSeo,
} from "@/lib/server/seo-metadata";

export const generateMetadata = async ({ searchParams }) => {
  const langCode = (await searchParams)?.lang;
  return fetchSeoPageMetadata({
    page: "home",
    langCode: langCode || "en",
    revalidate: SEO_REVALIDATE_SECONDS,
  });
};

const fetchCategories = async (langCode) => {
  if (shouldSkipSeo()) return [];
  try {
    const data = await fetchBackendJson({
      path: "get-categories",
      query: { page: 1 },
      langCode: langCode || "en",
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    return data?.data?.data || [];
  } catch {
    return [];
  }
};

const fetchProductItems = async (langCode) => {
  if (shouldSkipSeo()) return [];
  try {
    const data = await fetchBackendJson({
      path: "get-item",
      query: { page: 1 },
      langCode: langCode || "en",
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    return data?.data?.data || [];
  } catch {
    return [];
  }
};

const fetchFeaturedSections = async (langCode) => {
  if (shouldSkipSeo()) return [];
  try {
    const data = await fetchBackendJson({
      path: "get-featured-section",
      langCode: langCode || "en",
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    return data?.data || [];
  } catch {
    return [];
  }
};

export default async function HomePage({ searchParams }) {
  const langCode = (await searchParams)?.lang;
  const [categoriesData, productItemsData, featuredSectionsData] =
    await Promise.all([
      fetchCategories(langCode),
      fetchProductItems(langCode),
      fetchFeaturedSections(langCode),
    ]);

  let jsonLd = null;

  if (!shouldSkipSeo()) {
    const existingSlugs = new Set(
      productItemsData.map((product) => product.slug)
    );

    let featuredItems = [];
    featuredSectionsData.forEach((section) => {
      section.section_data.slice(0, 4).forEach((item) => {
        if (!existingSlugs.has(item.slug)) {
          featuredItems.push(item);
          existingSlugs.add(item.slug); // Mark this item as included
        }
      });
    });

    jsonLd = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: [
        ...categoriesData.map((category, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Thing", // No "Category" type in Schema.org
            name: category?.translated_name,
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/ads?category=${category?.slug}`,
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
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${product?.slug}`,
            category: product?.category?.translated_name,
            ...(product?.price && {
              offers: {
                "@type": "Offer",
                price: product?.price,
                priceCurrency: "USD",
              },
            }),
            countryOfOrigin: product?.translated_item?.country,
          },
        })),
        ...featuredItems.map((item, index) => ({
          "@type": "ListItem",
          position: categoriesData.length + productItemsData.length + index + 1, // Ensure unique positions
          item: {
            "@type": "Product", // Assuming items from featured sections are products
            name: item?.translated_item?.name,
            productID: item?.id,
            description: item?.translated_item?.description,
            image: item?.image,
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${item?.slug}`,
            category: item?.category?.translated_name,
            ...(item?.price && {
              offers: {
                "@type": "Offer",
                price: item?.price,
                priceCurrency: "USD",
              },
            }),
            countryOfOrigin: item?.translated_item?.country,
          },
        })),
      ],
    };
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
