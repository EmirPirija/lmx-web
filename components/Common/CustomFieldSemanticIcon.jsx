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
  Settings2,
  MapPin,
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
} from "@/components/Common/UnifiedIconPack";

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
  if (hasAnyPhrase(text, ["model"])) return Car;
  if (hasAnyPhrase(text, ["stanje oglasa", "stanje"])) return CheckCircle2;
  if (hasAnyPhrase(text, ["godiste", "godište", "registrovan do", "registracija", "datum"])) return CalendarDays;
  if (hasAnyPhrase(text, ["gorivo"])) return Fuel;
  if (hasAnyPhrase(text, ["kilometraza", "kilometraza km", "kilometraža"])) return Gauge;
  if (hasAnyPhrase(text, ["kubikaza", "kubikaža", "ccm"])) return Gauge;
  if (hasAnyPhrase(text, ["snaga motora", "snaga"])) return TrendingUp;
  if (hasAnyPhrase(text, ["mjenjac", "mjenjač", "transmisija"])) return Settings2;
  if (hasAnyPhrase(text, ["pogon"])) return Car;
  if (hasAnyPhrase(text, ["karoserija", "tip karoserije"])) return Car;
  if (hasAnyPhrase(text, ["broj vrata", "vrata"])) return DoorOpen;
  if (hasAnyPhrase(text, ["broj sjedista", "broj sjedišta", "sjedista", "sjedišta"])) return Armchair;
  if (hasAnyPhrase(text, ["boja vozila", "vrsta boje", "boja", "boje"])) return Palette;
  if (hasAnyPhrase(text, ["emisioni standard", "emisije", "co2", "euro"])) return Leaf;
  if (hasAnyPhrase(text, ["porijeklo vozila", "porijeklo"])) return MapPin;
  if (hasAnyPhrase(text, ["klima uredjaj", "klima uređaj", "klima", "hladenje"])) return Snowflake;
  if (hasAnyPhrase(text, ["sigurnosna oprema", "sigurnost", "zastita", "zaštita"])) return ShieldCheck;

  if (hasAny(text, ["registrovan", "registracija", "registrovano", "datum", "godiste", "godina", "rok", "vazi do", "period", "godisnje doba"])) {
    return CalendarDays;
  }

  if (hasAny(text, ["proizvodjac", "proizvodac", "brend", "marka", "autor", "izdavac"])) return Factory;
  if (hasAny(text, ["model", "linija", "edition", "verzija"])) return Car;
  if (hasAny(text, ["stanje", "ispravnost", "ocuvanost", "autenticnost"])) return CheckCircle2;
  if (hasAny(text, ["gorivo", "benzin", "dizel", "plin", "lpg", "hibrid"])) return Fuel;
  if (hasAny(text, ["kilometra", "km", "snaga", "rpm", "obrtaj", "brzina", "performans"])) return Gauge;
  if (hasAny(text, ["kubikaza", "ccm", "motor", "zapremina", "cilindar", "turbina"])) return Gauge;
  if (hasAny(text, ["mjenjac", "transmisija", "gearbox"])) return Settings2;
  if (hasAny(text, ["pogon", "awd", "4x4", "fwd", "rwd"])) return Car;
  if (hasAny(text, ["karoserija", "tip vozila", "body"])) return Car;
  if (hasAny(text, ["vrata"])) return DoorOpen;
  if (hasAny(text, ["sjedista", "sjediste", "seat"])) return Armchair;
  if (hasAny(text, ["boja", "nijansa", "pigment"])) return Palette;
  if (hasAny(text, ["emisioni", "emisija", "euro", "co2", "ekolos"])) return Leaf;
  if (hasAny(text, ["porijeklo", "drzava porijekla", "geografsko"])) return MapPin;
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

const RightSmallFillDefaultIcon = ({ className = "h-full w-full" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    className={className}
    aria-hidden="true"
  >
    <g fill="none" fillRule="evenodd">
      <path
        fill="currentColor"
        d="M8.395999999999999 15.505333333333333l-0.008 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023999999999999997c-0.006666666666666666 -0.002 -0.012666666666666666 0 -0.016 0.004l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.010666666666666666 -0.011999999999999999Zm0.176 -0.07533333333333334 -0.009333333333333332 0.0013333333333333333 -0.12266666666666666 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.005333333333333333 0.134 0.06133333333333333c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.002 -0.007333333333333332 0.011999999999999999 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z"
      />
      <path
        fill="currentColor"
        d="M9.690666666666665 8.471333333333334a0.6666666666666666 0.6666666666666666 0 0 0 0 -0.9426666666666665l-1.8860000000000001 -1.8860000000000001A0.6666666666666666 0.6666666666666666 0 0 0 6.666666666666666 6.1146666666666665v3.770666666666666a0.6666666666666666 0.6666666666666666 0 0 0 1.138 0.472l1.8860000000000001 -1.8860000000000001Z"
      />
    </g>
  </svg>
);

const CustomFieldSemanticIcon = ({
  fieldLabel,
  className = "w-4 h-4",
  useDefaultIcon = true,
}) => {
  const FallbackIcon = pickFieldIcon(fieldLabel);
  const label = fieldLabel || "Polje";

  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={label}
      title={label}
      role="img"
      style={{ color: "var(--lmx-icon-duotone-line)" }}
    >
      {useDefaultIcon ? (
        <RightSmallFillDefaultIcon className="h-full w-full" />
      ) : (
        <FallbackIcon
          className="h-full w-full"
          color="var(--lmx-icon-duotone-line)"
          strokeWidth={1.9}
        />
      )}
    </span>
  );
};

export default CustomFieldSemanticIcon;
