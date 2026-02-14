import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { useInView } from "react-intersection-observer";
import { Check, ChevronsUpDown, Loader2, AlertCircle, CheckCircle2 } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";
import {
  getAreasApi,
  getCitiesApi,
  getCoutriesApi,
  getStatesApi,
} from "@/utils/api";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/utils";

const ManualAddress = ({
  showManualAddress,
  setShowManualAddress,
  setLocation,
}) => {
  const [CountryStore, setCountryStore] = useState({
    Countries: [],
    SelectedCountry: {},
    CountrySearch: "",
    currentPage: 1,
    hasMore: false,
    countryOpen: false,
    isLoading: false,
  });
  const [StateStore, setStateStore] = useState({
    States: [],
    SelectedState: {},
    StateSearch: "",
    currentPage: 1,
    hasMore: false,
    stateOpen: false,
    isLoading: false,
  });
  const [CityStore, setCityStore] = useState({
    Cities: [],
    SelectedCity: {},
    CitySearch: "",
    currentPage: 1,
    hasMore: false,
    isLoading: false,
    cityOpen: false,
  });
  const [AreaStore, setAreaStore] = useState({
    Areas: [],
    SelectedArea: {},
    AreaSearch: "",
    currentPage: 1,
    hasMore: false,
    areaOpen: false,
    isLoading: false,
  });
  const [Address, setAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const isCountrySelected = Object.keys(CountryStore?.SelectedCountry).length > 0;
  const hasAreas = AreaStore?.Areas.length > 0;
  
  // Infinite scroll refs
  const { ref: stateRef, inView: stateInView } = useInView();
  const { ref: countryRef, inView: countryInView } = useInView();
  const { ref: cityRef, inView: cityInView } = useInView();
  const { ref: areaRef, inView: areaInView } = useInView();

  // ✅ Real-time validation check
  const isFieldValid = (field) => {
    switch (field) {
      case 'country':
        return !!CountryStore?.SelectedCountry?.name;
      case 'state':
        return !!StateStore?.SelectedState?.name;
      case 'city':
        return !!CityStore?.SelectedCity?.name;
      case 'address':
        return hasAreas ? !!AreaStore?.SelectedArea?.name : !!Address.trim();
      default:
        return false;
    }
  };

  const getCountriesData = async (search, page) => {
    try {
      setCountryStore((prev) => ({
        ...prev,
        isLoading: true,
        Countries: search ? [] : prev.Countries,
      }));
      
      const params = {};
      if (search) {
        params.search = search;
      } else {
        params.page = page;
      }

      const res = await getCoutriesApi.getCoutries(params);
      let allCountries;
      if (page > 1) {
        allCountries = [...CountryStore?.Countries, ...res?.data?.data?.data];
      } else {
        allCountries = res?.data?.data?.data;
      }
      setCountryStore((prev) => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        Countries: allCountries,
        hasMore:
          res?.data?.data?.current_page < res?.data?.data?.last_page
            ? true
            : false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching countries data:", error);
      setCountryStore((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const getStatesData = async (search, page) => {
    try {
      setStateStore((prev) => ({
        ...prev,
        isLoading: true,
        States: search ? [] : prev.States,
      }));
      const params = {
        country_id: CountryStore?.SelectedCountry?.id,
      };
      if (search) {
        params.search = search;
      } else {
        params.page = page;
      }

      const res = await getStatesApi.getStates(params);

      let allStates;
      if (page > 1) {
        allStates = [...StateStore?.States, ...res?.data?.data?.data];
      } else {
        allStates = res?.data?.data?.data;
      }

      setStateStore((prev) => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        States: allStates,
        hasMore:
          res?.data?.data?.current_page < res?.data?.data?.last_page
            ? true
            : false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching states data:", error);
      setStateStore((prev) => ({ ...prev, isLoading: false }));
      return [];
    }
  };

  const getCitiesData = async (search, page) => {
    try {
      setCityStore((prev) => ({
        ...prev,
        isLoading: true,
        Cities: search ? [] : prev.Cities,
      }));
      const params = {
        state_id: StateStore?.SelectedState?.id,
      };
      if (search) {
        params.search = search;
      } else {
        params.page = page;
      }

      const res = await getCitiesApi.getCities(params);
      let allCities;
      if (page > 1) {
        allCities = [...CityStore?.Cities, ...res?.data?.data?.data];
      } else {
        allCities = res?.data?.data?.data;
      }
      setCityStore((prev) => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        Cities: allCities,
        hasMore:
          res?.data?.data?.current_page < res?.data?.data?.last_page
            ? true
            : false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching cities data:", error);
      setCityStore((prev) => ({ ...prev, isLoading: false }));
      return [];
    }
  };

  const getAreaData = async (search, page) => {
    try {
      setAreaStore((prev) => ({
        ...prev,
        isLoading: true,
        Areas: search ? [] : prev.Areas,
      }));
      const params = {
        city_id: CityStore?.SelectedCity?.id,
      };
      if (search) {
        params.search = search;
      } else {
        params.page = page;
      }
      const res = await getAreasApi.getAreas(params);
      let allArea;
      if (page > 1) {
        allArea = [...AreaStore?.Areas, ...res?.data?.data?.data];
      } else {
        allArea = res?.data?.data?.data;
      }
      setAreaStore((prev) => ({
        ...prev,
        currentPage: res?.data?.data?.current_page,
        Areas: allArea,
        hasMore:
          res?.data?.data?.current_page < res?.data?.data?.last_page
            ? true
            : false,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Error fetching areas data:", error);
      setAreaStore((prev) => ({ ...prev, isLoading: false }));
      return [];
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (showManualAddress) {
        getCountriesData(CountryStore?.CountrySearch, 1);
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [CountryStore?.CountrySearch, showManualAddress]);

  useEffect(() => {
    if (CountryStore?.SelectedCountry?.id) {
      const timeout = setTimeout(() => {
        getStatesData(StateStore?.StateSearch, 1);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [CountryStore?.SelectedCountry?.id, StateStore?.StateSearch]);

  useEffect(() => {
    if (StateStore?.SelectedState?.id) {
      const timeout = setTimeout(() => {
        getCitiesData(CityStore?.CitySearch, 1);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [StateStore?.SelectedState?.id, CityStore?.CitySearch]);

  useEffect(() => {
    if (CityStore?.SelectedCity?.id) {
      const timeout = setTimeout(() => {
        getAreaData(AreaStore?.AreaSearch, 1);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [CityStore?.SelectedCity?.id, AreaStore?.AreaSearch]);

  useEffect(() => {
    if (CountryStore?.hasMore && !CountryStore?.isLoading && countryInView) {
      getCountriesData("", CountryStore?.currentPage + 1);
    }
  }, [
    countryInView,
    CountryStore?.hasMore,
    CountryStore?.isLoading,
    CountryStore?.currentPage,
  ]);

  useEffect(() => {
    if (StateStore?.hasMore && !StateStore?.isLoading && stateInView) {
      getStatesData("", StateStore?.currentPage + 1);
    }
  }, [
    stateInView,
    StateStore?.hasMore,
    StateStore?.isLoading,
    StateStore?.currentPage,
  ]);

  useEffect(() => {
    if (CityStore?.hasMore && !CityStore?.isLoading && cityInView) {
      getCitiesData("", CityStore?.currentPage + 1);
    }
  }, [
    cityInView,
    CityStore?.hasMore,
    CityStore?.isLoading,
    CityStore?.currentPage,
  ]);

  useEffect(() => {
    if (AreaStore?.hasMore && !AreaStore?.isLoading && areaInView) {
      getAreaData("", AreaStore?.currentPage + 1);
    }
  }, [
    areaInView,
    AreaStore?.hasMore,
    AreaStore?.isLoading,
    AreaStore?.currentPage,
  ]);

  const validateFields = () => {
    const errors = {};
    if (!CountryStore?.SelectedCountry?.name) errors.country = true;
    if (!StateStore?.SelectedState?.name) errors.state = true;
    if (!CityStore?.SelectedCity?.name) errors.city = true;
    if (!AreaStore?.SelectedArea?.name && !Address.trim())
      errors.address = true;
    return errors;
  };

  const handleCountryChange = (value) => {
    const Country = CountryStore?.Countries.find(
      (country) => country.name === value
    );
    setCountryStore((prev) => ({
      ...prev,
      SelectedCountry: Country,
      countryOpen: false,
    }));
    setTouched(prev => ({ ...prev, country: true }));
    setFieldErrors(prev => ({ ...prev, country: false }));
    
    setStateStore({
      States: [],
      SelectedState: {},
      StateSearch: "",
      currentPage: 1,
      hasMore: false,
      stateOpen: false,
    });
    setCityStore({
      Cities: [],
      SelectedCity: {},
      CitySearch: "",
      currentPage: 1,
      hasMore: false,
      cityOpen: false,
    });
    setAreaStore({
      Areas: [],
      SelectedArea: {},
      AreaSearch: "",
      currentPage: 1,
      hasMore: false,
      areaOpen: false,
    });
    setAddress("");
  };

  const handleStateChange = (value) => {
    const State = StateStore?.States.find((state) => state.name === value);
    setStateStore((prev) => ({
      ...prev,
      SelectedState: State,
      stateOpen: false,
    }));
    setTouched(prev => ({ ...prev, state: true }));
    setFieldErrors(prev => ({ ...prev, state: false }));
    
    setCityStore({
      Cities: [],
      SelectedCity: {},
      CitySearch: "",
      currentPage: 1,
      hasMore: false,
      cityOpen: false,
    });
    setAreaStore({
      Areas: [],
      SelectedArea: {},
      AreaSearch: "",
      currentPage: 1,
      hasMore: false,
      areaOpen: false,
    });
    setAddress("");
  };

  const handleCityChange = (value) => {
    const City = CityStore?.Cities.find((city) => city.name === value);
    setCityStore((prev) => ({
      ...prev,
      SelectedCity: City,
      cityOpen: false,
    }));
    setTouched(prev => ({ ...prev, city: true }));
    setFieldErrors(prev => ({ ...prev, city: false }));
    
    setAreaStore({
      Areas: [],
      SelectedArea: {},
      AreaSearch: "",
      currentPage: 1,
      hasMore: false,
      areaOpen: false,
    });
    setAddress("");
  };

  const handleAreaChange = (value) => {
    const chosenArea = AreaStore?.Areas.find((item) => item.name === value);
    setAreaStore((prev) => ({
      ...prev,
      SelectedArea: chosenArea,
      areaOpen: false,
    }));
    setTouched(prev => ({ ...prev, address: true }));
    setFieldErrors(prev => ({ ...prev, address: false }));
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setTouched(prev => ({ ...prev, address: true }));
    if (e.target.value.trim()) {
      setFieldErrors(prev => ({ ...prev, address: false }));
    }
  };

  const handleSave = () => {
    const errors = validateFields();
    setFieldErrors(errors);
    setTouched({ country: true, state: true, city: true, address: true });
    
    if (Object.keys(errors).length > 0) return;

    const addressParts = [];
    const addressPartsTranslated = [];

    if (hasAreas && AreaStore?.SelectedArea?.name) {
      addressParts.push(AreaStore.SelectedArea.name);
      addressPartsTranslated.push(
        AreaStore.SelectedArea.translated_name || AreaStore.SelectedArea.name
      );
    } else if (Address.trim()) {
      addressParts.push(Address.trim());
      addressPartsTranslated.push(Address.trim());
    }
    if (CityStore?.SelectedCity?.name) {
      addressParts.push(CityStore.SelectedCity.name);
      addressPartsTranslated.push(
        CityStore.SelectedCity.translated_name || CityStore.SelectedCity.name
      );
    }
    if (StateStore?.SelectedState?.name) {
      addressParts.push(StateStore.SelectedState.name);
      addressPartsTranslated.push(
        StateStore.SelectedState.translated_name ||
          StateStore.SelectedState.name
      );
    }
    if (CountryStore?.SelectedCountry?.name) {
      addressParts.push(CountryStore.SelectedCountry.name);
      addressPartsTranslated.push(
        CountryStore.SelectedCountry.translated_name ||
          CountryStore.SelectedCountry.name
      );
    }

    const formattedAddress = addressParts.join(", ");
    const formattedAddressTranslated = addressPartsTranslated.join(", ");

    const locationData = {
      country: CountryStore?.SelectedCountry?.name || "",
      state: StateStore?.SelectedState?.name || "",
      city: CityStore?.SelectedCity?.name || "",
      address: formattedAddress,
      address_translated: formattedAddressTranslated,
      lat: CityStore?.SelectedCity?.latitude || null,
      long: CityStore?.SelectedCity?.longitude || null,
      area_id: AreaStore?.SelectedArea?.id || null,
    };
    setLocation(locationData);
    setShowManualAddress(false);
  };

  // 🎨 Render field with validation indicator
  const renderFieldLabel = (label, fieldName) => {
    const isValid = isFieldValid(fieldName);
    const hasError = touched[fieldName] && fieldErrors[fieldName];
    
    return (
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          {label}
          {touched[fieldName] && (
            isValid ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : hasError ? (
              <AlertCircle className="w-4 h-4 text-red-500" />
            ) : null
          )}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={showManualAddress} onOpenChange={setShowManualAddress}>
      <DialogContent className="max-w-md dark:[&_.bg-white]:bg-slate-900 dark:[&_.bg-gray-50]:bg-slate-800/70 dark:[&_.bg-gray-100]:bg-slate-800 dark:[&_.bg-gray-200]:bg-slate-700 dark:[&_.bg-gray-400]:bg-slate-600 dark:[&_.bg-green-50]:bg-green-500/10 dark:[&_.text-gray-900]:text-slate-100 dark:[&_.text-gray-800]:text-slate-100 dark:[&_.text-gray-700]:text-slate-200 dark:[&_.text-gray-600]:text-slate-300 dark:[&_.text-gray-500]:text-slate-400 dark:[&_.border-gray-100]:border-slate-700 dark:[&_.border-gray-200]:border-slate-700 dark:[&_.border-gray-300]:border-slate-600 dark:[&_.border-green-50]:border-green-500/20 dark:[&_.bg-red-50]:bg-red-500/10">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Ručni unos adrese
          </DialogTitle>
          
          {/* 📊 Progress Indicator */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Dovršenost</span>
              <span className="text-sm font-semibold text-primary">
                {[isFieldValid('country'), isFieldValid('state'), isFieldValid('city'), isFieldValid('address')].filter(Boolean).length}/4
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ 
                  width: `${([isFieldValid('country'), isFieldValid('state'), isFieldValid('city'), isFieldValid('address')].filter(Boolean).length / 4) * 100}%` 
                }}
              />
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Country Field */}
          <div className="flex flex-col gap-1">
            {renderFieldLabel(t("country"), 'country')}
            <Popover
              modal
              open={CountryStore?.countryOpen}
              onOpenChange={(isOpen) => {
                setCountryStore((prev) => ({ ...prev, countryOpen: isOpen }));
                if (!isOpen) setTouched(prev => ({ ...prev, country: true }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={CountryStore?.countryOpen}
                  className={cn(
                    "w-full justify-between outline-none transition-all",
                    fieldErrors.country && touched.country && "border-red-500 bg-red-50",
                    isFieldValid('country') && touched.country && "border-green-500 bg-green-50"
                  )}
                >
                  {CountryStore?.SelectedCountry?.translated_name ||
                    CountryStore?.SelectedCountry?.name ||
                    t("selectCountry")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              {fieldErrors.country && touched.country && (
                <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("countryRequired")}
                </span>
              )}
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t("searchCountries")}
                    value={CountryStore.CountrySearch || ""}
                    onValueChange={(val) => {
                      setCountryStore((prev) => ({
                        ...prev,
                        CountrySearch: val,
                      }));
                    }}
                  />
                  <CommandEmpty>
                    {CountryStore.isLoading ? (
                      <LoacationLoader />
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          {t("noCountriesFound")}
                        </p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[240px] overflow-y-auto">
                    {CountryStore?.Countries?.map((country, index) => {
                      const isLast =
                        index === CountryStore?.Countries?.length - 1;
                      return (
                        <CommandItem
                          key={country.id}
                          value={country.name}
                          onSelect={handleCountryChange}
                          ref={isLast ? countryRef : null}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              CountryStore?.SelectedCountry?.name ===
                                country?.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {country.translated_name || country.name}
                        </CommandItem>
                      );
                    })}
                    {CountryStore.isLoading &&
                      CountryStore.Countries.length > 0 && <LoacationLoader />}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* State Field */}
          <div className="flex flex-col gap-1">
            {renderFieldLabel(t("state"), 'state')}
            <Popover
              modal
              open={StateStore?.stateOpen}
              onOpenChange={(isOpen) => {
                setStateStore((prev) => ({ ...prev, stateOpen: isOpen }));
                if (!isOpen) setTouched(prev => ({ ...prev, state: true }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={StateStore?.stateOpen}
                  className={cn(
                    "w-full justify-between outline-none transition-all",
                    fieldErrors.state && touched.state && "border-red-500 bg-red-50",
                    isFieldValid('state') && touched.state && "border-green-500 bg-green-50"
                  )}
                  disabled={!isCountrySelected}
                >
                  {StateStore?.SelectedState?.translated_name ||
                    StateStore?.SelectedState?.name ||
                    t("selectState")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              {fieldErrors.state && touched.state && (
                <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("stateRequired")}
                </span>
              )}
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t("searchStates")}
                    value={StateStore.StateSearch || ""}
                    onValueChange={(val) => {
                      setStateStore((prev) => ({ ...prev, StateSearch: val }));
                    }}
                  />
                  <CommandEmpty>
                    {StateStore.isLoading ? (
                      <LoacationLoader />
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          {t("noStatesFound")}
                        </p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[240px] overflow-y-auto">
                    {StateStore?.States?.map((state, index) => {
                      const isLast = index === StateStore?.States?.length - 1;
                      return (
                        <CommandItem
                          key={state.id}
                          value={state.name}
                          onSelect={handleStateChange}
                          ref={isLast ? stateRef : null}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              StateStore?.SelectedState?.name === state?.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {state.translated_name || state.name}
                        </CommandItem>
                      );
                    })}
                    {StateStore.isLoading && StateStore.States.length > 0 && (
                      <LoacationLoader />
                    )}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* City Field */}
          <div className="flex-col gap-1">
            {renderFieldLabel(t("city"), 'city')}
            <Popover
              modal
              open={CityStore?.cityOpen}
              onOpenChange={(isOpen) => {
                setCityStore((prev) => ({ ...prev, cityOpen: isOpen }));
                if (!isOpen) setTouched(prev => ({ ...prev, city: true }));
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={CityStore?.cityOpen}
                  className={cn(
                    "w-full justify-between outline-none transition-all",
                    fieldErrors.city && touched.city && "border-red-500 bg-red-50",
                    isFieldValid('city') && touched.city && "border-green-500 bg-green-50"
                  )}
                  disabled={!StateStore?.SelectedState?.id}
                >
                  {CityStore?.SelectedCity?.translated_name ||
                    CityStore?.SelectedCity?.name ||
                    t("selectCity")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              {fieldErrors.city && touched.city && (
                <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("cityRequired")}
                </span>
              )}
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t("searchCities")}
                    value={CityStore.CitySearch || ""}
                    onValueChange={(val) => {
                      setCityStore((prev) => ({ ...prev, CitySearch: val }));
                    }}
                  />
                  <CommandEmpty>
                    {CityStore.isLoading ? (
                      <LoacationLoader />
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                          {t("noCitiesFound")}
                        </p>
                      </div>
                    )}
                  </CommandEmpty>
                  <CommandGroup className="max-h-[240px] overflow-y-auto">
                    {CityStore?.Cities?.map((city, index) => {
                      const isLast = index === CityStore?.Cities?.length - 1;
                      return (
                        <CommandItem
                          key={city.id}
                          value={city.name}
                          onSelect={handleCityChange}
                          ref={isLast ? cityRef : null}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              CityStore?.SelectedCity?.name === city?.name
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {city.translated_name || city.name}
                        </CommandItem>
                      );
                    })}
                    {CityStore.isLoading && CityStore.Cities.length > 0 && (
                      <LoacationLoader />
                    )}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Area or Address Field */}
          {hasAreas || AreaStore?.AreaSearch ? (
            <div className="flex flex-col gap-1">
              {renderFieldLabel(t("area"), 'address')}
              <Popover
                modal
                open={AreaStore?.areaOpen}
                onOpenChange={(isOpen) => {
                  setAreaStore((prev) => ({ ...prev, areaOpen: isOpen }));
                  if (!isOpen) setTouched(prev => ({ ...prev, address: true }));
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={AreaStore?.areaOpen}
                    className={cn(
                      "w-full justify-between outline-none transition-all",
                      fieldErrors.address && touched.address && "border-red-500 bg-red-50",
                      isFieldValid('address') && touched.address && "border-green-500 bg-green-50"
                    )}
                    disabled={!CityStore?.SelectedCity?.id}
                  >
                    {AreaStore?.SelectedArea?.translated_name ||
                      AreaStore?.SelectedArea?.name ||
                      t("selectArea")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                {fieldErrors.address && touched.address && (
                  <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t("areaRequired")}
                  </span>
                )}
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder={t("searchAreas")}
                      value={AreaStore.AreaSearch || ""}
                      onValueChange={(val) => {
                        setAreaStore((prev) => ({ ...prev, AreaSearch: val }));
                      }}
                    />
                    <CommandEmpty>
                      {AreaStore.isLoading ? (
                        <LoacationLoader />
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">
                            {t("noAreasFound")}
                          </p>
                        </div>
                      )}
                    </CommandEmpty>
                    <CommandGroup className="max-h-[240px] overflow-y-auto">
                      {AreaStore?.Areas?.map((area, index) => {
                        const isLast = index === AreaStore?.Areas?.length - 1;
                        return (
                          <CommandItem
                            key={area.id}
                            value={area.name}
                            onSelect={handleAreaChange}
                            ref={isLast ? areaRef : null}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                AreaStore?.SelectedArea?.name === area?.name
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {area.translated_name || area.name}
                          </CommandItem>
                        );
                      })}
                      {AreaStore.isLoading && AreaStore.Areas.length > 0 && (
                        <LoacationLoader />
                      )}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {renderFieldLabel(t("address"), 'address')}
              <Textarea
                rows={5}
                className={cn(
                  "border p-2 outline-none rounded-md w-full transition-all",
                  fieldErrors.address && touched.address && "border-red-500 bg-red-50",
                  isFieldValid('address') && touched.address && "border-green-500 bg-green-50"
                )}
                placeholder={t("enterAddress")}
                value={Address}
                onChange={handleAddressChange}
                onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                disabled={!CityStore?.SelectedCity?.id}
              />
              {fieldErrors.address && touched.address && (
                <span className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("addressRequired")}
                </span>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button 
            className="rounded-md px-4 py-2 transition-colors hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => setShowManualAddress(false)}
          >
            {t("cancel")}
          </button>
          <button
            className={cn(
              "px-4 py-2 rounded-md text-white font-medium transition-all",
              [isFieldValid('country'), isFieldValid('state'), isFieldValid('city'), isFieldValid('address')].filter(Boolean).length === 4
                ? "bg-primary hover:bg-primary/90"
                : "bg-gray-400 cursor-not-allowed"
            )}
            onClick={handleSave}
          >
            {t("save")}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAddress;

const LoacationLoader = () => {
  return (
    <div className="flex items-center justify-center py-4">
      <Loader2 className="size-4 animate-spin" />
      <span className="ml-2 text-sm text-muted-foreground">
        {t("loading")}..
      </span>
    </div>
  );
};
