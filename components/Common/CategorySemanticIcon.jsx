"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Bath,
  Bed,
  Bell,
  Bike,
  Bird,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Camera,
  Car,
  Cat,
  ChefHat,
  Coins,
  Compass,
  CookingPot,
  Cpu,
  CreditCard,
  Dog,
  Dumbbell,
  Factory,
  Film,
  Fish,
  Flower2,
  Gamepad2,
  Gem,
  Gift,
  Globe,
  GraduationCap,
  HardDrive,
  Headphones,
  Hospital,
  House,
  Keyboard,
  Lamp,
  Laptop,
  Leaf,
  Mail,
  MapPin,
  Megaphone,
  MemoryStick,
  MessageCircle,
  Mic,
  Monitor,
  Package,
  Paintbrush,
  PaintRoller,
  PawPrint,
  PhoneCall,
  Pill,
  Plane,
  PlugZap,
  Printer,
  Puzzle,
  Rocket,
  Scissors,
  Shirt,
  Ship,
  Snowflake,
  Sofa,
  Smartphone,
  Stethoscope,
  Store,
  Ticket,
  Toilet,
  Tractor,
  TrendingUp,
  Truck,
  UtensilsCrossed,
  Volume2,
  Wrench,
  Shapes,
  Bot,
  BatteryCharging,
  Cross,
} from "@/components/Common/UnifiedIconPack";
import {
  normalizeLegacyImageUrl,
  withCategoryImageVersion,
} from "@/utils/categoryImage";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));
const WORD_BOUNDARY = (word) => new RegExp(`(^|\\s)${word}(?=\\s|$)`);

const ROOT_SLUG_ICON_MAP = {
  vozila: Car,
  nekretnine: Building2,
  "mobiteli-i-oprema": Smartphone,
  "racunari-i-oprema": Laptop,
  tehnika: Cpu,
  "video-igre-i-konzole": Gamepad2,
  "moj-dom": Sofa,
  "muzika-i-audio-oprema": Headphones,
  literatura: BookOpen,
  "umjetnost-i-dekoracija": Paintbrush,
  kolekcionarstvo: Gift,
  antikviteti: Lamp,
  "karte-i-ulaznice": Ticket,
  "hrana-i-pice": UtensilsCrossed,
  bebe: Baby,
  "igre-i-igracke": Puzzle,
  "moda-i-ljepota": Shirt,
  "nakit-i-satovi": Gem,
  "odjeca-i-obuca": Shirt,
  "sport-i-rekreacija": Dumbbell,
  "biznis-i-industrija": Factory,
  zivotinje: Dog,
  ostalo: Shapes,
  "usluge-i-servisi": Wrench,
};

const ROOT_CATEGORY_NAME_SET = new Set(
  [
    "Vozila",
    "Nekretnine",
    "Mobiteli",
    "Računari",
    "Tehnika",
    "Video igre i konzole",
    "Moj dom",
    "Muzika i audio oprema",
    "Literatura",
    "Umjetnost i dekoracija",
    "Kolekcionarstvo",
    "Antikviteti",
    "Karte i ulaznice",
    "Hrana i piće",
    "Bebe",
    "Igre i igračke",
    "Moda i ljepota",
    "Nakit i satovi",
    "Odjeća i obuća",
    "Sport i rekreacija",
    "Biznis i industrija",
    "Životinje",
    "Ostalo",
    ...Object.keys(ROOT_SLUG_ICON_MAP).map((slug) => slug.replace(/-/g, " ")),
  ].map((value) => normalize(value))
);

const isRootCategory = (category = {}) => {
  const slug = normalize(category?.slug).replace(/\s+/g, "-");
  if (slug && ROOT_SLUG_ICON_MAP[slug]) return true;

  const name = normalize(
    category?.translated_name || category?.name || category?.search_name || ""
  );
  if (name && ROOT_CATEGORY_NAME_SET.has(name)) return true;

  return false;
};

