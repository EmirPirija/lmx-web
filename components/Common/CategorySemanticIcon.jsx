import {
  AcornIcon,
  AirplaneIcon,
  BankIcon,
  BarbellIcon,
  BathtubIcon,
  BedIcon,
  BellIcon,
  BicycleIcon,
  BirdIcon,
  BoatIcon,
  BooksIcon,
  BriefcaseIcon,
  BuildingApartmentIcon,
  BusIcon,
  CameraIcon,
  CarProfileIcon,
  CatIcon,
  ChairIcon,
  ChartLineIcon,
  ChatCircleIcon,
  ChefHatIcon,
  CoinsIcon,
  CompassIcon,
  CookingPotIcon,
  CouchIcon,
  CpuIcon,
  CreditCardIcon,
  DesktopTowerIcon,
  DeviceMobileIcon,
  DogIcon,
  DressIcon,
  DresserIcon,
  DroneIcon,
  EnvelopeSimpleIcon,
  FactoryIcon,
  FanIcon,
  FarmIcon,
  FilmSlateIcon,
  FirstAidKitIcon,
  FishIcon,
  ForkKnifeIcon,
  GameControllerIcon,
  GiftIcon,
  GlobeIcon,
  GraduationCapIcon,
  HandbagIcon,
  HardDriveIcon,
  HeadphonesIcon,
  HorseIcon,
  HospitalIcon,
  HouseSimpleIcon,
  JoystickIcon,
  KeyboardIcon,
  LampIcon,
  LaptopIcon,
  LeafIcon,
  LightningIcon,
  MapPinIcon,
  MegaphoneIcon,
  MemoryIcon,
  MicrophoneStageIcon,
  MoneyIcon,
  MotorcycleIcon,
  NeedleIcon,
  PackageIcon,
  PaintRollerIcon,
  PantsIcon,
  PawPrintIcon,
  PhoneCallIcon,
  PillIcon,
  PlugsConnectedIcon,
  PottedPlantIcon,
  PrinterIcon,
  PuzzlePieceIcon,
  RobotIcon,
  ScissorsIcon,
  ShirtFoldedIcon,
  SneakerIcon,
  SnowflakeIcon,
  SpeakerHighIcon,
  StethoscopeIcon,
  StorefrontIcon,
  TelevisionSimpleIcon,
  TicketIcon,
  ToiletIcon,
  ToolboxIcon,
  TractorIcon,
  TruckIcon,
  WatchIcon,
  WrenchIcon,
  DiamondIcon,
  EyeglassesIcon,
} from "@phosphor-icons/react";

const PRIMARY_FILL = "#0ab6af";
const SECONDARY_FILL = "#dadad5";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const WORD_BOUNDARY = (word) => new RegExp(`(^|\\s)${word}(?=\\s|$)`);

