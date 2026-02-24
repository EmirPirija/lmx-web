"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronDown, Loader2 } from "@/components/Common/UnifiedIconPack";
import {
  categoryApi,
  getCustomFieldsApi,
  getParentCategoriesApi,
} from "@/utils/api";

const SUPPORTED_TYPES = new Set(["dropdown", "radio", "checkbox"]);

const normalizeValues = (values) =>
  Array.isArray(values)
    ? values.filter((value) => String(value || "").trim())
    : [];

const getSelectPromptText = (label, fallback = "Odaberi vrijednost") => {
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) return fallback;
  return `${fallback} (${cleanLabel})`;
};

const parseDropdownMapping = (values = []) => {
  const mapping = {};
  const allValues = [];

  values.forEach((rawValue) => {
    const item = String(rawValue || "").trim();
    if (!item) return;

    const separatorIndex = item.indexOf(":");
    if (separatorIndex <= 0) {
      allValues.push(item);
      return;
    }

    const parent = item.slice(0, separatorIndex).trim();
    const childrenRaw = item.slice(separatorIndex + 1);
    const children = childrenRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!parent || children.length === 0) {
      allValues.push(item);
      return;
    }

    if (!Array.isArray(mapping[parent])) {
      mapping[parent] = [];
    }
    const merged = [...mapping[parent], ...children];
    mapping[parent] = [...new Set(merged)];
    allValues.push(...children);
  });

  return {
    mapping,
    allValues: [...new Set(allValues)],
  };
};