const SubcategoryDefaultIcon = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="currentColor"
      d="m6.525 10.85 5.5 -8.85 5.5 8.85h-11ZM17.65 22c-1.23335 0 -2.26665 -0.41665 -3.1 -1.25 -0.83335 -0.83335 -1.25 -1.86665 -1.25 -3.1 0 -1.23335 0.41665 -2.26665 1.25 -3.1 0.83335 -0.83335 1.86665 -1.25 3.1 -1.25 1.23335 0 2.26665 0.41665 3.1 1.25 0.83335 0.83335 1.25 1.86665 1.25 3.1 0 1.23335 -0.41665 2.26665 -1.25 3.1 -0.83335 0.83335 -1.86665 1.25 -3.1 1.25ZM3 21.375v-7.6h7.6v7.6H3ZM17.652 20.5c0.79865 0 1.473 -0.27565 2.023 -0.827 0.55 -0.5515 0.825 -1.2265 0.825 -2.025 0 -0.79865 -0.27565 -1.473 -0.827 -2.023 -0.5515 -0.55 -1.2265 -0.825 -2.025 -0.825 -0.79865 0 -1.473 0.27565 -2.023 0.827 -0.55 0.5515 -0.825 1.2265 -0.825 2.025 0 0.79865 0.27565 1.473 0.827 2.023 0.5515 0.55 1.2265 0.825 2.025 0.825ZM4.5 19.875h4.6v-4.6H4.5v4.6Zm4.725 -10.525h5.6l-2.8 -4.525 -2.8 4.525Z"
    />
  </svg>
);

