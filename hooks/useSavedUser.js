"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { savedUsersApi } from "@/utils/api";

export function useSavedUser(sellerId, { enabled = true } = {}) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled || !sellerId) return;
    setBooting(true);
    try {
      const res = await savedUsersApi.check({ saved_user_id: sellerId });
      const v = Boolean(res?.data?.data?.saved);
      setSaved(v);
    } catch {
      // ako user nije logovan, backend će vratiti 401 — samo preskoči
      setSaved(false);
    } finally {
      setBooting(false);
    }
  }, [enabled, sellerId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    if (!sellerId) return;

    const optimistic = !saved;
    setSaved(optimistic);
    setLoading(true);

    try {
      const res = await savedUsersApi.toggle({ saved_user_id: sellerId });
      const real = Boolean(res?.data?.data?.saved);
      setSaved(real);

      toast.success(real ? "Sačuvano." : "Uklonjeno iz sačuvanih.");
    } catch (e) {
      // revert
      setSaved((prev) => !prev);
      toast.error("Ne mogu sačuvati trenutno. Pokušaj ponovo.");
    } finally {
      setLoading(false);
    }
  }, [sellerId, saved]);

  return { saved, loading, booting, toggle, refresh };
}
