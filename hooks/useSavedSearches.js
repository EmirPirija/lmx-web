"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { savedSearchesApi } from "@/utils/savedSearchApi";

export function useSavedSearches({ context = "ads" } = {}) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await savedSearchesApi.list({ context });
      // očekujemo { error: false, data: [...] } ili { data: { data: [...] } } zavisno od backend formata
      const payload = res?.data;
      const list = payload?.data || payload?.data?.data || payload || [];
      setSavedSearches(Array.isArray(list) ? list : []);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createSavedSearch = useCallback(
    async ({ name, query_string }) => {
      const res = await savedSearchesApi.create({
        name,
        query_string,
        context,
      });

      // nakon create — reload da bude 100% tačno
      await fetchAll();
      return res;
    },
    [context, fetchAll]
  );

  const renameSavedSearch = useCallback(
    async ({ id, name }) => {
      const res = await savedSearchesApi.update({ id, name });
      await fetchAll();
      return res;
    },
    [fetchAll]
  );

  const deleteSavedSearch = useCallback(
    async ({ id }) => {
      const res = await savedSearchesApi.remove({ id });
      await fetchAll();
      return res;
    },
    [fetchAll]
  );

  return useMemo(
    () => ({
      savedSearches,
      isLoading,
      refresh: fetchAll,
      createSavedSearch,
      renameSavedSearch,
      deleteSavedSearch,
    }),
    [savedSearches, isLoading, fetchAll, createSavedSearch, renameSavedSearch, deleteSavedSearch]
  );
}
