"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "@/components/Common/UnifiedIconPack";
import { getCustomFieldsApi, getParentCategoriesApi } from "@/utils/api";

const SUPPORTED_TYPES = new Set(["dropdown", "radio", "checkbox"]);

const normalizeValues = (values) =>
  Array.isArray(values) ? values.filter((value) => String(value || "").trim()) : [];

const PopularCategoryFilterModal = ({ open, onOpenChange, category }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fields, setFields] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [loadError, setLoadError] = useState("");

  const categoryLabel = category?.translated_name || category?.name || "Kategorija";

  useEffect(() => {
    if (!open || !category?.slug) return undefined;

    let cancelled = false;
    const fetchCategoryFilters = async () => {
      setIsLoading(true);
      setLoadError("");
      setSelectedValues({});

      try {
        const treeResponse = await getParentCategoriesApi.getPaymentCategories({
          slug: category.slug,
          tree: 0,
        });

        const categoryChain = Array.isArray(treeResponse?.data?.data)
          ? treeResponse.data.data
          : [];
        const categoryIds = categoryChain
          .map((entry) => Number(entry?.id))
          .filter((entry) => Number.isFinite(entry) && entry > 0)
          .join(",");

        if (!categoryIds) {
          if (!cancelled) setFields([]);
          return;
        }

        const customFieldsResponse = await getCustomFieldsApi.getCustomFields({
          category_ids: categoryIds,
          filter: true,
        });
        const rawFields = Array.isArray(customFieldsResponse?.data?.data)
          ? customFieldsResponse.data.data
          : [];

        const preparedFields = rawFields
          .map((field) => ({
            ...field,
            type: String(field?.type || "").toLowerCase(),
            values: normalizeValues(field?.values),
          }))
          .filter(
            (field) =>
              SUPPORTED_TYPES.has(field.type) &&
              field.values.length > 0 &&
              field.id !== null &&
              field.id !== undefined
          );

        if (!cancelled) setFields(preparedFields);
      } catch (error) {
        console.error("Popular category filter load error:", error);
        if (!cancelled) {
          setLoadError("Filteri trenutno nisu dostupni. Možeš nastaviti bez filtera.");
          setFields([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchCategoryFilters();
    return () => {
      cancelled = true;
    };
  }, [open, category?.slug]);

  const hasSelectedFilters = useMemo(
    () =>
      Object.values(selectedValues).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      ),
    [selectedValues]
  );

  const toggleSingleValue = (fieldId, value) => {
    setSelectedValues((prev) => {
      const key = String(fieldId);
      const current = prev[key];
      if (current === value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

  const toggleCheckboxValue = (fieldId, value) => {
    setSelectedValues((prev) => {
      const key = String(fieldId);
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = current.includes(value);
      const nextValues = exists ? current.filter((item) => item !== value) : [...current, value];

      if (!nextValues.length) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      return { ...prev, [key]: nextValues };
    });
  };

  const navigateToAds = (withSelectedFilters) => {
    if (!category?.slug) return;

    const params = new URLSearchParams();
    params.set("category", category.slug);

    if (withSelectedFilters) {
      Object.entries(selectedValues).forEach(([fieldId, fieldValue]) => {
        if (Array.isArray(fieldValue)) {
          if (fieldValue.length) params.set(fieldId, fieldValue.join(","));
          return;
        }
        if (fieldValue) params.set(fieldId, String(fieldValue));
      });
    }

    onOpenChange(false);
    router.push(`/ads?${params.toString()}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-[760px] overflow-y-auto rounded-[28px] border border-slate-200/70 bg-white/95 p-0 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.55)] dark:border-slate-700/70 dark:bg-slate-900/95">
        <DialogHeader className="border-b border-slate-200/70 px-4 pb-3 pt-4 sm:px-6 dark:border-slate-700/70">
          <DialogTitle>Filtriraj prije pretrage</DialogTitle>
          <DialogDescription>
            Kategorija: <span className="font-semibold text-foreground">{categoryLabel}</span>. Odaberi vrijednosti
            ili nastavi bez filtera.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 p-3 text-sm text-slate-600 dark:bg-slate-800/55 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Učitavanje filtera...
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <div className="rounded-xl bg-amber-50/90 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-500/12 dark:text-amber-200">
              {loadError}
            </div>
          ) : null}

          {!isLoading && !fields.length && !loadError ? (
            <div className="rounded-xl bg-slate-100/70 px-3 py-2.5 text-sm text-slate-600 dark:bg-slate-800/55 dark:text-slate-300">
              Za ovu kategoriju trenutno nema dodatnih filtera.
            </div>
          ) : null}

          {!isLoading &&
            fields.map((field) => {
              const fieldId = String(field.id);
              const label = field.translated_name || field.name;
              const current = selectedValues[fieldId];

              return (
                <section
                  key={fieldId}
                  className="rounded-xl bg-slate-100/55 p-3 dark:bg-slate-800/35"
                >
                  <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</h4>

                  <div className="flex flex-wrap gap-2">
                    {field.values.map((value, index) => {
                      const translatedValue = field?.translated_value?.[index] || value;
                      const isActive = Array.isArray(current)
                        ? current.includes(value)
                        : current === value;

                      return (
                        <button
                          key={`${fieldId}-${value}`}
                          type="button"
                          onClick={() =>
                            field.type === "checkbox"
                              ? toggleCheckboxValue(fieldId, value)
                              : toggleSingleValue(fieldId, value)
                          }
                          className={`rounded-full px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                            isActive
                              ? "bg-[#0ab6af] text-white shadow-[0_8px_20px_-12px_rgba(10,182,175,0.75)]"
                              : "bg-white/75 text-slate-600 hover:bg-white dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-900/85"
                          }`}
                        >
                          {translatedValue}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </div>

        <DialogFooter className="gap-2 border-t border-slate-200/70 px-4 py-4 sm:px-6 dark:border-slate-700/70">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigateToAds(false)}
            className="border-slate-300/80 bg-white/85 text-slate-700 dark:border-slate-600/80 dark:bg-slate-900 dark:text-slate-200"
          >
            Prikaži sve
          </Button>
          <Button
            type="button"
            onClick={() => navigateToAds(true)}
            className="bg-[#0ab6af] text-white hover:bg-[#099f9a]"
          >
            {hasSelectedFilters ? "Primijeni i nastavi" : "Nastavi bez filtera"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PopularCategoryFilterModal;
