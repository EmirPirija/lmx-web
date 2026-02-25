const IMAGE_POOL = [
  "/assets/Image1.png",
  "/assets/Image2.png",
  "/assets/Image3.png",
  "/assets/Image4.png",
  "/assets/Image5.png",
  "/assets/Image6.png",
];

const VIDEO_POOL = [
  "https://www.youtube.com/shorts/dQw4w9WgXcQ",
  "https://www.youtube.com/shorts/M7lc1UVf-VE",
  "https://www.youtube.com/shorts/3JZ_D3ELwOQ",
  "https://www.youtube.com/shorts/kJQP7kiw5Fk",
  "https://www.youtube.com/shorts/aqz-KE-bpKQ",
  "https://www.youtube.com/shorts/hY7m5jjJ9mM",
];

const SELLER_POOL = [
  { id: 7001, name: "autocentar.sarajevo", verified: true },
  { id: 7002, name: "tehno.shop.ba", verified: true },
  { id: 7003, name: "dom.market.ba", verified: false },
  { id: 7004, name: "mobili.store", verified: true },
];

const LISTING_BLUEPRINTS = [
  {
    name: "Volkswagen Golf 7 1.6 TDI",
    price: 18900,
    condition: "Korišteno",
    year: "2015",
    fuel: "Dizel",
    mileage: "184000",
    city: "Sarajevo",
  },
  {
    name: "Audi A4 2.0 TDI S-tronic",
    price: 25900,
    condition: "Korišteno",
    year: "2017",
    fuel: "Dizel",
    mileage: "156000",
    city: "Mostar",
  },
  {
    name: "Hyundai Tucson 1.6 TGDI",
    price: 46900,
    condition: "Novo",
    year: "2024",
    fuel: "Benzin",
    mileage: "0",
    city: "Tuzla",
  },
  {
    name: "iPhone 14 Pro 128GB",
    price: 1399,
    condition: "Korišteno",
    year: "2022",
    city: "Banja Luka",
  },
  {
    name: "Samsung Galaxy S24 256GB",
    price: 1799,
    condition: "Novo",
    year: "2024",
    city: "Zenica",
  },
  {
    name: "MacBook Air M2 13 inch",
    price: 2490,
    condition: "Korišteno",
    year: "2023",
    city: "Sarajevo",
  },
  {
    name: "Dvosoban stan 63m2 Centar",
    price: 239000,
    condition: "Korišteno",
    year: "2018",
    city: "Sarajevo",
  },
  {
    name: "Stan 52m2 novogradnja",
    price: 198000,
    condition: "Novo",
    year: "2025",
    city: "Mostar",
  },
  {
    name: "Ugao garnitura siva",
    price: 780,
    condition: "Korišteno",
    city: "Tuzla",
  },
  {
    name: "Gaming racunar RTX 4070",
    price: 2890,
    condition: "Novo",
    year: "2025",
    city: "Banja Luka",
  },
  {
    name: "Yamaha PSR E473 klavijatura",
    price: 980,
    condition: "Korišteno",
    city: "Bihać",
  },
  {
    name: "Elektricni romobil 500W",
    price: 990,
    condition: "Novo",
    year: "2025",
    city: "Zenica",
  },
];

const SECTION_SEEDS = [
  { slug: "istaknuti-oglasi", title: "Izdvojeni oglasi" },
  { slug: "preporuceni-oglasi", title: "Preporučeni oglasi" },
];

const toSafeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isEnvTruthy = (value) => {
  if (value === undefined) return false;
  const normalized = String(value).trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(normalized);
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const buildTranslatedFields = (template) => {
  const fields = [
    {
      translated_name: "Stanje oglasa",
      translated_selected_values: [template.condition || "Korišteno"],
    },
  ];

  if (template.year) {
    fields.push({
      translated_name: "Godište",
      translated_selected_values: [String(template.year)],
    });
  }
  if (template.fuel) {
    fields.push({
      translated_name: "Gorivo",
      translated_selected_values: [template.fuel],
    });
  }
  if (template.mileage) {
    fields.push({
      translated_name: "Kilometraža (km)",
      translated_selected_values: [String(template.mileage)],
    });
  }
  return fields;
};

const getTemplate = (seed) => LISTING_BLUEPRINTS[seed % LISTING_BLUEPRINTS.length];
const getSeller = (seed) => SELLER_POOL[seed % SELLER_POOL.length];

const buildSeededListing = ({
  seed,
  idBase,
  sectionSlug = "home",
  includeVideo = false,
  featured = true,
}) => {
  const template = getTemplate(seed);
  const seller = getSeller(seed);
  const index = seed % IMAGE_POOL.length;
  const image = IMAGE_POOL[index];
  const secondImage = IMAGE_POOL[(index + 1) % IMAGE_POOL.length];
  const createdAt = new Date(Date.now() - ((seed % 12) + 1) * 60 * 60 * 1000).toISOString();
  const id = idBase + seed;
  const linkSeed = VIDEO_POOL[seed % VIDEO_POOL.length];

  return {
    id,
    user_id: seller.id,
    seller_id: seller.id,
    name: template.name,
    slug: `${slugify(template.name)}-${id}`,
    image,
    gallery_images: [{ image }, { image: secondImage }],
    price: template.price,
    old_price: template.condition === "Novo" ? Math.round(template.price * 1.08) : null,
    is_on_sale: template.condition === "Novo",
    is_feature: featured ? 1 : 0,
    is_featured: featured ? 1 : 0,
    featured: featured ? 1 : 0,
    placement: featured ? "home" : null,
    positions: featured ? "home" : null,
    status: "approved",
    is_liked: false,
    category: { is_job_category: 0 },
    created_at: createdAt,
    published_at: createdAt,
    translated_city: template.city || null,
    city: template.city || null,
    total_likes: (seed % 6) + 1,
    clicks: (seed % 9) + 4,
    total_video_plays: includeVideo ? 40 + (seed % 80) : 0,
    translated_item: {
      name: template.name,
      created_at: createdAt,
      status: "approved",
    },
    translated_custom_fields: buildTranslatedFields(template),
    user: {
      id: seller.id,
      name: seller.name,
      is_verified: seller.verified,
      verified: seller.verified,
      shop_name: null,
      profile: null,
      image: null,
    },
    seller: {
      id: seller.id,
      name: seller.name,
      is_verified: seller.verified,
      verified: seller.verified,
      shop_name: null,
      profile: null,
      image: null,
    },
    video_link: includeVideo ? linkSeed : null,
    video: includeVideo ? linkSeed : null,
    is_seeded_home_item: true,
  };
};

const normalizeSection = (section, index) => {
  const sectionData = Array.isArray(section?.section_data) ? section.section_data : [];
  return {
    id: section?.id ?? 990000000 + index,
    slug: section?.slug || `home-section-${index + 1}`,
    title: section?.title || section?.translated_name || "Izdvojeno",
    translated_name: section?.translated_name || section?.title || "Izdvojeno",
    filter: section?.filter || "featured_ads",
    ...section,
    section_data: sectionData,
  };
};

const topUpSectionItems = (section, minItemsPerSection, startSeed) => {
  const current = Array.isArray(section?.section_data) ? [...section.section_data] : [];
  if (current.length >= minItemsPerSection) {
    return { section: { ...section, section_data: current }, usedSeeds: 0 };
  }

  const missing = minItemsPerSection - current.length;
  const additions = Array.from({ length: missing }, (_, idx) =>
    buildSeededListing({
      seed: startSeed + idx,
      idBase: 980000000,
      sectionSlug: section?.slug || "home",
      includeVideo: (startSeed + idx) % 3 === 0,
      featured: true,
    })
  );

  return {
    section: { ...section, section_data: [...current, ...additions] },
    usedSeeds: missing,
  };
};

export const isHomeDemoFillEnabled = isEnvTruthy(process.env.NEXT_PUBLIC_HOME_DEMO_FILL);
export const HOME_DEMO_MIN_SECTION_ITEMS = toSafeInt(
  process.env.NEXT_PUBLIC_HOME_DEMO_MIN_SECTION_ITEMS,
  4
);
export const HOME_DEMO_MIN_SECTIONS = toSafeInt(process.env.NEXT_PUBLIC_HOME_DEMO_MIN_SECTIONS, 2);
export const HOME_DEMO_ALL_ITEMS_TARGET = toSafeInt(
  process.env.NEXT_PUBLIC_HOME_DEMO_ALL_ITEMS_TARGET,
  12
);
export const HOME_REELS_MIN_TARGET = toSafeInt(process.env.NEXT_PUBLIC_HOME_REELS_MIN_TARGET, 6);

export const ensureFeaturedSectionsDemoFill = (
  featuredSections,
  {
    minSections = HOME_DEMO_MIN_SECTIONS,
    minItemsPerSection = HOME_DEMO_MIN_SECTION_ITEMS,
  } = {}
) => {
  const normalized = Array.isArray(featuredSections) ? featuredSections.map(normalizeSection) : [];
  let seedCursor = 0;

  const filledExisting = normalized.map((section) => {
    const { section: done, usedSeeds } = topUpSectionItems(section, minItemsPerSection, seedCursor);
    seedCursor += usedSeeds;
    return done;
  });

  const missingSectionCount = Math.max(0, minSections - filledExisting.length);
  const syntheticSections = Array.from({ length: missingSectionCount }, (_, idx) => {
    const sectionSeed = SECTION_SEEDS[idx % SECTION_SEEDS.length];
    const sectionIndex = filledExisting.length + idx;
    const baseSection = {
      id: 995000000 + sectionIndex,
      slug: `${sectionSeed.slug}-${sectionIndex + 1}`,
      title: sectionSeed.title,
      translated_name: sectionSeed.title,
      filter: "featured_ads",
      section_data: [],
    };

    const { section: done } = topUpSectionItems(baseSection, minItemsPerSection, seedCursor);
    seedCursor += minItemsPerSection;
    return done;
  });

  return [...filledExisting, ...syntheticSections];
};

export const ensureHomeAllItemsDemoFill = (
  items,
  { targetCount = HOME_DEMO_ALL_ITEMS_TARGET } = {}
) => {
  const safeItems = Array.isArray(items) ? [...items] : [];
  if (safeItems.length >= targetCount) return safeItems;

  const existingIds = new Set(
    safeItems
      .map((entry) => Number(entry?.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  );

  const needed = targetCount - safeItems.length;
  const additions = [];
  let seedCursor = safeItems.length;
  while (additions.length < needed) {
    const candidate = buildSeededListing({
      seed: seedCursor,
      idBase: 992000000,
      sectionSlug: "all-items",
      includeVideo: seedCursor % 4 === 0,
      featured: true,
    });
    if (!existingIds.has(Number(candidate.id))) {
      additions.push(candidate);
      existingIds.add(Number(candidate.id));
    }
    seedCursor += 1;
  }

  return [...safeItems, ...additions];
};

export const ensureHomeReelsFallbackItems = (
  items,
  { targetCount = HOME_REELS_MIN_TARGET } = {}
) => {
  const safeItems = Array.isArray(items) ? [...items] : [];
  if (safeItems.length >= targetCount) return safeItems;

  const existingIds = new Set(
    safeItems
      .map((entry) => Number(entry?.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  );

  const needed = targetCount - safeItems.length;
  const additions = [];
  let seedCursor = safeItems.length;
  while (additions.length < needed) {
    const candidate = buildSeededListing({
      seed: seedCursor,
      idBase: 996000000,
      sectionSlug: "reels",
      includeVideo: true,
      featured: false,
    });
    if (!existingIds.has(Number(candidate.id))) {
      additions.push(candidate);
      existingIds.add(Number(candidate.id));
    }
    seedCursor += 1;
  }

  return [...safeItems, ...additions];
};
