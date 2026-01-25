// hooks/useSavedSearches.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { savedSearchesApi } from "@/utils/savedSearchApi";

// ✅ Helper: uvijek vraća "front friendly" + "backend friendly" polja
function normalizeSavedSearch(item) {
  const naziv = item?.naziv ?? item?.name ?? item?.title ?? "";
  const queryString = item?.queryString ?? item?.query_string ?? item?.query ?? "";

  return {
    ...item,
    // frontend očekivanja
    naziv,
    queryString,
    // backend očekivanja / kompatibilnost sa postojećim komponentama
    name: naziv,
    query_string: queryString,
  };
}

// ✅ Helper: URL builder (traženo u SavedSearches.jsx)
export function buildSavedSearchUrl(queryString, basePath = "/ads") {
  const qs = (queryString || "").toString().trim();
  if (!qs) return basePath;

  const cleaned = qs.startsWith("?") ? qs.slice(1) : qs;
  return `${basePath}?${cleaned}`;
}

export function useSavedSearches({ context = "ads" } = {}) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await savedSearchesApi.list({ context });

      // podrška za više formata:
      // - { data: [...] }
      // - { data: { data: [...] } }
      // - { data: { data: { data: [...] } } }
      const payload = res?.data;
      const list = payload?.data?.data?.data || payload?.data?.data || payload?.data || payload || [];

      const normalized = Array.isArray(list) ? list.map(normalizeSavedSearch) : [];
      setSavedSearches(normalized);
    } catch (e) {
      // ne rušimo UI, samo očistimo listu
      setSavedSearches([]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ✅ Kreiranje: prihvata i {name, query_string} i {naziv, queryString}
  const createSavedSearch = useCallback(
    async (payload = {}) => {
      const name = payload?.naziv ?? payload?.name ?? "Moja pretraga";
      const query_string = payload?.queryString ?? payload?.query_string ?? "";

      const res = await savedSearchesApi.create({
        name,
        query_string,
        context,
      });

      await fetchAll();
      return res;
    },
    [context, fetchAll]
  );

  // ✅ Rename: radi i renameSavedSearch(id, naziv) i renameSavedSearch({id, name})
  const renameSavedSearch = useCallback(
    async (arg1, arg2) => {
      const id = typeof arg1 === "object" ? arg1?.id : arg1;
      const name =
        typeof arg1 === "object"
          ? arg1?.name ?? arg1?.naziv ?? ""
          : (arg2 ?? "").toString();

      if (!id) return;

      const res = await savedSearchesApi.update({ id, name });
      await fetchAll();
      return res;
    },
    [fetchAll]
  );

  // ✅ Delete: radi i deleteSavedSearch({id}) i deleteSavedSearch(id)
  const deleteSavedSearch = useCallback(
    async (arg) => {
      const id = typeof arg === "object" ? arg?.id : arg;
      if (!id) return;

      const res = await savedSearchesApi.remove({ id });
      await fetchAll();
      return res;
    },
    [fetchAll]
  );

  // ✅ Alias da SavedSearches.jsx radi bez diranja
  const removeSavedSearch = useCallback(
    async (id) => deleteSavedSearch(id),
    [deleteSavedSearch]
  );

  // ✅ "Obriši sve" bez posebnog backend endpointa (radi preko postojećeg DELETE)
  const clearSavedSearches = useCallback(async () => {
    const current = savedSearches || [];
    if (!current.length) return;

    // brišemo paralelno, pa refresh
    await Promise.allSettled(current.map((s) => savedSearchesApi.remove({ id: s.id })));
    await fetchAll();
  }, [savedSearches, fetchAll]);

  // ✅ markUsed: backend nema endpoint, ali UI dobija “recently used” osjećaj (prebaci na vrh)
  const markUsed = useCallback((id) => {
    if (!id) return;
    setSavedSearches((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx < 0) return prev;

      const item = prev[idx];
      const next = [item, ...prev.slice(0, idx), ...prev.slice(idx + 1)];

      return next;
    });
  }, []);

  return useMemo(
    () => ({
      savedSearches,
      isLoading,
      refresh: fetchAll,

      createSavedSearch,
      renameSavedSearch,
      deleteSavedSearch,

      // kompatibilnost sa ostalim komponentama
      removeSavedSearch,
      clearSavedSearches,
      markUsed,
    }),
    [
      savedSearches,
      isLoading,
      fetchAll,
      createSavedSearch,
      renameSavedSearch,
      deleteSavedSearch,
      removeSavedSearch,
      clearSavedSearches,
      markUsed,
    ]
  );
}
