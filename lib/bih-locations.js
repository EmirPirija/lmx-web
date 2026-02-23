/**
 * Bosna i Hercegovina - fallback lokacijski podaci.
 * Primarni UI model je: Država -> Grad -> Općina (opcionalno).
 * Legacy grupe ispod postoje samo zbog kompatibilnosti sa starim API payloadima.
 */

export const BIH_COUNTRY = {
    id: "BA",
    name: "Bosna i Hercegovina",
    code: "BA",
    iso2: "BA",
  };
  
  // ID će se učitati iz API-ja, ovo je samo za mapping
  export const BIH_COUNTRY_ISO2 = "BA";
  
  // Neutralni model: država -> grad -> općina
  export const ENTITIES = [
    { id: "bih", name: "Bosna i Hercegovina", shortName: "BiH" },
  ];
  
  // Kantoni u FBiH
  export const FBIH_CANTONS = [
    { id: "usk", name: "Unsko-sanski kanton", entityId: "fbih", code: "USK" },
    { id: "pk", name: "Posavski kanton", entityId: "fbih", code: "PK" },
    { id: "tk", name: "Tuzlanski kanton", entityId: "fbih", code: "TK" },
    { id: "zdk", name: "Zeničko-dobojski kanton", entityId: "fbih", code: "ZDK" },
    { id: "bpk", name: "Bosansko-podrinjski kanton Goražde", entityId: "fbih", code: "BPK" },
    { id: "sbk", name: "Srednjobosanski kanton", entityId: "fbih", code: "SBK" },
    { id: "hnk", name: "Hercegovačko-neretvanski kanton", entityId: "fbih", code: "HNK" },
    { id: "zhk", name: "Zapadnohercegovački kanton", entityId: "fbih", code: "ZHK" },
    { id: "ks", name: "Kanton Sarajevo", entityId: "fbih", code: "KS" },
    { id: "k10", name: "Kanton 10 (Livanjski)", entityId: "fbih", code: "K10" },
  ];
  
  // Regije u RS (administrativne)
  export const RS_REGIONS = [
    { id: "banjaluka_reg", name: "Banjalučka regija", entityId: "rs" },
    { id: "doboj_reg", name: "Dobojska regija", entityId: "rs" },
    { id: "bijeljina_reg", name: "Bijeljinska regija", entityId: "rs" },
    { id: "vzvornik_reg", name: "Zvorničko-birčanska regija", entityId: "rs" },
    { id: "sarajevsko_reg", name: "Sarajevsko-romanijska regija", entityId: "rs" },
    { id: "foca_reg", name: "Fočanska regija", entityId: "rs" },
    { id: "trebinje_reg", name: "Trebinjska regija", entityId: "rs" },
    { id: "prijedor_reg", name: "Prijedorska regija", entityId: "rs" },
  ];
  
  // Svi gradovi/općine po kantonima/regijama
  export const MUNICIPALITIES = {
    // ============================================
    // FEDERACIJA BIH - KANTONI
    // ============================================
    
    // UNSKO-SANSKI KANTON
    usk: [
      { id: "bihac", name: "Bihać", type: "grad" },
      { id: "cazin", name: "Cazin", type: "grad" },
      { id: "velika_kladusa", name: "Velika Kladuša", type: "općina" },
      { id: "bosanska_krupa", name: "Bosanska Krupa", type: "općina" },
      { id: "bosanski_petrovac", name: "Bosanski Petrovac", type: "općina" },
      { id: "buzim", name: "Buzim", type: "općina" },
      { id: "kljuc", name: "Ključ", type: "općina" },
      { id: "sanski_most", name: "Sanski Most", type: "općina" },
    ],
  
    // POSAVSKI KANTON
    pk: [
      { id: "orasje", name: "Orašje", type: "općina" },
      { id: "odzak", name: "Odžak", type: "općina" },
      { id: "domaljevac_samac", name: "Domaljevac-Šamac", type: "općina" },
    ],
  
    // TUZLANSKI KANTON
    tk: [
      { id: "tuzla", name: "Tuzla", type: "grad" },
      { id: "lukavac", name: "Lukavac", type: "općina" },
      { id: "gracanica", name: "Gračanica", type: "općina" },
      { id: "gradacac", name: "Gradačac", type: "općina" },
      { id: "srebrenik", name: "Srebrenik", type: "općina" },
      { id: "banovici", name: "Banovići", type: "općina" },
      { id: "zivinice", name: "Živinice", type: "općina" },
      { id: "kalesija", name: "Kalesija", type: "općina" },
      { id: "kladanj", name: "Kladanj", type: "općina" },
      { id: "sapna", name: "Sapna", type: "općina" },
      { id: "teocak", name: "Teočak", type: "općina" },
      { id: "celic", name: "Čelić", type: "općina" },
      { id: "doboj_istok", name: "Doboj Istok", type: "općina" },
    ],
  
    // ZENIČKO-DOBOJSKI KANTON
    zdk: [
      { id: "zenica", name: "Zenica", type: "grad" },
      { id: "visoko", name: "Visoko", type: "općina" },
      { id: "kakanj", name: "Kakanj", type: "općina" },
      { id: "maglaj", name: "Maglaj", type: "općina" },
      { id: "zavidovici", name: "Zavidovići", type: "općina" },
      { id: "zepce", name: "Žepče", type: "općina" },
      { id: "tesanj", name: "Tešanj", type: "općina" },
      { id: "doboj_jug", name: "Doboj Jug", type: "općina" },
      { id: "usora", name: "Usora", type: "općina" },
      { id: "olovo", name: "Olovo", type: "općina" },
      { id: "vares", name: "Vareš", type: "općina" },
      { id: "breza", name: "Breza", type: "općina" },
    ],
  
    // BOSANSKO-PODRINJSKI KANTON GORAŽDE
    bpk: [
      { id: "gorazde", name: "Goražde", type: "grad" },
      { id: "pale_praca", name: "Pale-Prača", type: "općina" },
      { id: "foca_fbih", name: "Foča", type: "općina" },
    ],
  
    // SREDNJOBOSANSKI KANTON
    sbk: [
      { id: "travnik", name: "Travnik", type: "općina" },
      { id: "vitez", name: "Vitez", type: "općina" },
      { id: "novi_travnik", name: "Novi Travnik", type: "općina" },
      { id: "bugojno", name: "Bugojno", type: "općina" },
      { id: "gornji_vakuf_uskoplje", name: "Gornji Vakuf-Uskoplje", type: "općina" },
      { id: "fojnica", name: "Fojnica", type: "općina" },
      { id: "busovaca", name: "Busovača", type: "općina" },
      { id: "jajce", name: "Jajce", type: "općina" },
      { id: "donji_vakuf", name: "Donji Vakuf", type: "općina" },
      { id: "kresevo", name: "Kreševo", type: "općina" },
      { id: "kiseljak", name: "Kiseljak", type: "općina" },
      { id: "dobretici", name: "Dobretići", type: "općina" },
    ],
  
    // HERCEGOVAČKO-NERETVANSKI KANTON
    hnk: [
      { id: "mostar", name: "Mostar", type: "grad" },
      { id: "konjic", name: "Konjic", type: "općina" },
      { id: "jablanica", name: "Jablanica", type: "općina" },
      { id: "prozor_rama", name: "Prozor-Rama", type: "općina" },
      { id: "capljina", name: "Čapljina", type: "općina" },
      { id: "citluk", name: "Čitluk", type: "općina" },
      { id: "neum", name: "Neum", type: "općina" },
      { id: "stolac", name: "Stolac", type: "općina" },
      { id: "ravno", name: "Ravno", type: "općina" },
    ],
  
    // ZAPADNOHERCEGOVAČKI KANTON
    zhk: [
      { id: "siroki_brijeg", name: "Široki Brijeg", type: "općina" },
      { id: "ljubuski", name: "Ljubuški", type: "općina" },
      { id: "posusje", name: "Posušje", type: "općina" },
      { id: "grude", name: "Grude", type: "općina" },
    ],
  
    // KANTON SARAJEVO
    ks: [
      { id: "sarajevo_centar", name: "Sarajevo - Centar", type: "općina" },
      { id: "sarajevo_stari_grad", name: "Sarajevo - Stari Grad", type: "općina" },
      { id: "sarajevo_novo_sarajevo", name: "Sarajevo - Novo Sarajevo", type: "općina" },
      { id: "sarajevo_novi_grad", name: "Sarajevo - Novi Grad", type: "općina" },
      { id: "sarajevo_ilidza", name: "Ilidža", type: "općina" },
      { id: "sarajevo_vogosca", name: "Vogošća", type: "općina" },
      { id: "sarajevo_hadzici", name: "Hadžići", type: "općina" },
      { id: "sarajevo_ilijas", name: "Ilijaš", type: "općina" },
      { id: "sarajevo_trnovo", name: "Trnovo", type: "općina" },
    ],
  
    // KANTON 10 (LIVANJSKI)
    k10: [
      { id: "livno", name: "Livno", type: "općina" },
      { id: "tomislavgrad", name: "Tomislavgrad", type: "općina" },
      { id: "kupres", name: "Kupres", type: "općina" },
      { id: "glamoc", name: "Glamoč", type: "općina" },
      { id: "bosansko_grahovo", name: "Bosansko Grahovo", type: "općina" },
      { id: "drvar", name: "Drvar", type: "općina" },
    ],
  
    // ============================================
    // REPUBLIKA SRPSKA - REGIJE
    // ============================================
  
    // BANJALUČKA REGIJA
    banjaluka_reg: [
      { id: "banja_luka", name: "Banja Luka", type: "grad" },
      { id: "laktasi", name: "Laktaši", type: "općina" },
      { id: "gradiska", name: "Gradiška", type: "općina" },
      { id: "srbac", name: "Srbac", type: "općina" },
      { id: "celinac", name: "Čelinac", type: "općina" },
      { id: "kotor_varos", name: "Kotor Varoš", type: "općina" },
      { id: "knezevo", name: "Kneževo", type: "općina" },
      { id: "mrkonjic_grad", name: "Mrkonjić Grad", type: "općina" },
      { id: "sipovo", name: "Šipovo", type: "općina" },
      { id: "jezero", name: "Jezero", type: "općina" },
      { id: "ribnik", name: "Ribnik", type: "općina" },
      { id: "petrovac", name: "Petrovac", type: "općina" },
    ],
  
    // DOBOJSKA REGIJA
    doboj_reg: [
      { id: "doboj", name: "Doboj", type: "grad" },
      { id: "teslic", name: "Teslić", type: "općina" },
      { id: "modrica", name: "Modriča", type: "općina" },
      { id: "derventa", name: "Derventa", type: "općina" },
      { id: "brod", name: "Brod", type: "općina" },
      { id: "samac", name: "Šamac", type: "općina" },
      { id: "vukosavlje", name: "Vukosavlje", type: "općina" },
      { id: "pelagicevo", name: "Pelagićevo", type: "općina" },
      { id: "petrovo", name: "Petrovo", type: "općina" },
      { id: "stanari", name: "Stanari", type: "općina" },
    ],
  
    // BIJELJINSKA REGIJA
    bijeljina_reg: [
      { id: "bijeljina", name: "Bijeljina", type: "grad" },
      { id: "ugljevik", name: "Ugljevik", type: "općina" },
      { id: "lopare", name: "Lopare", type: "općina" },
    ],
  
    // ZVORNIČKO-BIRČANSKA REGIJA
    vzvornik_reg: [
      { id: "zvornik", name: "Zvornik", type: "općina" },
      { id: "bratunac", name: "Bratunac", type: "općina" },
      { id: "srebrenica", name: "Srebrenica", type: "općina" },
      { id: "milici", name: "Milići", type: "općina" },
      { id: "vlasenica", name: "Vlasenica", type: "općina" },
      { id: "sekovici", name: "Šekovići", type: "općina" },
      { id: "osmaci", name: "Osmaci", type: "općina" },
    ],
  
    // SARAJEVSKO-ROMANIJSKA REGIJA
    sarajevsko_reg: [
      { id: "istocno_sarajevo", name: "Istočno Sarajevo", type: "grad" },
      { id: "pale_rs", name: "Pale", type: "općina" },
      { id: "sokolac", name: "Sokolac", type: "općina" },
      { id: "han_pijesak", name: "Han Pijesak", type: "općina" },
      { id: "rogatica", name: "Rogatica", type: "općina" },
      { id: "visegrad", name: "Višegrad", type: "općina" },
      { id: "rudo", name: "Rudo", type: "općina" },
      { id: "istocna_ilidza", name: "Istočna Ilidža", type: "općina" },
      { id: "istocni_stari_grad", name: "Istočni Stari Grad", type: "općina" },
      { id: "istocno_novo_sarajevo", name: "Istočno Novo Sarajevo", type: "općina" },
      { id: "trnovo_rs", name: "Trnovo", type: "općina" },
    ],
  
    // FOČANSKA REGIJA
    foca_reg: [
      { id: "foca", name: "Foča", type: "općina" },
      { id: "kalinovik", name: "Kalinovik", type: "općina" },
      { id: "cajnice", name: "Čajniče", type: "općina" },
      { id: "ustipraca", name: "Ustiprača", type: "općina" },
    ],
  
    // TREBINJSKA REGIJA
    trebinje_reg: [
      { id: "trebinje", name: "Trebinje", type: "grad" },
      { id: "bileca", name: "Bileća", type: "općina" },
      { id: "gacko", name: "Gacko", type: "općina" },
      { id: "nevesinje", name: "Nevesinje", type: "općina" },
      { id: "berkovici", name: "Berkovići", type: "općina" },
      { id: "ljubinje", name: "Ljubinje", type: "općina" },
      { id: "istocni_mostar", name: "Istočni Mostar", type: "općina" },
    ],
  
    // PRIJEDORSKA REGIJA
    prijedor_reg: [
      { id: "prijedor", name: "Prijedor", type: "grad" },
      { id: "kozarska_dubica", name: "Kozarska Dubica", type: "općina" },
      { id: "kostajnica", name: "Kostajnica", type: "općina" },
      { id: "novi_grad_rs", name: "Novi Grad", type: "općina" },
      { id: "krupa_na_uni", name: "Krupa na Uni", type: "općina" },
      { id: "ositnik", name: "Oštra Luka", type: "općina" },
    ],
  
    // ============================================
    // BRČKO DISTRIKT
    // ============================================
    bd: [
      { id: "brcko", name: "Brčko", type: "grad" },
    ],
  };
  
