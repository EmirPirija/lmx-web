"use client";
import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown, Search, MapPin, Building2, Map, X } from "lucide-react";
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
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/utils";
import {
  ENTITIES,
  getRegionsByEntity,
  getMunicipalitiesByRegion,
  searchMunicipalities,
  formatBiHAddress,
  POPULAR_CITIES,
  getFullLocationFromMunicipalityId,
} from "@/lib/bih-locations";

/**
 * BiHLocationSelector - Profesionalni selektor lokacije za BiH
 * 
 * Props:
 * - value: { entityId, regionId, municipalityId, address } - trenutna vrijednost
 * - onChange: (location) => void - callback kad se promijeni lokacija
 * - showAddress: boolean - da li prikazati polje za adresu (default: true)
 * - compact: boolean - kompaktni prikaz (default: false)
 * - disabled: boolean - onemogući
 * - error: string - poruka greške
 * - label: string - label iznad komponente
 */
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
  // State za dropdown-ove
  const [entityOpen, setEntityOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [municipalityOpen, setMunicipalityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  // Dohvati trenutne selekcije
  const selectedEntity = ENTITIES.find(e => e.id === value?.entityId);
  const regions = useMemo(() => getRegionsByEntity(value?.entityId), [value?.entityId]);
  const selectedRegion = regions.find(r => r.id === value?.regionId);
  const municipalities = useMemo(() => getMunicipalitiesByRegion(value?.regionId), [value?.regionId]);
  const selectedMunicipality = municipalities.find(m => m.id === value?.municipalityId);

  // Quick search rezultati
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchMunicipalities(searchQuery);
  }, [searchQuery]);

  // Handler za promjenu entiteta
  const handleEntityChange = (entityId) => {
    onChange?.({
      entityId,
      regionId: null,
      municipalityId: null,
      address: value?.address || "",
    });
    setEntityOpen(false);
  };

  // Handler za promjenu regije/kantona
  const handleRegionChange = (regionId) => {
    onChange?.({
      ...value,
      regionId,
      municipalityId: null,
    });
    setRegionOpen(false);
  };

  // Handler za promjenu općine/grada
  const handleMunicipalityChange = (municipalityId) => {
    const municipality = municipalities.find(m => m.id === municipalityId);
    const region = regions.find(r => r.id === value?.regionId);
    const entity = selectedEntity;
    
    onChange?.({
      ...value,
      municipalityId,
      // Auto-generiši formatted adresu
      formattedAddress: formatBiHAddress({ municipality, region, entity }),
    });
    setMunicipalityOpen(false);
  };

  // Handler za quick search selekciju
  const handleQuickSelect = (result) => {
    onChange?.({
      entityId: result.entityId,
      regionId: result.regionId,
      municipalityId: result.id,
      address: value?.address || "",
      formattedAddress: `${result.name}, ${result.regionName}, ${result.entityName}, Bosna i Hercegovina`,
    });
    setSearchQuery("");
    setShowQuickSearch(false);
  };

  // Handler za popularni grad
  const handlePopularCity = (city) => {
    const fullLocation = getFullLocationFromMunicipalityId(city.id);
    if (fullLocation) {
      onChange?.({
        entityId: fullLocation.entity?.id,
        regionId: fullLocation.region?.id,
        municipalityId: city.id,
        address: value?.address || "",
        formattedAddress: fullLocation.formatted,
      });
    }
    setShowQuickSearch(false);
  };

  // Handler za adresu
  const handleAddressChange = (e) => {
    onChange?.({
      ...value,
      address: e.target.value,
    });
  };

  // Clear all
  const handleClear = () => {
    onChange?.({
      entityId: null,
      regionId: null,
      municipalityId: null,
      address: "",
      formattedAddress: "",
    });
  };

  // Kompaktni prikaz - samo search
  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && <Label className="text-sm font-medium">{label}</Label>}
        
        <Popover open={showQuickSearch} onOpenChange={setShowQuickSearch}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              disabled={disabled}
              className={cn(
                "w-full justify-between",
                error && "border-red-500",
                !value?.municipalityId && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {value?.formattedAddress || value?.municipalityId 
                    ? (selectedMunicipality?.name || value?.formattedAddress || "Odaberite lokaciju")
                    : "Pretražite ili odaberite lokaciju"
                  }
                </span>
              </div>
              {value?.municipalityId ? (
                <X 
                  className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100" 
                  onClick={(e) => { e.stopPropagation(); handleClear(); }}
                />
              ) : (
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder="Pretražite grad ili općinu..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                {searchQuery.length >= 2 ? (
                  searchResults.length > 0 ? (
                    <CommandGroup heading="Rezultati pretrage">
                      {searchResults.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id}
                          onSelect={() => handleQuickSelect(result)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{result.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {result.regionName} • {result.entityName}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : (
                    <CommandEmpty>Nema rezultata za "{searchQuery}"</CommandEmpty>
                  )
                ) : (
                  <>
                    <CommandGroup heading="Popularni gradovi">
                      {POPULAR_CITIES.slice(0, 8).map((city) => (
                        <CommandItem
                          key={city.id}
                          value={city.id}
                          onSelect={() => handlePopularCity(city)}
                        >
                          <MapPin className="mr-2 h-4 w-4 text-primary" />
                          {city.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  // Puni prikaz sa 3 dropdown-a
  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            {label}
          </Label>
          {value?.municipalityId && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClear}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Očisti
            </Button>
          )}
        </div>
      )}

      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Brza pretraga grada ili općine..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
        {searchQuery && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-[240px] overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleQuickSelect(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-medium">{result.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.regionName} • {result.entityName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popularni gradovi */}
      {!value?.municipalityId && !searchQuery && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Popularni gradovi:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.slice(0, 6).map((city) => (
              <button
                key={city.id}
                onClick={() => handlePopularCity(city)}
                disabled={disabled}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-primary/10 hover:text-primary rounded-full transition-colors disabled:opacity-50"
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">ili odaberite ručno</span>
        </div>
      </div>

      {/* 3 Dropdown-a */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Entitet */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Entitet
          </Label>
          <Popover open={entityOpen} onOpenChange={setEntityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled}
                className={cn(
                  "w-full justify-between",
                  !selectedEntity && "text-muted-foreground"
                )}
              >
                {selectedEntity?.shortName || "Odaberi..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {ENTITIES.map((entity) => (
                      <CommandItem
                        key={entity.id}
                        value={entity.id}
                        onSelect={() => handleEntityChange(entity.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.entityId === entity.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{entity.shortName}</span>
                          <span className="text-xs text-muted-foreground">{entity.name}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Kanton/Regija */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Map className="h-3 w-3" />
            {value?.entityId === "fbih" ? "Kanton" : value?.entityId === "rs" ? "Regija" : "Oblast"}
          </Label>
          <Popover open={regionOpen} onOpenChange={setRegionOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled || !value?.entityId}
                className={cn(
                  "w-full justify-between",
                  !selectedRegion && "text-muted-foreground"
                )}
              >
                <span className="truncate">
                  {selectedRegion?.name || "Odaberi..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Pretraži..." />
                <CommandList>
                  <CommandEmpty>Nema rezultata.</CommandEmpty>
                  <CommandGroup>
                    {regions.map((region) => (
                      <CommandItem
                        key={region.id}
                        value={region.name}
                        onSelect={() => handleRegionChange(region.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.regionId === region.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {region.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Grad/Općina */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Grad/Općina
          </Label>
          <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled || !value?.regionId}
                className={cn(
                  "w-full justify-between",
                  !selectedMunicipality && "text-muted-foreground"
                )}
              >
                <span className="truncate">
                  {selectedMunicipality?.name || "Odaberi..."}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
              <Command>
                <CommandInput placeholder="Pretraži..." />
                <CommandList>
                  <CommandEmpty>Nema rezultata.</CommandEmpty>
                  <CommandGroup>
                    {municipalities.map((municipality) => (
                      <CommandItem
                        key={municipality.id}
                        value={municipality.name}
                        onSelect={() => handleMunicipalityChange(municipality.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value?.municipalityId === municipality.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2">
                          <span>{municipality.name}</span>
                          {municipality.type === "grad" && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Grad
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Adresa (opcionalno) */}
      {showAddress && value?.municipalityId && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            Dodatna adresa (opcionalno)
          </Label>
          <Input
            placeholder="Npr. Ulica i broj, naselje..."
            value={value?.address || ""}
            onChange={handleAddressChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Prikaz odabrane lokacije */}
      {value?.municipalityId && (
        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Odabrana lokacija</p>
            <p className="text-sm text-muted-foreground truncate">
              {value?.formattedAddress || formatBiHAddress({
                municipality: selectedMunicipality,
                region: selectedRegion,
                entity: selectedEntity,
              })}
            </p>
            {value?.address && (
              <p className="text-xs text-muted-foreground mt-1">
                {value.address}
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default BiHLocationSelector;
