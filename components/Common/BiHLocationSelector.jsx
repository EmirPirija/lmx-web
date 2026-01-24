"use client";
import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search, MapPin, X } from "lucide-react";
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
  ENTITIES,
  getRegionsByEntity,
  getMunicipalitiesByRegion,
  searchMunicipalities,
  formatBiHAddress,
  POPULAR_CITIES,
  getFullLocationFromMunicipalityId,
} from "@/lib/bih-locations";

/**
 * BiHLocationSelector - Selektor lokacije za BiH
 */
const BiHLocationSelector = ({
  value = {},
  onChange,
  showAddress = true,
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

  // Dohvati trenutne selekcije
  const selectedEntity = ENTITIES.find(e => e.id === value?.entityId);
  const regions = useMemo(() => getRegionsByEntity(value?.entityId), [value?.entityId]);
  const selectedRegion = regions.find(r => r.id === value?.regionId);
  const municipalities = useMemo(() => getMunicipalitiesByRegion(value?.regionId), [value?.regionId]);
  const selectedMunicipality = municipalities.find(m => m.id === value?.municipalityId);

  // Quick search rezultati
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchMunicipalities(searchQuery).slice(0, 8);
  }, [searchQuery]);

  // Handler za promjenu entiteta
  const handleEntityChange = (entityId) => {
    onChange?.({
      entityId,
      regionId: null,
      municipalityId: null,
      address: value?.address || "",
      formattedAddress: "",
    });
    setEntityOpen(false);
  };

  // Handler za promjenu regije/kantona
  const handleRegionChange = (regionId) => {
    onChange?.({
      ...value,
      regionId,
      municipalityId: null,
      formattedAddress: "",
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
    setSearchQuery("");
  };

  return (
    <div className={cn("space-y-4", className)}>
      {label && (
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {label}
        </Label>
      )}

      {/* Brza pretraga */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Pretraži grad ili općinu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-11"
          disabled={disabled}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {/* Search rezultati dropdown */}
        {searchQuery && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-[280px] overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.id}
                onClick={() => handleQuickSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-b-0 transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{result.name}</p>
                  <p className="text-xs text-gray-500">
                    {result.regionName} • {result.entityName}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
            Nema rezultata za "{searchQuery}"
          </div>
        )}
      </div>

      {/* Popularni gradovi */}
      {!value?.municipalityId && !searchQuery && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Popularni gradovi:</p>
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
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-500">ili odaberi ručno</span>
        </div>
      </div>

      {/* 3 Dropdown-a */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Entitet */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Entitet</Label>
          <Popover open={entityOpen} onOpenChange={setEntityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled}
                className={cn(
                  "w-full justify-between h-10",
                  !selectedEntity && "text-gray-400"
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
                          <span className="font-medium">{entity.shortName}</span>
                          <span className="text-xs text-gray-500">{entity.name}</span>
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
          <Label className="text-xs text-gray-500">
            {value?.entityId === "fbih" ? "Kanton" : value?.entityId === "rs" ? "Regija" : "Oblast"}
          </Label>
          <Popover open={regionOpen} onOpenChange={setRegionOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled || !value?.entityId}
                className={cn(
                  "w-full justify-between h-10",
                  !selectedRegion && "text-gray-400"
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
          <Label className="text-xs text-gray-500">Grad/Općina</Label>
          <Popover open={municipalityOpen} onOpenChange={setMunicipalityOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={disabled || !value?.regionId}
                className={cn(
                  "w-full justify-between h-10",
                  !selectedMunicipality && "text-gray-400"
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
                        <span>{municipality.name}</span>
                        {municipality.type === "grad" && (
                          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                            Grad
                          </span>
                        )}
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
          <Label className="text-xs text-gray-500">Ulica i broj (opcionalno)</Label>
          <Input
            placeholder="Npr. Maršala Tita 10"
            value={value?.address || ""}
            onChange={handleAddressChange}
            disabled={disabled}
            className="h-10"
          />
        </div>
      )}

      {/* Prikaz odabrane lokacije */}
      {value?.municipalityId && (
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <MapPin className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-green-800">Odabrana lokacija</p>
            <p className="text-sm text-green-700">
              {value?.address 
                ? `${value.address}, ${value?.formattedAddress || formatBiHAddress({ municipality: selectedMunicipality, region: selectedRegion, entity: selectedEntity })}`
                : value?.formattedAddress || formatBiHAddress({ municipality: selectedMunicipality, region: selectedRegion, entity: selectedEntity })
              }
            </p>
          </div>
          <button
            onClick={handleClear}
            className="text-green-600 hover:text-green-800 p-1"
            title="Očisti"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default BiHLocationSelector;
