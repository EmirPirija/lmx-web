const LEGACY_DEFAULT_NAME_SET = new Set([
  "moji agenti",
  "provjereni shopovi",
  "provereni shopovi",
]);

const normalizeName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/[š]/g, "s")
    .replace(/đ/g, "d")
    .replace(/ž/g, "z")
    .replace(/\s+/g, " ");

export const getSavedCollectionDisplayName = (list) => {
  if (!list || typeof list !== "object") return "Prodavači";

  const raw = String(list?.name || "").trim();
  const normalized = normalizeName(raw);

  if (Boolean(list?.is_default)) return "Prodavači";
  if (LEGACY_DEFAULT_NAME_SET.has(normalized)) return "Prodavači";
  return raw || "Prodavači";
};

export const sanitizeSavedCollections = (lists = []) => {
  if (!Array.isArray(lists)) return [];

  let hasPrimaryDefault = false;

  return lists.reduce((acc, list) => {
    if (!list || typeof list !== "object") return acc;

    const raw = String(list?.name || "").trim();
    const normalized = normalizeName(raw);
    const isLegacyDefault = LEGACY_DEFAULT_NAME_SET.has(normalized);

    if (isLegacyDefault) return acc;

    const displayName = getSavedCollectionDisplayName(list);
    const isPrimaryDefault = displayName === "Prodavači";

    if (isPrimaryDefault) {
      if (hasPrimaryDefault) return acc;
      hasPrimaryDefault = true;
    }

    acc.push({
      ...list,
      display_name: displayName,
    });

    return acc;
  }, []);
};
