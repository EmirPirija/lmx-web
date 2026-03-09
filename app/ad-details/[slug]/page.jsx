import StructuredData from "@/components/Layout/StructuredData";
import ProductDetail from "@/components/PagesComponent/ProductDetail/ProductDetails";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import { generateKeywords } from "@/utils/generateKeywords";
import { cache } from "react";
import {
  buildSeoMetadata,
  fetchSeoPage,
  getSeoCustomSchema,
} from "@/lib/seoRuntime";

const fetchItemBySlug = cache(async (slug, langCode) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_END_POINT}get-item?slug=${slug}`,
      {
        headers: {
          "Content-Language": langCode || "en",
        },
        next: {
          revalidate: SEO_REVALIDATE_SECONDS,
        },
      }
    );

    const data = await res.json();
    const payload = data?.data;
    if (Array.isArray(payload)) return payload[0] || null;
    if (Array.isArray(payload?.data)) return payload.data[0] || null;
    return null;
  } catch (error) {
    console.error("Error fetching item data:", error);
    return null;
  }
});

export const generateMetadata = async ({ params, searchParams }) => {
  if (process.env.NEXT_PUBLIC_SEO === "false") return;
  try {
    const { slug } = await params;
    const langCode = (await searchParams)?.lang || "en";
    const listingSeo = await fetchSeoPage("ad-listing", langCode || "en");
    const item = await fetchItemBySlug(slug, langCode);
    const title = item?.translated_item?.name;
    const description = item?.translated_item?.description;
    const keywords = generateKeywords(item?.translated_item?.description);
    const image = item?.image;

    return buildSeoMetadata({
      seo: listingSeo,
      fallbackTitle: title || process.env.NEXT_PUBLIC_META_TITLE,
      fallbackDescription:
        description || process.env.NEXT_PUBLIC_META_DESCRIPTION,
      fallbackKeywords:
        keywords ||
        process.env.NEXT_PUBLIC_META_KEYWORDS ||
        process.env.NEXT_PUBLIC_META_kEYWORDS,
      canonicalPath: `/oglas/${slug}`,
      fallbackImage: image || "/apple-touch-icon.png",
    });
  } catch (error) {
    console.error("Error fetching MetaData:", error);
    return null;
  }
};

const getItemData = async (slug, langCode) => fetchItemBySlug(slug, langCode);

const ProductDetailPage = async ({ params, searchParams }) => {
  const { slug } = await params;
  const langCode = (await searchParams).lang || "en";
  const listingSeo = await fetchSeoPage("ad-listing", langCode || "en");
  const customSchema = getSeoCustomSchema(listingSeo);
  const product = await getItemData(slug, langCode);
  const productSchema = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        productID: product?.id,
        name: product?.translated_item?.name,
        description: product?.translated_item?.description,
        image: product?.image,
        url: `${process.env.NEXT_PUBLIC_WEB_URL}/oglas/${product?.slug}`,
        category: {
          "@type": "Thing",
          name: product?.category?.translated_name || "General Category", // Default category name
        },
        ...(product?.price && {
          offers: {
            "@type": "Offer",
            price: product.price,
            priceCurrency: "BAM",
          },
        }),
        countryOfOrigin: product?.translated_item?.country,
      }
    : null;

  let jsonLd = productSchema;
  if (productSchema && Array.isArray(customSchema)) {
    jsonLd = [productSchema, ...customSchema];
  } else if (productSchema && customSchema && typeof customSchema === "object") {
    jsonLd = [productSchema, customSchema];
  }

  return (
    <>
      <StructuredData data={jsonLd} />
      <ProductDetail slug={slug} />
    </>
  );
};

export default ProductDetailPage;
