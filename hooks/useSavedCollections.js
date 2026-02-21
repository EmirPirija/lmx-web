"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/utils/toastBs";
import { savedCollectionsApi } from "@/utils/api";

export function useSavedCollections() {
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const refreshLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const res = await savedCollectionsApi.lists();
      setLists(res?.data?.data || []);
    } catch (e) {
      setLists([]);
    } finally {
      setLoadingLists(false);
    }
  }, []);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const createList = useCallback(async (name) => {
    const clean = String(name || "").trim();
    if (clean.length < 2) return;
    try {
      const res = await savedCollectionsApi.createList({ name: clean });
      const created = res?.data?.data;
      toast.success("Lista je kreirana.");
      setLists((prev) => {
        const next = [...prev, created].filter(Boolean);
        return next.sort((a, b) => (b?.is_default ? 1 : 0) - (a?.is_default ? 1 : 0));
      });
      return created;
    } catch (e) {
      toast.error(e?.response?.data?.message || "Ne mogu kreirati listu.");
      return null;
    }
  }, []);

  return {
    lists,
    loadingLists,
    refreshLists,
    createList,
    setLists,
  };
}