// Neutralni BiH model (grad -> općina) iznad legacy regionalnih podataka
const sanitizeLocationName = (value = "") =>
  String(value || "")
    .replace(/\(\s*(?:rs|fbih)\s*\)/gi, "")
    .replace(/\b(?:rs|fbih)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const normalize = (value = "") =>
  sanitizeLocationName(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const LOCATION_GROUP_OVERRIDES = {
  sarajevo_centar: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Centar Sarajevo",
  },
  sarajevo_stari_grad: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Stari Grad Sarajevo",
  },
  sarajevo_novo_sarajevo: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Novo Sarajevo",
  },
  sarajevo_novi_grad: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Novi Grad Sarajevo",
  },
  sarajevo_ilidza: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Ilidža",
  },
  sarajevo_vogosca: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Vogošća",
  },
  sarajevo_hadzici: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Hadžići",
  },
  sarajevo_ilijas: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Ilijaš",
  },
  sarajevo_trnovo: {
    cityId: "sarajevo",
    cityName: "Sarajevo",
    municipalityName: "Trnovo",
  },
  istocno_sarajevo: {
    cityId: "istocno_sarajevo",
    cityName: "Istočno Sarajevo",
    municipalityName: null,
  },
  istocna_ilidza: {
    cityId: "istocno_sarajevo",
    cityName: "Istočno Sarajevo",
    municipalityName: "Istočna Ilidža",
  },
  istocni_stari_grad: {
    cityId: "istocno_sarajevo",
    cityName: "Istočno Sarajevo",
    municipalityName: "Istočni Stari Grad",
  },
  istocno_novo_sarajevo: {
    cityId: "istocno_sarajevo",
    cityName: "Istočno Sarajevo",
    municipalityName: "Istočno Novo Sarajevo",
  },
  brcko: {
    cityId: "brcko",
    cityName: "Brčko",
    municipalityName: null,
  },
};

