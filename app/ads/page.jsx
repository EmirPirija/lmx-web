import StructuredData from "@/components/Layout/StructuredData";
import Products from "@/components/PagesComponent/Ads/Ads";
import { SEO_REVALIDATE_SECONDS } from "@/lib/constants";
import {
  fetchBackendJson,
  fetchSeoPageMetadata,
  shouldSkipSeo,
} from "@/lib/server/seo-metadata";
import { generateKeywords } from "@/utils/generateKeywords";

export const dynamic = "force-dynamic";


const buildIndexableParams = (searchParams) => {
  const indexableFilters = [
    "category",
    "query",
    "country",
    "state",
    "city",
    "areaId",
    "sortBy",
    "min_price",
    "max_price",
    "date_posted",
  ];

  const params = new URLSearchParams();
  const normalizedQuery =
    searchParams?.query || searchParams?.search || searchParams?.q || "";

  const { country, state, city, areaId } = searchParams || {};

  const locationPriority = areaId
    ? "areaId"
    : city
    ? "city"
    : state
    ? "state"
    : country
    ? "country"
    : null;

  indexableFilters.forEach((key) => {
    let value = key === "query" ? normalizedQuery : searchParams[key];
    if (value === undefined || value === "") return;

    // 🧹 Skip non-selected location levels
    if (["country", "state", "city", "areaId"].includes(key)) {
      if (key !== locationPriority) return;
    }

    if (["areaId", "min_price", "max_price"].includes(key))
      value = Number(value);
    if (key === "category") params.append("category_slug", value);
    else if (key === "query") params.append("search", value);
    else if (key === "date_posted") params.append("posted_since", value);
    else params.append(key, value);
  });

  return params.toString();
};

const buildCanonicalParams = (searchParams) => {
  const params = new URLSearchParams();

  const { category } = searchParams || {};
  const query = searchParams?.query || searchParams?.search || searchParams?.q;

  if (category) params.append("category_slug", category);
  if (query) params.append("search", query);

  return params.toString();
};

export const generateMetadata = async ({ searchParams }) => {
  if (shouldSkipSeo()) return;

  try {
    const originalSearchParams = await searchParams;
    const langCode = originalSearchParams?.lang || "en";
    const slug = originalSearchParams?.category || ""; // change to your param name if needed

    let title = process.env.NEXT_PUBLIC_META_TITLE;
    let description = process.env.NEXT_PUBLIC_META_DESCRIPTION;
    let keywords = process.env.NEXT_PUBLIC_META_kEYWORDS;
    let image = "";

    if (slug) {
      const data = await fetchBackendJson({
        path: "get-categories",
        query: { slug },
        langCode: langCode || "en",
        revalidate: SEO_REVALIDATE_SECONDS,
      });
      const selfCategory = data?.self_category;

      title = selfCategory?.translated_name || title;
      description = selfCategory?.translated_description || description;
      keywords =
        generateKeywords(selfCategory?.translated_description) || keywords;
      image = selfCategory?.image || image;
    } else {
      const adListingMeta = await fetchSeoPageMetadata({
        page: "ad-listing",
        langCode: langCode || "en",
        revalidate: SEO_REVALIDATE_SECONDS,
      });
      title = adListingMeta?.title || title;
      description = adListingMeta?.description || description;
      keywords = adListingMeta?.keywords || keywords;
      image = adListingMeta?.openGraph?.images?.[0] || image;
    }

    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL;
    const paramsStr = buildCanonicalParams(originalSearchParams);
    const canonicalUrl = `${baseUrl}/ads${paramsStr ? `?${paramsStr}` : ""}`;

    return {
      title,
      description,
      openGraph: {
        images: image ? [image] : [],
      },
      keywords,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch {
    return null;
  }
};

const getAllItems = async (langCode, searchParams) => {
  if (shouldSkipSeo()) return;

  try {
    const queryString = buildIndexableParams(searchParams)
      ? buildIndexableParams(searchParams)
      : "";
    const query = Object.fromEntries(new URLSearchParams(queryString).entries());
    const data = await fetchBackendJson({
      path: "get-item",
      query: { page: 1, ...query },
      langCode: langCode || "en",
      revalidate: SEO_REVALIDATE_SECONDS,
    });
    return data?.data?.data || [];
  } catch {
    return [];
  }
};

const AdsPage = async ({ searchParams }) => {
  const originalSearchParams = await searchParams;
  const langCode = originalSearchParams?.lang || "en";
  const AllItems = await getAllItems(langCode, originalSearchParams);

  const jsonLd = AllItems
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: AllItems.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1, // Position starts at 1
          item: {
            "@type": "Product",
            productID: product?.id,
            name: product?.translated_item?.name || "",
            description: product?.translated_item?.description || "",
            image: product?.image || "",
            url: `${process.env.NEXT_PUBLIC_WEB_URL}/ad-details/${product?.slug}`,
            category: {
              "@type": "Thing",
              name: product?.category?.translated_name || "",
            },
            offers: {
              "@type": "Offer",
              price: product.price || undefined,
              priceCurrency: product?.price ? "USD" : undefined,
              availability: product?.price
                ? "https://schema.org/InStock"
                : "https://schema.org/PreOrder",
            },
            countryOfOrigin: product?.translated_item?.country || "",
          },
        })),
      }
    : null;

  return (
    <>
      <StructuredData data={jsonLd} />
      <Products searchParams={originalSearchParams} />
    </>
  );
};
export default AdsPage;