const pickCategoryIcon = (category) => {
  const slug = normalize(category?.slug).replace(/\s+/g, "-");
  if (slug && ROOT_SLUG_ICON_MAP[slug]) {
    return ROOT_SLUG_ICON_MAP[slug];
  }

  const text = normalize(
    [
      category?.search_name,
      category?.translated_name,
      category?.name,
      category?.full_path,
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (!text) return Shapes;

  if (includesAny(text, ["frizider", "hladnjak", "zamrzivac"])) return Snowflake;

  if (includesAny(text, ["motor", "motocikl", "skuter", "moped"])) return Bike;
  if (includesAny(text, ["bicikl"])) return Bike;
  if (includesAny(text, ["kamion", "prikolica", "teretn"])) return Truck;
  if (includesAny(text, ["autobus", "bus"])) return Bus;
  if (includesAny(text, ["brod", "camac", "plov"])) return Ship;
  if (includesAny(text, ["avion", "let"])) return Plane;
  if (includesAny(text, ["auto", "automobil", "vozil"])) return Car;

  if (includesAny(text, ["smjestaj na dan", "smjestaj", "apartman na dan", "dnevni najam"])) {
    return Bed;
  }

  if (includesAny(text, ["stan", "apartman"])) return Building2;
  if (includesAny(text, ["kuca", "vikendic"])) return House;
  if (includesAny(text, ["soba", "room"])) return Bed;
  if (includesAny(text, ["garaza", "garaze", "parking"])) return Car;
  if (includesAny(text, ["zemljis", "plac", "parcela"])) return Leaf;
  if (includesAny(text, ["poslovni prostor", "ured", "kancelarija", "office"])) return Briefcase;
  if (includesAny(text, ["skladiste", "hala", "magacin"])) return Factory;
  if (includesAny(text, ["nekretnin"])) {
    return Building2;
  }

  if (includesAny(text, ["zvucnik", "soundbar", "audio", "hifi", "hi fi"])) return Volume2;
  if (includesAny(text, ["mikrofon", "studio", "vokal"])) return Mic;
  if (includesAny(text, ["slusalic", "headset", "earbud"])) return Headphones;
  if (includesAny(text, ["konzol", "playstation", "xbox", "nintendo", "video igra", "gaming"])) {
    return Gamepad2;
  }
  if (includesAny(text, ["tv", "televizor", "televizija"])) return Monitor;
  if (includesAny(text, ["kamera", "foto", "objektiv"])) return Camera;
  if (includesAny(text, ["film", "video produkcija", "videograf"])) return Film;
  if (includesAny(text, ["dron"])) return Plane;

  if (includesAny(text, ["mobitel", "telefon", "smartfon", "iphone", "android"])) return Smartphone;
  if (includesAny(text, ["laptop", "racunar", "kompjuter", "notebook", "pc"])) return Laptop;
  if (includesAny(text, ["desktop", "monitor", "all in one"])) return Monitor;
  if (includesAny(text, ["tastatur", "tipkovnic", "keyboard", "mis "])) return Keyboard;
  if (includesAny(text, ["hard disk", "ssd", "hdd", "storage"])) return HardDrive;
  if (includesAny(text, ["ram", "memorij"])) return MemoryStick;
  if (includesAny(text, ["procesor", "cpu"])) return Cpu;
  if (includesAny(text, ["printer", "stampac", "skener"])) return Printer;
  if (includesAny(text, ["kabal", "punjac", "adapter", "struja", "elektr"])) return PlugZap;
  if (includesAny(text, ["baterij", "powerbank"])) return BatteryCharging;
  if (includesAny(text, ["robot"])) return Bot;

  if (includesAny(text, ["namjestaj", "dnevni boravak", "kau", "sofa"])) return Sofa;
  if (includesAny(text, ["stolic", "stolica"])) return Sofa;
  if (includesAny(text, ["krevet", "madrac"])) return Bed;
  if (includesAny(text, ["rasvjet", "lampa", "lust"])) return Lamp;
  if (includesAny(text, ["kupat", "kupaon", "kada"])) return Bath;
  if (includesAny(text, ["toalet", "wc"])) return Toilet;
  if (includesAny(text, ["kuhinj", "posud"])) return CookingPot;
  if (includesAny(text, ["restoran", "hrana", "jela", "pribor"])) return UtensilsCrossed;
  if (includesAny(text, ["chef", "kuhar", "pecenje"])) return ChefHat;

  if (includesAny(text, ["haljin", "pantalon", "trenerk", "hlace", "patik", "cipe", "obuc", "odjec", "majic", "jakn", "kosulj", "torb", "tasn"])) return Shirt;
  if (includesAny(text, ["sat", "rucni sat", "naocal", "sunce"])) return Gem;
  if (includesAny(text, ["nakit", "zlat", "sreb", "prsten", "ogrlic"])) return Gem;

  if (WORD_BOUNDARY("pas").test(text) || includesAny(text, ["psi"])) return Dog;
  if (WORD_BOUNDARY("macka").test(text) || includesAny(text, ["mace", "macak"])) return Cat;
  if (includesAny(text, ["riba", "akvar"])) return Fish;
  if (includesAny(text, ["ptic", "papag"])) return Bird;
  if (includesAny(text, ["konj"])) return PawPrint;
  if (includesAny(text, ["zivotinj", "ljubim"])) return PawPrint;

  if (includesAny(text, ["uslug", "servis", "odrzavanje", "instalacija", "montaza"])) return Wrench;
  if (includesAny(text, ["alat", "majstor", "radion"])) return Wrench;
  if (includesAny(text, ["farb", "boja", "moler"])) return PaintRoller;
  if (includesAny(text, ["trgov", "shop", "prodavn"])) return Store;
  if (includesAny(text, ["posao", "karijer", "zaposl", "freelance"])) return Briefcase;
  if (includesAny(text, ["fabrik", "proizvod"])) return Factory;

  if (includesAny(text, ["traktor", "poljoprivred", "agro"])) return Tractor;
  if (includesAny(text, ["vrt", "saksij", "cvijec", "bilj"])) return Flower2;
  if (includesAny(text, ["drvo", "suma", "prirod"])) return Leaf;

  if (includesAny(text, ["doktor", "zdrav", "medic"])) return Stethoscope;
  if (includesAny(text, ["bolnic", "klinika"])) return Hospital;
  if (includesAny(text, ["lijek", "tablet", "vitamin", "suplement"])) return Pill;
  if (includesAny(text, ["prva pomoc", "zavo"])) return Cross;
  if (includesAny(text, ["frizer", "salon", "brijac", "manikir", "pedikir"])) return Scissors;

  if (includesAny(text, ["knjig", "literatur", "strip", "udzbenik"])) return BookOpen;
  if (includesAny(text, ["edukacij", "skola", "fakultet", "kurs"])) return GraduationCap;
  if (includesAny(text, ["igrack", "slagalic", "puzzle"])) return Puzzle;

  if (includesAny(text, ["novc", "kes", "cash"])) return Coins;
  if (includesAny(text, ["coin", "kripto", "token"])) return Coins;
  if (includesAny(text, ["kartic", "visa", "master"])) return CreditCard;
  if (includesAny(text, ["analitik", "statistik", "trend"])) return TrendingUp;

  if (includesAny(text, ["telefonij", "poziv", "call centar"])) return PhoneCall;
  if (includesAny(text, ["mail", "email", "posta"])) return Mail;
  if (includesAny(text, ["chat", "poruk"])) return MessageCircle;
  if (includesAny(text, ["oglasa", "reklam", "promoc"])) return Megaphone;
  if (includesAny(text, ["notifik", "alarm", "obavijest"])) return Bell;
  if (includesAny(text, ["lokacij", "adresa", "mapa"])) return MapPin;
  if (includesAny(text, ["putov", "turizam", "svijet"])) return Globe;
  if (includesAny(text, ["kompas", "navig"])) return Compass;

  if (includesAny(text, ["karta", "ulaznic", "ticket"])) return Ticket;
  if (includesAny(text, ["poklon", "gift"])) return Gift;
  if (includesAny(text, ["paket", "pakovanje", "dostav"])) return Package;
  if (includesAny(text, ["sport", "fitness", "trening", "rekre"])) return Dumbbell;
  if (includesAny(text, ["dom", "kucanstvo"])) return House;

  return Shapes;
};

const CategorySemanticIcon = ({
  category,
  className = "w-6 h-6",
  preferBackendImage = true,
}) => {
  const isRoot = isRootCategory(category);
  const Icon = isRoot ? pickCategoryIcon(category) : Shapes;
  const categoryLabel =
    category?.translated_name ||
    category?.name ||
    category?.search_name ||
    "Kategorija";

  const backendImageSrc = useMemo(() => {
    if (!preferBackendImage) return "";
    const normalized = normalizeLegacyImageUrl(category?.image);
    if (!normalized) return "";
    return withCategoryImageVersion(normalized, category);
  }, [
    preferBackendImage,
    category?.image,
    category?.updated_at,
    category?.image_updated_at,
    category?.image_updated_at_timestamp,
    category?.image_version,
  ]);

  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [backendImageSrc]);

  const shouldRenderBackendImage = isRoot && Boolean(backendImageSrc) && !imageFailed;

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={categoryLabel}
      title={categoryLabel}
      role="img"
    >
      {shouldRenderBackendImage ? (
        <NextImage
          src={backendImageSrc}
          alt={categoryLabel}
          fill
          sizes="48px"
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
          unoptimized
        />
      ) : (
        <>
          {isRoot ? (
            <Icon
              className="h-full w-full"
              color="var(--lmx-icon-duotone-line)"
              strokeWidth={1.9}
            />
          ) : (
            <span className="h-full w-full" style={{ color: "var(--lmx-icon-duotone-line)" }}>
              <SubcategoryDefaultIcon className="h-full w-full" />
            </span>
          )}
        </>
      )}
    </span>
  );
};

export default CategorySemanticIcon;
