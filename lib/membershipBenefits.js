const normalizeTierToken = (value) => {
  const token = String(value || "").trim().toLowerCase();
  if (!token) return "free";
  if (token.includes("shop") || token.includes("business") || token.includes("trgovina")) {
    return "shop";
  }
  if (token.includes("pro") || token.includes("premium")) {
    return "pro";
  }
  return "free";
};

export const resolveMembershipTierSlug = (source) => {
  if (!source) return "free";

  if (typeof source === "string") {
    return normalizeTierToken(source);
  }

  const tokens = [
    source?.slug,
    source?.tier,
    source?.tier_name,
    source?.membership_tier,
    source?.membershipType,
    source?.name,
    source?.label,
    source?.membership?.tier,
    source?.membership?.tier_name,
    source?.membership?.plan,
  ];

  for (const token of tokens) {
    const normalized = normalizeTierToken(token);
    if (normalized !== "free") return normalized;
  }

  return "free";
};

const PRO_BENEFITS = [
  "Napredna statistika oglasa: kontakti, izvori posjeta, pojmovi i pozicija u pretrazi.",
  "Filteri kupcima na stranici prodavača (pretraga, cijena, video, akcija, izdvojeni).",
  "PRO oznaka na profilu i karticama prodavača.",
  "Veća vidljivost kroz filtre tipa prodavača (PRO i PRO+SHOP).",
];

const SHOP_EXTRA_BENEFITS = [
  "Vođenje zaliha po oglasu (količina na zalihi).",
  "Interna šifra proizvoda (SKU) za internu evidenciju.",
  "Upload računa pri prodaji i slanje računa kupcu u Moje kupovine.",
  "Shop statistika: pregledi po satima, konverzije, geografski uvidi i rang u kategoriji.",
];

export const getRealMembershipBenefits = (tierLike, options = {}) => {
  const { includeProForShop = true } = options;
  const tier = resolveMembershipTierSlug(tierLike);

  if (tier === "pro") return PRO_BENEFITS;
  if (tier === "shop") {
    return includeProForShop
      ? [...PRO_BENEFITS, ...SHOP_EXTRA_BENEFITS]
      : SHOP_EXTRA_BENEFITS;
  }

  return [];
};

