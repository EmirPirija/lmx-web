"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronsUpDown,
  Globe,
  MapPin,
  Search,
  X,
} from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BIH_COUNTRY,
  POPULAR_CITIES,
  getCities,
  getCityById,
  getMunicipalitiesByCity,
  searchLocations,
  formatBiHAddress,
  isLocationComplete,
  resolveLocationSelection,
} from "@/lib/bih-locations";

const CONTENT_ANIMATION = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.2, ease: "easeOut" },
};

const buildNextValue = (baseValue = {}, updates = {}) => ({
  ...baseValue,
  ...updates,
  entityId: "bih",
  regionId: updates.cityId ?? baseValue.regionId ?? null, // legacy kompatibilnost
});

const normalizeLocationValue = (value = {}) => {
  const resolved = resolveLocationSelection(value);
  if (!resolved) return value;

  return {
    ...value,
    entityId: "bih",
    cityId: value.cityId || resolved.city?.id || null,
    regionId: value.regionId || resolved.city?.id || null,
    municipalityId: value.municipalityId || resolved.municipality?.id || null,
    formattedAddress:
      value.formattedAddress ||
      formatBiHAddress({ city: resolved.city, municipality: resolved.municipality }),
  };
};

const BiHLocationSelector = ({
  value = {},
  onChange,
  showAddress = true,
  compact = false,
  disabled = false,
  error,
  label,
  className,
}) => {
  const normalizedValue = useMemo(() => normalizeLocationValue(value), [value]);

  const [cityOpen, setCityOpen] = useState(false);
  const [municipalityOpen, setMunicipalityOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  const selectedCity = useMemo(
    () => getCityById(normalizedValue?.cityId || normalizedValue?.regionId),
    [normalizedValue?.cityId, normalizedValue?.regionId]
  );

  const municipalities = useMemo(
    () => (selectedCity ? getMunicipalitiesByCity(selectedCity.id) : []),
    [selectedCity]
  );

  const selectedMunicipality = useMemo(() => {
    if (!normalizedValue?.municipalityId) return null;
    return municipalities.find((item) => item.id === normalizedValue.municipalityId) || null;
  }, [municipalities, normalizedValue?.municipalityId]);

  const locationResolved = useMemo(
    () => resolveLocationSelection(normalizedValue),
    [normalizedValue]
  );

  const locationIsComplete = useMemo(
    () => isLocationComplete(normalizedValue),
    [normalizedValue]
  );

  const searchResults = useMemo(() => {
    if (quickSearch.trim().length < 2) return [];
    return searchLocations(quickSearch);
  }, [quickSearch]);

  const summaryAddress = useMemo(() => {
    if (!locationResolved) return "";

    const base = formatBiHAddress({
      city: locationResolved.city,
      municipality: locationResolved.municipality,
    });

    if (normalizedValue?.address) {
      return `${normalizedValue.address}, ${base}`;
    }
    return base;
  }, [locationResolved, normalizedValue?.address]);

  const handleCityChange = (cityId) => {
    const city = getCityById(cityId);
    if (!city) return;

    const hasMunicipalities = city.municipalities.length > 0;
    const nextValue = buildNextValue(normalizedValue, {
      cityId,
      municipalityId: null,
      formattedAddress: formatBiHAddress({ city, municipality: null }),
    });

    onChange?.(nextValue);
    setCityOpen(false);

    if (hasMunicipalities) {
      setMunicipalityOpen(true);
    }
  };

  const handleMunicipalityChange = (municipalityId) => {
    if (!selectedCity) return;

    const municipality = municipalities.find((item) => item.id === municipalityId) || null;
    const nextValue = buildNextValue(normalizedValue, {
      cityId: selectedCity.id,
      municipalityId: municipality?.id || null,
      formattedAddress: formatBiHAddress({ city: selectedCity, municipality }),
    });

    onChange?.(nextValue);
    setMunicipalityOpen(false);
  };

  const handleQuickSelect = (result) => {
    const city = getCityById(result.cityId);
    if (!city) return;

    const municipality =
      city.municipalities.find((item) => item.id === result.municipalityId) || null;

    onChange?.(
      buildNextValue(normalizedValue, {
        cityId: city.id,
        municipalityId: municipality?.id || null,
        formattedAddress: formatBiHAddress({ city, municipality }),
      })
    );

    setQuickSearch("");
    setQuickOpen(false);
  };

  const handleAddressChange = (event) => {
    onChange?.({
      ...normalizedValue,
      address: event.target.value,
    });
  };

  const handleClear = () => {
    onChange?.({
      ...normalizedValue,
      cityId: null,
      regionId: null,
      municipalityId: null,
      address: "",
      formattedAddress: "",
    });
    setQuickSearch("");
  };

  const compactTitle = summaryAddress || "Odaberi lokaciju";

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {label ? <Label className="text-sm font-medium">{label}</Label> : null}

        <Popover open={quickOpen} onOpenChange={setQuickOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                "h-11 w-full justify-between rounded-xl transition-all duration-200 hover:border-primary/40",
                !locationResolved && "text-muted-foreground",
                error && "border-red-500"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{compactTitle}</span>
              </span>
              {locationResolved ? (
                <X
                  className="h-4 w-4 shrink-0 opacity-60 hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClear();
                  }}
                />
              ) : (
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[min(90vw,420px)] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Pretraži grad ili općinu..."
                value={quickSearch}
                onValueChange={setQuickSearch}
              />
              <CommandList>
                {quickSearch.trim().length >= 2 ? (
                  searchResults.length ? (
                    <CommandGroup heading="Rezultati">
                      {searchResults.map((result) => (
                        <CommandItem
                          key={`${result.cityId}:${result.municipalityId || "city"}`}
                          value={`${result.cityId}:${result.municipalityId || "city"}`}
                          onSelect={() => handleQuickSelect(result)}
                        >
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {result.displayName}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {result.formatted}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>Nema rezultata za pretragu.</CommandEmpty>
                  )
                ) : (
                  <CommandGroup heading="Popularni gradovi">
                    {POPULAR_CITIES.map((city) => (
                      <CommandItem
                        key={city.id}
                        value={city.id}
                        onSelect={() => handleCityChange(city.id)}
                      >
                        <MapPin className="mr-2 h-4 w-4 text-primary" />
                        <span>{city.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {showAddress && locationIsComplete ? (
          <Input
            value={normalizedValue?.address || ""}
            onChange={handleAddressChange}
            disabled={disabled}
            placeholder="Detaljnija lokacija (opcionalno)"
            className="h-10 rounded-xl"
          />
        ) : null}

        {error ? <p className="text-xs text-red-500">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">
          {label || "Lokacija"}
        </Label>
        {(normalizedValue?.cityId || normalizedValue?.municipalityId) && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleClear}
          >
            Očisti
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/80 p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Država</Label>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{BIH_COUNTRY.name}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Grad</Label>
            <Popover open={cityOpen} onOpenChange={setCityOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                className={cn(
                    "h-11 w-full justify-between rounded-xl transition-all duration-200 hover:border-primary/40",
                    !selectedCity && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">{selectedCity?.name || "Odaberi grad"}</span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(92vw,340px)] p-0">
                <Command>
                  <CommandInput placeholder="Pretraži grad..." />
                  <CommandList>
                    <CommandEmpty>Nema rezultata.</CommandEmpty>
                    <CommandGroup>
                      {getCities().map((city) => (
                        <CommandItem
                          key={city.id}
                          value={`${city.name} ${city.id}`}
                          onSelect={() => handleCityChange(city.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCity?.id === city.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate">{city.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Općina</Label>
            <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled || !selectedCity || municipalities.length === 0}
                  className={cn(
                    "h-11 w-full justify-between rounded-xl transition-all duration-200 hover:border-primary/40",
                    !selectedMunicipality && "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {selectedMunicipality?.name || "Odaberi općinu"}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[min(92vw,340px)] p-0">
                <Command>
                  <CommandInput placeholder="Pretraži općinu..." />
                  <CommandList>
                    <CommandEmpty>Nema rezultata.</CommandEmpty>
                    <CommandGroup>
                      {municipalities.map((municipality) => (
                        <CommandItem
                          key={municipality.id}
                          value={`${municipality.name} ${municipality.id}`}
                          onSelect={() => handleMunicipalityChange(municipality.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMunicipality?.id === municipality.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="truncate">{municipality.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-border/60 bg-muted/20 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Search className="h-3.5 w-3.5" />
            Brza pretraga
          </div>
          <Popover open={quickOpen} onOpenChange={setQuickOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
              className="h-10 w-full justify-between rounded-xl transition-all duration-200 hover:border-primary/40"
              >
                <span className="truncate text-sm">
                  {quickSearch || "Traži grad ili općinu"}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(92vw,440px)] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Unesi naziv grada ili općine..."
                  value={quickSearch}
                  onValueChange={setQuickSearch}
                />
                <CommandList>
                  {quickSearch.trim().length >= 2 ? (
                    searchResults.length ? (
                      <CommandGroup heading="Rezultati">
                        {searchResults.map((result) => (
                          <CommandItem
                            key={`${result.cityId}:${result.municipalityId || "city"}`}
                            value={`${result.cityId}:${result.municipalityId || "city"}`}
                            onSelect={() => handleQuickSelect(result)}
                          >
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate font-medium text-foreground">
                                {result.displayName}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {result.formatted}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ) : (
                      <CommandEmpty>Nema rezultata za ovu pretragu.</CommandEmpty>
                    )
                  ) : (
                    <CommandGroup heading="Popularni gradovi">
                      {POPULAR_CITIES.map((city) => (
                        <CommandItem
                          key={city.id}
                          value={city.id}
                          onSelect={() => handleCityChange(city.id)}
                        >
                          <MapPin className="mr-2 h-4 w-4 text-primary" />
                          <span>{city.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {locationResolved ? (
            <motion.div
              key="location-summary"
              {...CONTENT_ANIMATION}
              className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-[0_8px_20px_-18px_rgba(14,165,233,0.55)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Odabrana lokacija
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{summaryAddress}</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {showAddress && locationIsComplete ? (
          <motion.div {...CONTENT_ANIMATION} className="mt-3 space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Detaljnija lokacija (opcionalno)
            </Label>
            <Input
              value={normalizedValue?.address || ""}
              onChange={handleAddressChange}
              disabled={disabled}
              placeholder="Npr. ulica, broj ili orijentir"
              className="h-10 rounded-xl"
            />
          </motion.div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
};

export default BiHLocationSelector;