const flattenLegacyMunicipalities = () => {
  const values = [];
  Object.values(MUNICIPALITIES).forEach((group) => {
    group.forEach((entry) => values.push(entry));
  });
  return values;
};

const buildCities = () => {
  const cityMap = new Map();

  flattenLegacyMunicipalities().forEach((entry) => {
    const override = LOCATION_GROUP_OVERRIDES[entry.id];
    const cityId = override?.cityId || entry.id;
    const cityName = sanitizeLocationName(override?.cityName || entry.name);
    const municipalityName = sanitizeLocationName(override?.municipalityName);

    if (!cityMap.has(cityId)) {
      cityMap.set(cityId, {
        id: cityId,
        name: cityName,
        municipalities: [],
      });
    }

    if (municipalityName) {
      const city = cityMap.get(cityId);
      const alreadyExists = city.municipalities.some((m) => m.id === entry.id);
      if (!alreadyExists) {
        city.municipalities.push({
          id: entry.id,
          name: sanitizeLocationName(municipalityName),
          type: "općina",
        });
      }
    }
  });

  return Array.from(cityMap.values())
    .map((city) => ({
      ...city,
      municipalities: [...city.municipalities].sort((a, b) =>
        String(a.name).localeCompare(String(b.name), "bs")
      ),
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "bs"));
};

export const CITIES = buildCities();

const cityById = new Map(CITIES.map((city) => [city.id, city]));
const municipalityToCity = new Map();
const legacyMunicipalityToCityId = new Map();

flattenLegacyMunicipalities().forEach((entry) => {
  const override = LOCATION_GROUP_OVERRIDES[entry.id];
  legacyMunicipalityToCityId.set(entry.id, override?.cityId || entry.id);
});

CITIES.forEach((city) => {
  city.municipalities.forEach((municipality) => {
    municipalityToCity.set(municipality.id, {
      city,
      municipality,
    });
  });
});

const resolveCityByName = (cityName = "") => {
  const needle = normalize(cityName);
  if (!needle) return null;
  return CITIES.find((city) => normalize(city.name) === needle) || null;
};

const resolveMunicipalityByName = (city, municipalityName = "") => {
  if (!city || !municipalityName) return null;
  const needle = normalize(municipalityName);
  return city.municipalities.find((item) => normalize(item.name) === needle) || null;
};

export const getEntities = () => ENTITIES;

export const getCities = () => CITIES;

export const getCityById = (cityId) => cityById.get(cityId) || null;

export const getMunicipalitiesByCity = (cityId) =>
  getCityById(cityId)?.municipalities || [];

export const cityHasMunicipalities = (cityId) => getMunicipalitiesByCity(cityId).length > 0;

// Legacy kompatibilnost (stari API nazivi)
export const getRegionsByEntity = () => getCities();
export const getMunicipalitiesByRegion = (regionId) => getMunicipalitiesByCity(regionId);

export const formatBiHAddress = ({ city, municipality }) => {
  const cityName = sanitizeLocationName(city?.name);
  const municipalityName = sanitizeLocationName(municipality?.name);
  const parts = [];
  if (municipalityName && normalize(municipalityName) !== normalize(cityName)) {
    parts.push(municipalityName);
  }
  if (cityName) {
    parts.push(cityName);
  }
  parts.push("Bosna i Hercegovina");
  return [...new Set(parts.filter(Boolean))].join(", ");
};

export const resolveLocationSelection = (value = {}) => {
  if (!value || typeof value !== "object") return null;

  const cityId =
    value.cityId ||
    value.regionId ||
    municipalityToCity.get(value.municipalityId || "")?.city?.id ||
    legacyMunicipalityToCityId.get(value.municipalityId || "") ||
    null;
  const city = getCityById(cityId) || resolveCityByName(value.city || "");

  if (!city) return null;

  const municipality =
    (value.municipalityId && resolveMunicipalityByName(city, value.municipalityName || "")?.id === value.municipalityId
      ? resolveMunicipalityByName(city, value.municipalityName || "")
      : city.municipalities.find((item) => item.id === value.municipalityId)) ||
    resolveMunicipalityByName(city, value.state || "") ||
    resolveMunicipalityByName(city, value.municipalityName || "") ||
    null;

  return {
    city,
    municipality,
    country: BIH_COUNTRY,
    formatted: formatBiHAddress({ city, municipality }),
    // Backward compatible fields
    region: municipality
      ? { id: municipality.id, name: sanitizeLocationName(municipality.name), type: "općina" }
      : { id: city.id, name: sanitizeLocationName(city.name), type: "grad" },
    entity: ENTITIES[0],
  };
};

export const isLocationComplete = (value = {}) => {
  const resolved = resolveLocationSelection(value);
  if (!resolved?.city) return false;
  const requiresMunicipality = resolved.city.municipalities.length > 0;
  if (!requiresMunicipality) return true;
  return Boolean(resolved.municipality);
};

export const getFullLocationFromMunicipalityId = (municipalityId, cityId = null) => {
  if (municipalityId && municipalityToCity.has(municipalityId)) {
    const data = municipalityToCity.get(municipalityId);
    return resolveLocationSelection({
      cityId: data.city.id,
      municipalityId,
    });
  }

  if (cityId && cityById.has(cityId)) {
    return resolveLocationSelection({ cityId });
  }

  if (municipalityId && cityById.has(municipalityId)) {
    return resolveLocationSelection({ cityId: municipalityId });
  }

  if (municipalityId && legacyMunicipalityToCityId.has(municipalityId)) {
    return resolveLocationSelection({
      cityId: legacyMunicipalityToCityId.get(municipalityId),
      municipalityId,
    });
  }

  return null;
};

export const getAllMunicipalities = () =>
  CITIES.flatMap((city) =>
    city.municipalities.length
      ? city.municipalities.map((municipality) => ({
          ...municipality,
          cityId: city.id,
          cityName: city.name,
        }))
      : [
          {
            id: city.id,
            name: city.name,
            type: "grad",
            cityId: city.id,
            cityName: city.name,
          },
        ]
  );

export const searchLocations = (query = "") => {
  const needle = normalize(query);
  if (!needle || needle.length < 2) return [];

  const results = [];

  CITIES.forEach((city) => {
    if (normalize(city.name).includes(needle)) {
      results.push({
        id: city.id,
        cityId: city.id,
        cityName: city.name,
        municipalityId: null,
        municipalityName: "",
        formatted: formatBiHAddress({ city, municipality: null }),
        displayName: city.name,
      });
    }

    city.municipalities.forEach((municipality) => {
      if (normalize(municipality.name).includes(needle)) {
        results.push({
          id: municipality.id,
          cityId: city.id,
          cityName: city.name,
          municipalityId: municipality.id,
          municipalityName: municipality.name,
          formatted: formatBiHAddress({ city, municipality }),
          displayName: `${municipality.name}, ${city.name}`,
        });
      }
    });
  });

  const deduped = [];
  const seen = new Set();
  results.forEach((result) => {
    const key = `${result.cityId}:${result.municipalityId || "city"}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(result);
  });

  return deduped.slice(0, 20);
};

// Legacy alias
export const searchMunicipalities = (query = "") =>
  searchLocations(query).map((item) => ({
    id: item.id,
    name: item.municipalityName || item.cityName,
    type: item.municipalityId ? "općina" : "grad",
    cityId: item.cityId,
    cityName: item.cityName,
    municipalityId: item.municipalityId,
    municipalityName: item.municipalityName,
    regionId: item.cityId,
    regionName: item.municipalityName || item.cityName,
    entityId: BIH_COUNTRY.id,
    entityName: BIH_COUNTRY.name,
    formatted: item.formatted,
  }));

export const POPULAR_CITIES = [
  { id: "sarajevo", name: "Sarajevo" },
  { id: "banja_luka", name: "Banja Luka" },
  { id: "mostar", name: "Mostar" },
  { id: "tuzla", name: "Tuzla" },
  { id: "zenica", name: "Zenica" },
  { id: "brcko", name: "Brčko" },
  { id: "bijeljina", name: "Bijeljina" },
  { id: "bihac", name: "Bihać" },
];

export default {
  BIH_COUNTRY,
  ENTITIES,
  CITIES,
  MUNICIPALITIES,
  POPULAR_CITIES,
  getEntities,
  getCities,
  getCityById,
  getMunicipalitiesByCity,
  cityHasMunicipalities,
  getRegionsByEntity,
  getMunicipalitiesByRegion,
  getAllMunicipalities,
  searchLocations,
  searchMunicipalities,
  formatBiHAddress,
  resolveLocationSelection,
  isLocationComplete,
  getFullLocationFromMunicipalityId,
};
