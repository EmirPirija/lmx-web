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
} from "lucide-react";
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

  if (includesAny(text, ["nekretnin", "stan", "apartman", "kuca", "vikendic", "zemljis"])) {
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
  const Icon = pickCategoryIcon(category);
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

  const shouldRenderBackendImage = Boolean(backendImageSrc) && !imageFailed;

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
        <Icon
          className="h-full w-full"
          color="var(--lmx-icon-duotone-line)"
          strokeWidth={1.9}
        />
      )}
    </span>
  );
};

export default CategorySemanticIcon;