const SearchableFilterDropdown = ({
  id,
  label,
  options = [],
  value = "",
  onChange,
  placeholder,
  isDisabled = false,
  helperText = "",
}) => {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedValue = String(value || "");

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      String(option?.label || "")
        .toLowerCase()
        .includes(query),
    );
  }, [options, searchQuery]);

  const selectedOption = useMemo(
    () =>
      options.find((option) => String(option?.value || "") === normalizedValue),
    [options, normalizedValue],
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  return (
    <div id={`filter-dropdown-${id}`} ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen((current) => !current)}
        disabled={isDisabled}
        className={`flex min-h-11 w-full touch-manipulation items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
          isDisabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100/70 text-slate-400 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-500"
            : "border-slate-300/80 bg-white/95 text-slate-700 hover:border-[#0ab6af]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0ab6af]/35 dark:border-slate-600/80 dark:bg-slate-900 dark:text-slate-200"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span
          className={`truncate text-sm ${
            selectedOption
              ? "font-medium text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {selectedOption?.label || placeholder || getSelectPromptText(label)}
        </span>

        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          } ${isDisabled ? "text-slate-300 dark:text-slate-600" : "text-slate-400"}`}
        />
      </button>

      {isOpen && !isDisabled ? (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-2.5 dark:border-slate-700">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Pretraži..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition-all focus:border-[#0ab6af]/80 focus:ring-2 focus:ring-[#0ab6af]/30 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              />
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const optionValue = String(option?.value || "");
                const isSelected = optionValue === normalizedValue;
                return (
                  <button
                    key={`${id}-${optionValue}`}
                    type="button"
                    onClick={() => {
                      onChange(optionValue);
                      setIsOpen(false);
                    }}
                    className={`flex min-h-11 w-full touch-manipulation items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? "bg-[#0ab6af]/12 text-[#0ab6af]"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <span className="truncate">
                      {option?.label || optionValue}
                    </span>
                    {isSelected ? (
                      <svg
                        className="h-4 w-4 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : null}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Nema rezultata.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {helperText ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

const PopularCategoryFilterModal = ({ open, onOpenChange, category }) => {
  const router = useRouter();
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [fields, setFields] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedValues, setSelectedValues] = useState({});
  const [loadError, setLoadError] = useState("");

  const selectedCategoryLabel =
    selectedCategory?.translated_name || selectedCategory?.name || "Kategorija";
  const parentCategoryLabel =
    category?.translated_name || category?.name || "Kategorija";
  const requiresSubcategoryChoice = subcategories.length > 0;

  const subcategoryOptions = useMemo(
    () =>
      subcategories.map((entry) => ({
        value: String(entry?.id || ""),
        label: entry?.translated_name || entry?.name || "Podkategorija",
      })),
    [subcategories],
  );

  useEffect(() => {
    if (!open || !category?.id || !category?.slug) return undefined;

    let cancelled = false;
    const fetchSubcategories = async () => {
      setIsLoadingSubcategories(true);
      setLoadError("");
      setFields([]);
      setSubcategories([]);
      setSelectedValues({});
      setSelectedCategory(null);

      try {
        const subcategoriesResponse = await categoryApi.getCategory({
          category_id: category.id,
          page: 1,
          per_page: 200,
        });

        const children = Array.isArray(subcategoriesResponse?.data?.data?.data)
          ? subcategoriesResponse.data.data.data
          : [];

        if (cancelled) return;

        setSubcategories(children);
        if (children.length === 0) {
          setSelectedCategory(category);
        } else {
          setSelectedCategory(children[0]);
        }
      } catch (error) {
        console.error("Popular category subcategory load error:", error);
        if (!cancelled) {
          setSelectedCategory(category);
        }
      } finally {
        if (!cancelled) setIsLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
    return () => {
      cancelled = true;
    };
  }, [open, category?.id, category?.slug]);

  useEffect(() => {
    if (!open || !selectedCategory?.slug) return undefined;

    let cancelled = false;
    const fetchCategoryFilters = async () => {
      setIsLoadingFilters(true);
      setLoadError("");
      setFields([]);
      setSelectedValues({});

      try {
        const treeResponse = await getParentCategoriesApi.getPaymentCategories({
          slug: selectedCategory.slug,
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
          filter: false,
        });
        const rawFields = Array.isArray(customFieldsResponse?.data?.data)
          ? customFieldsResponse.data.data
          : [];

        const preparedFields = rawFields
          .map((field) => ({
            ...field,
            type: String(field?.type || "").toLowerCase(),
            values: normalizeValues(field?.values),
            translated_value: Array.isArray(field?.translated_value)
              ? field.translated_value
              : [],
          }))
          .filter(
            (field) =>
              SUPPORTED_TYPES.has(field.type) &&
              field.values.length > 0 &&
              field.id !== null &&
              field.id !== undefined,
          );

        if (!cancelled) setFields(preparedFields);
      } catch (error) {
        console.error("Popular category filter load error:", error);
        if (!cancelled) {
          setLoadError(
            "Filteri trenutno nisu dostupni. Možeš nastaviti bez filtera.",
          );
          setFields([]);
        }
      } finally {
        if (!cancelled) setIsLoadingFilters(false);
      }
    };

    fetchCategoryFilters();
    return () => {
      cancelled = true;
    };
  }, [open, selectedCategory?.slug]);

  const structuredFields = useMemo(
    () =>
      fields.map((field, index) => {
        const fieldId = String(field.id);
        const translatedName = field.translated_name || field.name || "Polje";

        if (field.type !== "dropdown") {
          return {
            ...field,
            fieldId,
            label: translatedName,
            dropdownMeta: null,
          };
        }

        const { mapping } = parseDropdownMapping(field.values);
        const hasMapping = Object.keys(mapping).length > 0;
        let parentFieldId = null;

        if (hasMapping) {
          const mappingKeys = Object.keys(mapping);
          for (
            let parentIndex = index - 1;
            parentIndex >= 0;
            parentIndex -= 1
          ) {
            const candidate = fields[parentIndex];
            if (String(candidate?.type || "").toLowerCase() !== "dropdown") {
              continue;
            }
            const candidateValues = normalizeValues(candidate?.values).map(
              (value) => String(value).trim(),
            );
            const hasAllKeys = mappingKeys.every((key) =>
              candidateValues.includes(key),
            );
            if (hasAllKeys) {
              parentFieldId = String(candidate.id);
              break;
            }
          }
        }

        return {
          ...field,
          fieldId,
          label: translatedName,
          dropdownMeta: {
            hasMapping,
            mapping,
            parentFieldId,
          },
        };
      }),
    [fields],
  );

  useEffect(() => {
    if (!structuredFields.length) return;

    setSelectedValues((prev) => {
      let hasChanged = false;
      const next = { ...prev };

      structuredFields.forEach((field) => {
        const meta = field.dropdownMeta;
        if (!meta?.hasMapping || !meta?.parentFieldId) return;

        const fieldId = String(field.id);
        const selectedChild = next[fieldId];
        if (!selectedChild) return;

        const selectedParent = next[meta.parentFieldId];
        const allowedOptions = selectedParent
          ? meta.mapping[selectedParent] || []
          : [];

        if (!allowedOptions.includes(selectedChild)) {
          delete next[fieldId];
          hasChanged = true;
        }
      });

      return hasChanged ? next : prev;
    });
  }, [structuredFields, selectedValues]);

  const hasSelectedFilters = useMemo(
    () =>
      Object.values(selectedValues).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value),
      ),
    [selectedValues],
  );

  const setSingleValue = (fieldId, value) => {
    setSelectedValues((prev) => {
      const key = String(fieldId);
      if (!value) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  };

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
      const nextValues = exists
        ? current.filter((item) => item !== value)
        : [...current, value];

      if (!nextValues.length) {
        const next = { ...prev };
        delete next[key];
        return next;
      }

      return { ...prev, [key]: nextValues };
    });
  };

  const navigateToAds = (withSelectedFilters) => {
    const activeCategory = selectedCategory || category;
    if (!activeCategory?.slug) return;

    const params = new URLSearchParams();
    params.set("category", activeCategory.slug);

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
            Kategorija:{" "}
            <span className="font-semibold text-foreground">
              {parentCategoryLabel}
            </span>
            .
            {requiresSubcategoryChoice
              ? " Odaberi podkategoriju i koristi napredne filtere kao na objavi/edit."
              : " Odaberi vrijednosti ili nastavi bez filtera."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 py-4 sm:px-6">
          {isLoadingSubcategories ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 p-3 text-sm text-slate-600 dark:bg-slate-800/55 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Učitavanje podkategorija...
            </div>
          ) : null}

          {!isLoadingSubcategories && requiresSubcategoryChoice ? (
            <section className="rounded-xl bg-slate-100/55 p-3 dark:bg-slate-800/35">
              <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Odaberi podkategoriju
              </h4>
              <SearchableFilterDropdown
                id="modal-subcategory"
                label="Podkategorija"
                options={subcategoryOptions}
                value={selectedCategory?.id ? String(selectedCategory.id) : ""}
                onChange={(nextId) => {
                  const nextCategory =
                    subcategories.find(
                      (entry) =>
                        String(entry?.id || "") === String(nextId || ""),
                    ) || null;
                  setSelectedCategory(nextCategory);
                }}
                placeholder="Odaberi podkategoriju..."
              />
            </section>
          ) : null}

          {isLoadingFilters ? (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100/70 p-3 text-sm text-slate-600 dark:bg-slate-800/55 dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Učitavanje filtera...
            </div>
          ) : null}

          {!isLoadingFilters && loadError ? (
            <div className="rounded-xl bg-amber-50/90 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-500/12 dark:text-amber-200">
              {loadError}
            </div>
          ) : null}

          {!isLoadingFilters &&
          !requiresSubcategoryChoice &&
          !structuredFields.length &&
          !loadError ? (
            <div className="rounded-xl bg-slate-100/70 px-3 py-2.5 text-sm text-slate-600 dark:bg-slate-800/55 dark:text-slate-300">
              Za ovu kategoriju trenutno nema dodatnih filtera.
            </div>
          ) : null}

          {!isLoadingFilters &&
          requiresSubcategoryChoice &&
          selectedCategory &&
          !structuredFields.length &&
          !loadError ? (
            <div className="rounded-xl bg-slate-100/70 px-3 py-2.5 text-sm text-slate-600 dark:bg-slate-800/55 dark:text-slate-300">
              Za podkategoriju{" "}
              <span className="font-semibold">{selectedCategoryLabel}</span>{" "}
              trenutno nema dodatnih filtera.
            </div>
          ) : null}

          {!isLoadingFilters &&
            structuredFields.map((field) => {
              const fieldId = String(field.id);
              const label = field.label;
              const current = selectedValues[fieldId];

              if (field.type === "dropdown") {
                const meta = field.dropdownMeta;
                const parentFieldId = meta?.parentFieldId;
                const parentField = structuredFields.find(
                  (entry) => String(entry.id) === String(parentFieldId || ""),
                );
                const parentLabel =
                  parentField?.translated_name ||
                  parentField?.name ||
                  "nadređeno polje";
                const parentValue = parentFieldId
                  ? selectedValues[parentFieldId]
                  : null;

                let dropdownOptions = [];
                let isDisabled = false;
                let helperText = "";

                if (meta?.hasMapping) {
                  if (!parentValue) {
                    isDisabled = true;
                    helperText = `Prvo odaberi ${parentLabel.toLowerCase()} da vidiš dostupne vrijednosti.`;
                  } else {
                    const mappedValues = meta.mapping[parentValue] || [];
                    dropdownOptions = mappedValues.map((value) => ({
                      value: String(value),
                      label: String(value),
                    }));
                  }
                } else {
                  dropdownOptions = field.values.map((value, valueIndex) => ({
                    value: String(value),
                    label:
                      field?.translated_value?.[valueIndex] || String(value),
                  }));
                }

                return (
                  <section
                    key={fieldId}
                    className="rounded-xl bg-slate-100/55 p-3 dark:bg-slate-800/35"
                  >
                    <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {label}
                    </h4>

                    <SearchableFilterDropdown
                      id={`field-${fieldId}`}
                      label={label}
                      options={dropdownOptions}
                      value={current || ""}
                      onChange={(value) => setSingleValue(fieldId, value)}
                      isDisabled={isDisabled}
                      helperText={helperText}
                    />
                  </section>
                );
              }

              return (
                <section
                  key={fieldId}
                  className="rounded-xl bg-slate-100/55 p-3 dark:bg-slate-800/35"
                >
                  <h4 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {label}
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {field.values.map((value, index) => {
                      const translatedValue =
                        field?.translated_value?.[index] || value;
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
                          className={`min-h-10 rounded-full px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
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