const pickCategoryIcon = (category) => {
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

  if (!text) return AcornIcon;

  // Cooling appliances: "frizider" fallback with cooling icon.
  if (includesAny(text, ["frizider", "hladnjak", "zamrzivac"])) return SnowflakeIcon;

  // Vehicles
  if (includesAny(text, ["motor", "motocikl", "skuter", "moped"])) return MotorcycleIcon;
  if (includesAny(text, ["bicikl"])) return BicycleIcon;
  if (includesAny(text, ["kamion", "prikolica", "teretn"])) return TruckIcon;
  if (includesAny(text, ["autobus", "bus"])) return BusIcon;
  if (includesAny(text, ["brod", "camac", "plov"])) return BoatIcon;
  if (includesAny(text, ["avion", "let"])) return AirplaneIcon;
  if (includesAny(text, ["auto", "automobil", "vozil"])) return CarProfileIcon;

  // Real estate
  if (includesAny(text, ["nekretnin", "stan", "apartman", "kuca", "vikendic", "zemljis"])) {
    return BuildingApartmentIcon;
  }

  // Audio / media / games
  if (includesAny(text, ["zvucnik", "soundbar", "audio", "hifi", "hi fi"])) return SpeakerHighIcon;
  if (includesAny(text, ["mikrofon", "studio", "vokal"])) return MicrophoneStageIcon;
  if (includesAny(text, ["slusalic", "headset", "earbud"])) return HeadphonesIcon;
  if (includesAny(text, ["konzol", "playstation", "xbox", "nintendo", "video igra", "gaming"])) {
    return GameControllerIcon;
  }
  if (includesAny(text, ["dzojstik", "joystick"])) return JoystickIcon;
  if (includesAny(text, ["tv", "televizor", "televizija"])) return TelevisionSimpleIcon;
  if (includesAny(text, ["kamera", "foto", "objektiv"])) return CameraIcon;
  if (includesAny(text, ["film", "video produkcija", "videograf"])) return FilmSlateIcon;
  if (includesAny(text, ["dron"])) return DroneIcon;

  // Tech
  if (includesAny(text, ["mobitel", "telefon", "smartfon", "iphone", "android"])) return DeviceMobileIcon;
  if (includesAny(text, ["laptop", "racunar", "kompjuter", "notebook", "pc"])) return LaptopIcon;
  if (includesAny(text, ["desktop", "monitor", "all in one"])) return DesktopTowerIcon;
  if (includesAny(text, ["tastatur", "tipkovnic", "keyboard", "mis "])) return KeyboardIcon;
  if (includesAny(text, ["hard disk", "ssd", "hdd", "storage"])) return HardDriveIcon;
  if (includesAny(text, ["ram", "memorij"])) return MemoryIcon;
  if (includesAny(text, ["procesor", "cpu"])) return CpuIcon;
  if (includesAny(text, ["printer", "stampac", "skener"])) return PrinterIcon;
  if (includesAny(text, ["kabal", "punjac", "adapter", "struja", "elektr"])) return PlugsConnectedIcon;
  if (includesAny(text, ["baterij", "powerbank"])) return LightningIcon;
  if (includesAny(text, ["robot"])) return RobotIcon;

  // Home
  if (includesAny(text, ["namjestaj", "dnevni boravak", "kau", "sofa"])) return CouchIcon;
  if (includesAny(text, ["stolic", "stolica"])) return ChairIcon;
  if (includesAny(text, ["krevet", "madrac"])) return BedIcon;
  if (includesAny(text, ["ormar", "komoda", "dresser"])) return DresserIcon;
  if (includesAny(text, ["rasvjet", "lampa", "lust"])) return LampIcon;
  if (includesAny(text, ["kupat", "kupaon", "kada"])) return BathtubIcon;
  if (includesAny(text, ["toalet", "wc"])) return ToiletIcon;
  if (includesAny(text, ["kuhinj", "posud"])) return CookingPotIcon;
  if (includesAny(text, ["restoran", "hrana", "jela", "pribor"])) return ForkKnifeIcon;
  if (includesAny(text, ["chef", "kuhar", "pecenje"])) return ChefHatIcon;

  // Fashion / accessories
  if (includesAny(text, ["haljin"])) return DressIcon;
  if (includesAny(text, ["pantalon", "trenerk", "hlace"])) return PantsIcon;
  if (includesAny(text, ["patik", "cipe", "obuc"])) return SneakerIcon;
  if (includesAny(text, ["odjec", "majic", "jakn", "kosulj"])) return ShirtFoldedIcon;
  if (includesAny(text, ["torb", "tasn"])) return HandbagIcon;
  if (includesAny(text, ["sat", "rucni sat"])) return WatchIcon;
  if (includesAny(text, ["naocal", "sunce"])) return EyeglassesIcon;
  if (includesAny(text, ["nakit", "zlat", "sreb", "prsten", "ogrlic"])) return DiamondIcon;

  // Animals
  if (WORD_BOUNDARY("pas").test(text) || includesAny(text, ["psi"])) return DogIcon;
  if (WORD_BOUNDARY("macka").test(text) || includesAny(text, ["mace", "macak"])) return CatIcon;
  if (includesAny(text, ["riba", "akvar"])) return FishIcon;
  if (includesAny(text, ["ptic", "papag"])) return BirdIcon;
  if (includesAny(text, ["konj"])) return HorseIcon;
  if (includesAny(text, ["zivotinj", "ljubim"])) return PawPrintIcon;

  // Services / business
  if (includesAny(text, ["uslug", "servis", "odrzavanje", "instalacija", "montaza"])) return ToolboxIcon;
  if (includesAny(text, ["alat", "majstor", "radion"])) return WrenchIcon;
  if (includesAny(text, ["farb", "boja", "moler"])) return PaintRollerIcon;
  if (includesAny(text, ["trgov", "shop", "prodavn"])) return StorefrontIcon;
  if (includesAny(text, ["posao", "karijer", "zaposl", "freelance"])) return BriefcaseIcon;
  if (includesAny(text, ["fabrik", "proizvod"])) return FactoryIcon;

  // Outdoor / agriculture
  if (includesAny(text, ["traktor", "poljoprivred", "agro"])) return TractorIcon;
  if (includesAny(text, ["farma"])) return FarmIcon;
  if (includesAny(text, ["vrt", "saksij", "cvijec", "bilj"])) return PottedPlantIcon;
  if (includesAny(text, ["drvo", "suma", "prirod"])) return LeafIcon;
  if (includesAny(text, ["ventilator", "hladenje"])) return FanIcon;

  // Health / beauty
  if (includesAny(text, ["doktor", "zdrav", "medic"])) return StethoscopeIcon;
  if (includesAny(text, ["bolnic", "klinika"])) return HospitalIcon;
  if (includesAny(text, ["lijek", "tablet", "vitamin", "suplement"])) return PillIcon;
  if (includesAny(text, ["prva pomoc", "zavo"])) return FirstAidKitIcon;
  if (includesAny(text, ["tetov", "injekc"])) return NeedleIcon;
  if (includesAny(text, ["frizer", "salon", "brijac", "manikir", "pedikir"])) return ScissorsIcon;

  // Education / books / hobbies
  if (includesAny(text, ["knjig", "literatur", "strip", "udzbenik"])) return BooksIcon;
  if (includesAny(text, ["edukacij", "skola", "fakultet", "kurs"])) return GraduationCapIcon;
  if (includesAny(text, ["igrack", "slagalic", "puzzle"])) return PuzzlePieceIcon;

  // Finance / sales
  if (includesAny(text, ["novc", "kes", "cash"])) return MoneyIcon;
  if (includesAny(text, ["coin", "kripto", "token"])) return CoinsIcon;
  if (includesAny(text, ["kartic", "visa", "master"])) return CreditCardIcon;
  if (includesAny(text, ["banka", "bank"])) return BankIcon;
  if (includesAny(text, ["analitik", "statistik", "trend"])) return ChartLineIcon;

  // Comms / media / places
  if (includesAny(text, ["telefonij", "poziv", "call centar"])) return PhoneCallIcon;
  if (includesAny(text, ["mail", "email", "posta"])) return EnvelopeSimpleIcon;
  if (includesAny(text, ["chat", "poruk"])) return ChatCircleIcon;
  if (includesAny(text, ["oglasa", "reklam", "promoc"])) return MegaphoneIcon;
  if (includesAny(text, ["notifik", "alarm", "obavijest"])) return BellIcon;
  if (includesAny(text, ["lokacij", "adresa", "mapa"])) return MapPinIcon;
  if (includesAny(text, ["putov", "turizam", "svijet"])) return GlobeIcon;
  if (includesAny(text, ["kompas", "navig"])) return CompassIcon;

  // Generic commerce
  if (includesAny(text, ["karta", "ulaznic", "ticket"])) return TicketIcon;
  if (includesAny(text, ["poklon", "gift"])) return GiftIcon;
  if (includesAny(text, ["paket", "pakovanje", "dostav"])) return PackageIcon;
  if (includesAny(text, ["sport", "fitness", "trening", "rekre"])) return BarbellIcon;
  if (includesAny(text, ["dom", "kucanstvo"])) return HouseSimpleIcon;

  return AcornIcon;
};

const CategorySemanticIcon = ({ category, className = "w-6 h-6" }) => {
  const Icon = pickCategoryIcon(category);

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <Icon
        weight="duotone"
        color={SECONDARY_FILL}
        className="absolute inset-0 h-full w-full"
      />
      <Icon
        weight="regular"
        color={PRIMARY_FILL}
        className="h-full w-full"
      />
    </span>
  );
};

export default CategorySemanticIcon;

