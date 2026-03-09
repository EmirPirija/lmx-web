export const SLUG_ROUTE_MAPPINGS = [
  { legacy: "/ad-listing", localized: "/objavi-oglas" },
  { legacy: "/ad-details", localized: "/oglas" },
  { legacy: "/about-us", localized: "/o-nama" },
  { legacy: "/contact-us", localized: "/kontakt" },
  { legacy: "/faqs", localized: "/cesta-pitanja" },
  { legacy: "/terms-and-condition", localized: "/uslovi-koristenja" },
  { legacy: "/privacy-policy", localized: "/politika-privatnosti" },
  { legacy: "/refund-policy", localized: "/politika-povrata" },
  { legacy: "/data-deletion", localized: "/brisanje-podataka" },
  { legacy: "/map-search", localized: "/pretraga-mapa" },
  { legacy: "/subscription", localized: "/pretplata" },
  { legacy: "/blogs", localized: "/blog" },
  { legacy: "/seller", localized: "/prodavac" },
  { legacy: "/shop", localized: "/prodavnica" },
  { legacy: "/ads", localized: "/oglasi" },
];

const splitPath = (path) => {
  const [pathAndQuery, hash = ""] = String(path || "").split("#");
  const [pathname = "", query = ""] = pathAndQuery.split("?");
  return { pathname, query, hash };
};

const matchPrefix = (pathname, prefix) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const replacePrefix = (pathname, from, to) => {
  if (!matchPrefix(pathname, from)) return pathname;
  return `${to}${pathname.slice(from.length)}`;
};

export const localizeInternalPath = (path) => {
  if (typeof path !== "string" || !path.startsWith("/")) return path;

  const { pathname, query, hash } = splitPath(path);
  let localizedPathname = pathname;

  for (const route of SLUG_ROUTE_MAPPINGS) {
    localizedPathname = replacePrefix(
      localizedPathname,
      route.legacy,
      route.localized,
    );
  }

  const queryPart = query ? `?${query}` : "";
  const hashPart = hash ? `#${hash}` : "";
  return `${localizedPathname}${queryPart}${hashPart}`;
};
