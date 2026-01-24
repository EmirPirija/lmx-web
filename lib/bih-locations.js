/**
 * BOSNA I HERCEGOVINA - KOMPLETNA STRUKTURA LOKACIJA
 * ===================================================
 * Entiteti: Federacija BiH, Republika Srpska, Brčko Distrikt
 * 
 * Struktura:
 * - Entitet/Region
 *   - Kanton (za FBiH) / Regija (za RS)
 *     - Grad/Općina
 */

export const BIH_COUNTRY = {
  id: "BA",
  name: "Bosna i Hercegovina",
  code: "BA",
};

// Entiteti
export const ENTITIES = [
  { id: "fbih", name: "Federacija Bosne i Hercegovine", shortName: "FBiH" },
  { id: "rs", name: "Republika Srpska", shortName: "RS" },
  { id: "bd", name: "Brčko Distrikt", shortName: "BD" },
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
    { id: "foca_fbih", name: "Foča (FBiH)", type: "općina" },
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
    { id: "sarajevo_trnovo", name: "Trnovo (FBiH)", type: "općina" },
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
    { id: "trnovo_rs", name: "Trnovo (RS)", type: "općina" },
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

// Helper funkcije
export const getEntities = () => ENTITIES;

export const getRegionsByEntity = (entityId) => {
  if (entityId === "fbih") return FBIH_CANTONS;
  if (entityId === "rs") return RS_REGIONS;
  if (entityId === "bd") return [{ id: "bd", name: "Brčko Distrikt", entityId: "bd" }];
  return [];
};

export const getMunicipalitiesByRegion = (regionId) => {
  return MUNICIPALITIES[regionId] || [];
};

export const getAllMunicipalities = () => {
  const all = [];
  Object.entries(MUNICIPALITIES).forEach(([regionId, municipalities]) => {
    municipalities.forEach(m => {
      all.push({ ...m, regionId });
    });
  });
  return all;
};

export const searchMunicipalities = (query) => {
  if (!query || query.length < 2) return [];
  const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const results = [];
  Object.entries(MUNICIPALITIES).forEach(([regionId, municipalities]) => {
    municipalities.forEach(m => {
      const normalizedName = m.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (normalizedName.includes(normalizedQuery)) {
        // Nađi regiju/kanton
        const region = [...FBIH_CANTONS, ...RS_REGIONS].find(r => r.id === regionId);
        const entity = ENTITIES.find(e => e.id === region?.entityId);
        
        results.push({
          ...m,
          regionId,
          regionName: region?.name || regionId,
          entityId: entity?.id || "bd",
          entityName: entity?.name || "Brčko Distrikt",
        });
      }
    });
  });
  
  return results.slice(0, 15); // Limit rezultata
};

// Kreiraj formatted adresu
export const formatBiHAddress = ({ municipality, region, entity }) => {
  const parts = [];
  if (municipality?.name) parts.push(municipality.name);
  if (region?.name) parts.push(region.name);
  if (entity?.name) parts.push(entity.shortName || entity.name);
  parts.push("Bosna i Hercegovina");
  return parts.join(", ");
};

// Dohvati punu lokaciju iz municipality ID-a
export const getFullLocationFromMunicipalityId = (municipalityId) => {
  for (const [regionId, municipalities] of Object.entries(MUNICIPALITIES)) {
    const municipality = municipalities.find(m => m.id === municipalityId);
    if (municipality) {
      const region = [...FBIH_CANTONS, ...RS_REGIONS, { id: "bd", name: "Brčko Distrikt", entityId: "bd" }]
        .find(r => r.id === regionId);
      const entity = ENTITIES.find(e => e.id === region?.entityId);
      
      return {
        municipality,
        region,
        entity,
        country: BIH_COUNTRY,
        formatted: formatBiHAddress({ municipality, region, entity }),
      };
    }
  }
  return null;
};

// Export za brzi pristup popularnim gradovima
export const POPULAR_CITIES = [
  { id: "sarajevo_centar", name: "Sarajevo", regionId: "ks" },
  { id: "banja_luka", name: "Banja Luka", regionId: "banjaluka_reg" },
  { id: "tuzla", name: "Tuzla", regionId: "tk" },
  { id: "zenica", name: "Zenica", regionId: "zdk" },
  { id: "mostar", name: "Mostar", regionId: "hnk" },
  { id: "bijeljina", name: "Bijeljina", regionId: "bijeljina_reg" },
  { id: "brcko", name: "Brčko", regionId: "bd" },
  { id: "bihac", name: "Bihać", regionId: "usk" },
  { id: "prijedor", name: "Prijedor", regionId: "prijedor_reg" },
  { id: "trebinje", name: "Trebinje", regionId: "trebinje_reg" },
  { id: "doboj", name: "Doboj", regionId: "doboj_reg" },
  { id: "cazin", name: "Cazin", regionId: "usk" },
];

export default {
  BIH_COUNTRY,
  ENTITIES,
  FBIH_CANTONS,
  RS_REGIONS,
  MUNICIPALITIES,
  POPULAR_CITIES,
  getEntities,
  getRegionsByEntity,
  getMunicipalitiesByRegion,
  getAllMunicipalities,
  searchMunicipalities,
  formatBiHAddress,
  getFullLocationFromMunicipalityId,
};
