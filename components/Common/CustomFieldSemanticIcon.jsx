import {
  Armchair,
  BatteryCharging,
  Bluetooth,
  CalendarDays,
  Car,
  TrendingUp,
  CheckCircle2,
  Cpu,
  Box,
  DoorOpen,
  Factory,
  Fuel,
  Gauge,
  Settings,
  Globe,
  HardDrive,
  Hash,
  House,
  Leaf,
  Mic,
  Palette,
  PawPrint,
  PlugZap,
  Plug,
  Ruler,
  ShieldCheck,
  Snowflake,
  Volume2,
  Tag,
  Wifi,
  Wrench,
  Smartphone,
} from "lucide-react";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const hasAny = (text, terms = []) => terms.some((term) => text.includes(term));
const withPad = (text) => ` ${text} `;
const hasPhrase = (text, phrase) => withPad(text).includes(` ${normalize(phrase)} `);
const hasAnyPhrase = (text, phrases = []) => phrases.some((phrase) => hasPhrase(text, phrase));

const pickFieldIcon = (fieldLabel = "") => {
  const text = normalize(fieldLabel);
  if (!text) return Tag;

  if (hasAnyPhrase(text, ["proizvodjac", "proizvodac", "marka vozila", "marka"])) return Factory;
  if (hasAnyPhrase(text, ["model"])) return Tag;
  if (hasAnyPhrase(text, ["stanje oglasa", "stanje"])) return CheckCircle2;
  if (hasAnyPhrase(text, ["godiste", "godište", "registrovan do", "registracija", "datum"])) return CalendarDays;
  if (hasAnyPhrase(text, ["gorivo"])) return Fuel;
  if (hasAnyPhrase(text, ["kilometraza", "kilometraza km", "kilometraža"])) return Gauge;
  if (hasAnyPhrase(text, ["kubikaza", "kubikaža", "ccm"])) return Settings;
  if (hasAnyPhrase(text, ["snaga motora", "snaga"])) return TrendingUp;
  if (hasAnyPhrase(text, ["mjenjac", "mjenjač", "transmisija"])) return Settings;
  if (hasAnyPhrase(text, ["pogon"])) return Car;
  if (hasAnyPhrase(text, ["karoserija", "tip karoserije"])) return Car;
  if (hasAnyPhrase(text, ["broj vrata", "vrata"])) return DoorOpen;
  if (hasAnyPhrase(text, ["broj sjedista", "broj sjedišta", "sjedista", "sjedišta"])) return Armchair;
  if (hasAnyPhrase(text, ["boja vozila", "vrsta boje", "boja", "boje"])) return Palette;
  if (hasAnyPhrase(text, ["emisioni standard", "emisije", "co2", "euro"])) return Leaf;
  if (hasAnyPhrase(text, ["porijeklo vozila", "porijeklo"])) return Globe;
  if (hasAnyPhrase(text, ["klima uredjaj", "klima uređaj", "klima", "hladenje"])) return Snowflake;
  if (hasAnyPhrase(text, ["sigurnosna oprema", "sigurnost", "zastita", "zaštita"])) return ShieldCheck;

  if (hasAny(text, ["registrovan", "registracija", "registrovano", "datum", "godiste", "godina", "rok", "vazi do", "period", "godisnje doba"])) {
    return CalendarDays;
  }

  if (hasAny(text, ["proizvodjac", "proizvodac", "brend", "marka", "autor", "izdavac"])) return Factory;
  if (hasAny(text, ["model", "linija", "edition", "verzija"])) return Tag;
  if (hasAny(text, ["stanje", "ispravnost", "ocuvanost", "autenticnost"])) return CheckCircle2;
  if (hasAny(text, ["gorivo", "benzin", "dizel", "plin", "lpg", "hibrid"])) return Fuel;
  if (hasAny(text, ["kilometra", "km", "snaga", "rpm", "obrtaj", "brzina", "performans"])) return Gauge;
  if (hasAny(text, ["kubikaza", "ccm", "motor", "zapremina", "cilindar", "turbina"])) return Settings;
  if (hasAny(text, ["mjenjac", "transmisija", "gearbox"])) return Settings;
  if (hasAny(text, ["pogon", "awd", "4x4", "fwd", "rwd"])) return Car;
  if (hasAny(text, ["karoserija", "tip vozila", "body"])) return Car;
  if (hasAny(text, ["vrata"])) return DoorOpen;
  if (hasAny(text, ["sjedista", "sjediste", "seat"])) return Armchair;
  if (hasAny(text, ["boja", "nijansa", "pigment"])) return Palette;
  if (hasAny(text, ["emisioni", "emisija", "euro", "co2", "ekolos"])) return Leaf;
  if (hasAny(text, ["porijeklo", "drzava porijekla", "geografsko"])) return Globe;
  if (hasAny(text, ["klima", "hladenje", "airflow", "temperatura", "ventilator"])) return Snowflake;
  if (hasAny(text, ["sigurnosna", "zastita", "airbag", "abs", "esp", "certifikat", "garancija"])) return ShieldCheck;

  if (hasAny(text, ["baterija", "ciklusi", "kapacitet baterije", "powerbank"])) return BatteryCharging;
  if (hasAny(text, ["punjenje", "brzo punjenje", "slot punjaca"])) return PlugZap;
  if (hasAny(text, ["procesor", "cpu", "chip", "jezgr"])) return Cpu;
  if (hasAny(text, ["memorija", "pohrane", "storage", "ssd", "hdd", "disk", "ram"])) return HardDrive;
  if (hasAny(text, ["ekran", "display", "dijagonala", "rezolucija", "fov", "inci", "osvjez"])) return Smartphone;
  if (hasAny(text, ["mikrofon", "karaoke", "glasovni"])) return Mic;
  if (hasAny(text, ["zvucnik", "audio", "dolby", "dts", "slusalic", "sound"])) return Volume2;
  if (hasAny(text, ["bluetooth"])) return Bluetooth;
  if (hasAny(text, ["wifi", "wi fi", "5g", "4g", "gps", "nfc", "iptv"])) return Wifi;
  if (hasAny(text, ["usb", "hdmi", "konektivnost", "port", "interfejs", "konekcija"])) return Plug;
  if (hasAny(text, ["dimenzije", "velicina", "duzina", "sirina", "visina", "tezina", "debljina", "promjer"])) return Ruler;
  if (hasAny(text, ["oprema", "dodatna", "funkcije", "set", "mod", "namjena"])) return Wrench;
  if (hasAny(text, ["imei", "isbn", "serijski", "broj"])) return Hash;
  if (hasAny(text, ["zivotinje", "ljubim", "pas", "macka", "ptica", "riba"])) return PawPrint;
  if (hasAny(text, ["soba", "kupatilo", "nekretnina", "infrastruktura", "grijanje"])) return House;
  if (hasAny(text, ["tip", "vrsta", "format", "klasa"])) return Box;

  return Tag;
};

const CustomFieldSemanticIcon = ({ fieldLabel, className = "w-4 h-4" }) => {
  const Icon = pickFieldIcon(fieldLabel);
  const label = fieldLabel || "Polje";

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={label}
      title={label}
      role="img"
    >
      <Icon
        className="h-full w-full"
        color="var(--lmx-icon-duotone-line)"
        strokeWidth={1.9}
      />
    </span>
  );
};

export default CustomFieldSemanticIcon;
