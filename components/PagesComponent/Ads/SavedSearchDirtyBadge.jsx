"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const OPEN_EVENT = "lmx:saved-search:open";
const SAVED_EVENT = "lmx:saved-search:saved";

const SavedSearchDirtyBadge = ({ className = "" }) => {
  const searchParams = useSearchParams();

  const queryString = useMemo(() => {
    // Normalizuj: kopiraj params da ih možeš po želji čistiti
    const sp = new URLSearchParams(searchParams.toString());

    // Ako ikad uvedeš "page" parametar za pagination, obično ga ne želiš u saved search
    sp.delete("page");

    return sp.toString();
  }, [searchParams]);

  const baselineRef = useRef(null);
  const [isDirty, setIsDirty] = useState(false);

  // Postavi baseline na prvom renderu, pa prati promjene
  useEffect(() => {
    if (baselineRef.current === null) baselineRef.current = queryString;
    setIsDirty(queryString !== baselineRef.current);
  }, [queryString]);

  // Kad se pretraga sačuva, resetuj baseline da badge nestane
  useEffect(() => {
    const onSaved = (e) => {
      const savedQs = e?.detail?.queryString;
      baselineRef.current = typeof savedQs === "string" ? savedQs : queryString;
      setIsDirty(false);
    };

    window.addEventListener(SAVED_EVENT, onSaved);
    return () => window.removeEventListener(SAVED_EVENT, onSaved);
  }, [queryString]);

  if (!isDirty) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_EVENT))}
      title="Sačuvaj ovu pretragu"
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
        "text-xs font-bold",
        "bg-amber-50 text-amber-700 border border-amber-200",
        "hover:bg-amber-100 transition-colors",
        "animate-in fade-in duration-200",
        className,
      ].join(" ")}
    >
      <span aria-hidden>⭐</span>
      Sačuvaj
    </button>
  );
};

export default SavedSearchDirtyBadge;
