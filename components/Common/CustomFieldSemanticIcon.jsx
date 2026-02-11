import {
  ArmchairIcon,
  BatteryHighIcon,
  BluetoothIcon,
  CalendarBlankIcon,
  CarProfileIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  CpuIcon,
  CubeIcon,
  DeviceMobileIcon,
  DoorIcon,
  EngineIcon,
  FactoryIcon,
  GasPumpIcon,
  GaugeIcon,
  GearSixIcon,
  GlobeHemisphereWestIcon,
  HardDriveIcon,
  HashIcon,
  HouseSimpleIcon,
  LeafIcon,
  MicrophoneStageIcon,
  PaletteIcon,
  PawPrintIcon,
  PlugChargingIcon,
  PlugsConnectedIcon,
  RulerIcon,
  ShieldCheckIcon,
  SnowflakeIcon,
  SpeakerHighIcon,
  SteeringWheelIcon,
  TagIcon,
  WifiHighIcon,
  WrenchIcon,
} from "@phosphor-icons/react";

const PRIMARY_FILL = "#dadad5";
const SECONDARY_FILL = "#0ab6af";

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
  if (!text) return TagIcon;

  // Precizni match-evi za auto polja (izbjegava kolizije tipa "karoserija" -> "serija")
  if (hasAnyPhrase(text, ["proizvodjac", "proizvodac", "marka vozila", "marka"])) return FactoryIcon;
  if (hasAnyPhrase(text, ["model"])) return TagIcon;
  if (hasAnyPhrase(text, ["stanje oglasa", "stanje"])) return CheckCircleIcon;
  if (hasAnyPhrase(text, ["godiste", "godište", "registrovan do", "registracija", "datum"])) return CalendarBlankIcon;
  if (hasAnyPhrase(text, ["gorivo"])) return GasPumpIcon;
  if (hasAnyPhrase(text, ["kilometraza", "kilometraza km", "kilometraža"])) return GaugeIcon;
  if (hasAnyPhrase(text, ["kubikaza", "kubikaža", "ccm"])) return EngineIcon;
  if (hasAnyPhrase(text, ["snaga motora", "snaga"])) return ChartLineUpIcon;
  if (hasAnyPhrase(text, ["mjenjac", "mjenjač", "transmisija"])) return GearSixIcon;
  if (hasAnyPhrase(text, ["pogon"])) return SteeringWheelIcon;
  if (hasAnyPhrase(text, ["karoserija", "tip karoserije"])) return CarProfileIcon;
  if (hasAnyPhrase(text, ["broj vrata", "vrata"])) return DoorIcon;
  if (hasAnyPhrase(text, ["broj sjedista", "broj sjedišta", "sjedista", "sjedišta"])) return ArmchairIcon;
  if (hasAnyPhrase(text, ["boja vozila", "vrsta boje", "boja", "boje"])) return PaletteIcon;
  if (hasAnyPhrase(text, ["emisioni standard", "emisije", "co2", "euro"])) return LeafIcon;
  if (hasAnyPhrase(text, ["porijeklo vozila", "porijeklo"])) return GlobeHemisphereWestIcon;
  if (hasAnyPhrase(text, ["klima uredjaj", "klima uređaj", "klima", "hladenje"])) return SnowflakeIcon;
  if (hasAnyPhrase(text, ["sigurnosna oprema", "sigurnost", "zastita", "zaštita"])) return ShieldCheckIcon;

  if (
    hasAny(text, [
      "registrovan",
      "registracija",
      "registrovano",
      "datum",
      "godiste",
      "godina",
      "rok",
      "vazi do",
      "period",
      "godisnje doba",
    ])
  ) {
    return CalendarBlankIcon;
  }

  if (hasAny(text, ["proizvodjac", "proizvodac", "brend", "marka", "autor", "izdavac"])) {
    return FactoryIcon;
  }

  if (hasAny(text, ["model", "linija", "edition", "verzija"])) {
    return TagIcon;
  }

  if (hasAny(text, ["stanje", "ispravnost", "ocuvanost", "autenticnost"])) {
    return CheckCircleIcon;
  }

  if (hasAny(text, ["gorivo", "benzin", "dizel", "plin", "lpg", "hibrid"])) {
    return GasPumpIcon;
  }

  if (hasAny(text, ["kilometra", "km", "snaga", "rpm", "obrtaj", "brzina", "performans"])) {
    return GaugeIcon;
  }

  if (hasAny(text, ["kubikaza", "ccm", "motor", "zapremina", "cilindar", "turbina"])) {
    return EngineIcon;
  }

  if (hasAny(text, ["mjenjac", "transmisija", "gearbox"])) {
    return GearSixIcon;
  }

  if (hasAny(text, ["pogon", "awd", "4x4", "fwd", "rwd"])) {
    return SteeringWheelIcon;
  }

  if (hasAny(text, ["karoserija", "tip vozila", "body"])) {
    return CarProfileIcon;
  }

  if (hasAny(text, ["vrata"])) {
    return DoorIcon;
  }

  if (hasAny(text, ["sjedista", "sjediste", "seat"])) {
    return ArmchairIcon;
  }

  if (hasAny(text, ["boja", "nijansa", "pigment"])) {
    return PaletteIcon;
  }

  if (hasAny(text, ["emisioni", "emisija", "euro", "co2", "ekolos"])) {
    return LeafIcon;
  }

  if (hasAny(text, ["porijeklo", "drzava porijekla", "geografsko"])) {
    return GlobeHemisphereWestIcon;
  }

  if (hasAny(text, ["klima", "hladenje", "airflow", "temperatura", "ventilator"])) {
    return SnowflakeIcon;
  }

  if (hasAny(text, ["sigurnosna", "zastita", "airbag", "abs", "esp", "certifikat", "garancija"])) {
    return ShieldCheckIcon;
  }

  if (hasAny(text, ["baterija", "ciklusi", "kapacitet baterije", "powerbank"])) {
    return BatteryHighIcon;
  }
  if (hasAny(text, ["punjenje", "brzo punjenje", "slot punjaca"])) {
    return PlugChargingIcon;
  }

  if (hasAny(text, ["procesor", "cpu", "chip", "jezgr"])) {
    return CpuIcon;
  }

  if (hasAny(text, ["memorija", "pohrane", "storage", "ssd", "hdd", "disk", "ram"])) {
    return HardDriveIcon;
  }

  if (hasAny(text, ["ekran", "display", "dijagonala", "rezolucija", "fov", "inci", "osvjez"])) {
    return DeviceMobileIcon;
  }

  if (hasAny(text, ["mikrofon", "karaoke", "glasovni"])) {
    return MicrophoneStageIcon;
  }

  if (hasAny(text, ["zvucnik", "audio", "dolby", "dts", "slusalic", "sound"])) {
    return SpeakerHighIcon;
  }

  if (hasAny(text, ["bluetooth"])) {
    return BluetoothIcon;
  }

  if (hasAny(text, ["wifi", "wi fi", "5g", "4g", "gps", "nfc", "iptv"])) {
    return WifiHighIcon;
  }

  if (hasAny(text, ["usb", "hdmi", "konektivnost", "port", "interfejs", "konekcija"])) {
    return PlugsConnectedIcon;
  }

  if (hasAny(text, ["dimenzije", "velicina", "duzina", "sirina", "visina", "tezina", "debljina", "promjer"])) {
    return RulerIcon;
  }

  if (hasAny(text, ["oprema", "dodatna", "funkcije", "set", "mod", "namjena"])) {
    return WrenchIcon;
  }

  if (hasAny(text, ["imei", "isbn", "serijski", "broj"])) {
    return HashIcon;
  }

  if (hasAny(text, ["zivotinje", "ljubim", "pas", "macka", "ptica", "riba"])) {
    return PawPrintIcon;
  }

  if (hasAny(text, ["soba", "kupatilo", "nekretnina", "infrastruktura", "grijanje"])) {
    return HouseSimpleIcon;
  }

  if (hasAny(text, ["tip", "vrsta", "format", "klasa"])) {
    return CubeIcon;
  }

  return TagIcon;
};

const CustomFieldSemanticIcon = ({ fieldLabel, className = "w-4 h-4" }) => {
  const Icon = pickFieldIcon(fieldLabel);

  return (
    <span className={`relative inline-flex items-center justify-center ${className}`} aria-hidden="true">
      <Icon
        weight="fill"
        color={SECONDARY_FILL}
        className="absolute inset-0 h-full w-full"
      />
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

export default CustomFieldSemanticIcon;
