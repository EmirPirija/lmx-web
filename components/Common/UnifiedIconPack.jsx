"use client";

import { forwardRef } from "react";
import * as Lu from "lucide-react";

const EXACT_MAP = {
  Filter: "Filter",
  SlidersHorizontal: "SlidersHorizontal",
  LayoutGrid: "LayoutGrid",
  LayoutList: "List",
  ListChecks: "ListChecks",
  GitCompare: "GitCompare",
  ArrowLeftRight: "ArrowLeftRight",
  Loader2: "Loader2",
  VolumeX: "VolumeX",
  VolumeOff: "VolumeX",
  RefreshCw: "RefreshCw",
  RefreshCcw: "RefreshCcw",
  BadgeCheck: "BadgeCheck",
  BadgePercent: "BadgePercent",
  MessageSquare: "MessageSquare",
  MessageSquareMore: "MessageSquareMore",
  MessagesSquare: "MessagesSquare",
  MessageCircle: "MessageCircle",
  Grid3X3: "Grid3x3",
  Grid3x3: "Grid3x3",
  Home: "House",
  Link2: "Link2",
  CalendarCheck: "CalendarCheck2",
  CalendarDays: "CalendarDays",
  ChevronLeft: "ChevronLeft",
  ChevronRight: "ChevronRight",
  ChevronUp: "ChevronUp",
  ChevronDown: "ChevronDown",
  ChevronsUpDown: "ChevronsUpDown",
  ArrowUpDown: "ArrowUpDown",
  SearchX: "SearchX",
  EyeOff: "EyeOff",
  LogOut: "LogOut",
  MoreHorizontal: "MoreHorizontal",
  MoreVertical: "MoreVertical",
  Building2: "Building2",
  Activity: "Activity",
  Navigation: "Navigation",
  Facebook: "Facebook",
  Instagram: "Instagram",
  Youtube: "Youtube",
  ArchiveRestore: "ArchiveRestore",
  ArchiveIcon: "Archive",
  Banknote: "Banknote",
  Bold: "Bold",
  Circle: "Circle",
  FiMaximize2: "Maximize2",
  FiMinimize2: "Minimize2",
  Gem: "Gem",
  IconLoader2: "Loader2",
  IconLogout: "LogOut",
  IconRosetteDiscount: "BadgePercent",
  IconBookmarkFilled: "BookmarkCheck",
  IconStarFilled: "Star",
  IoCreateOutline: "Pencil",
  IoPersonOutline: "UserRound",
  IoHeartOutline: "Heart",
  IoBookmarkOutline: "Bookmark",
  IoSearchOutline: "Search",
  IoBagHandleOutline: "ShoppingBag",
  IoChatbubbleOutline: "MessageCircle",
  IoChatbubbleEllipsesOutline: "MessageCircleMore",
  IoNotificationsOutline: "BellRing",
  IoStorefrontOutline: "Store",
  IoCardOutline: "CreditCard",
  IoReceiptOutline: "Receipt",
  IoStarOutline: "Star",
  IoTrophyOutline: "Trophy",
  IoRibbonOutline: "Medal",
  IoLogOutOutline: "LogOut",
  IoHelpCircleOutline: "Info",
  IoLayersOutline: "Layers",
  IoMdSend: "SendHorizontal",
  IoOptionsOutline: "MoreVertical",
  IoSendOutline: "Send",
  Layers: "Layers",
  Layers3: "Layers3",
  MdDescription: "FileText",
  MdDirections: "Signpost",
  MdExpandMore: "ChevronDown",
  MdMoreVert: "MoreVertical",
  MdSell: "Tag",
  MdSend: "SendHorizontal",
  MdSpeed: "Gauge",
  MdVisibility: "Eye",
  MdVerified: "BadgeCheck",
  Radar: "Radar",
  RiFullscreenLine: "Maximize2",
  Save: "Save",
  Send: "Send",
  Smile: "Smile",
  Type: "Type",
  IoGrid: "LayoutGrid",
  CiGrid2H: "List",
  TbTransferVertical: "ArrowUpDown",
  FaRegEye: "Eye",
  FaRegEyeSlash: "EyeOff",
  FcGoogle: "Chrome",
  FaSquareXTwitter: "Twitter",
  BsTwitterX: "Twitter",
  RiTwitterXLine: "Twitter",
  FaWhatsapp: "MessageCircle",
  FaViber: "PhoneCall",
  FaTelegram: "Send",
  BiLogoWhatsapp: "MessageCircle",
  BiLogoFacebook: "Facebook",
  FaFacebook: "Facebook",
  FaInstagram: "Instagram",
  FaLinkedin: "Linkedin",
  FaPinterest: "Pin",
  SlLocationPin: "MapPin",
  GrLocation: "MapPin",
  RiMailSendFill: "Mail",
  RiMailSendLine: "Mail",
  TbPhoneCall: "PhoneCall",
  BiPhoneCall: "PhoneCall",
  BiCurrentLocation: "LocateFixed",
  MdOutlineEmail: "Mail",
  MdOutlineLocalPhone: "Phone",
  MdOpenInNew: "ExternalLink",
  MdMap: "Map",
  MdList: "List",
  MdFilterList: "Filter",
  MdArrowBack: "ArrowLeft",
  IoArrowBack: "ArrowLeft",
  MdOutlineAttachFile: "Paperclip",
  HiOutlineUpload: "Upload",
  MdTouchApp: "MousePointerClick",
  MdTrendingDown: "TrendingDown",
  MdTrendingUp: "TrendingUp",
  MdHistory: "History",
  MdRocketLaunch: "Rocket",
  IoStatsChart: "BarChart3",
  IoStatsChartOutline: "BarChart3",
  IoLocationOutline: "MapPin",
  IoClose: "X",
  HiX: "X",
  MdClose: "X",
  IoCloseOutline: "X",
  IoCloseCircleOutline: "XCircle",
  IoCloseCircle: "XCircle",
  IoInformationCircleOutline: "Info",
  IoShieldCheckmarkOutline: "ShieldCheck",
  IoAlertCircleOutline: "CircleAlert",
  LiaUserEditSolid: "UserRoundPen",
  RiUserForbidLine: "UserX",
  PiWarningOctagon: "OctagonAlert",
  MdInfoOutline: "Info",
  IoSearch: "Search",
  IoMdAttach: "Paperclip",
  FaMicrophone: "Mic",
  FaRegStopCircle: "CircleStop",
  FaCheck: "Check",
  FaChevronDown: "ChevronDown",
  FaChevronUp: "ChevronUp",
  FaEye: "Eye",
  FaArrowRight: "ArrowRight",
  FaArrowLeft: "ArrowLeft",
  FaAngleRight: "ChevronRight",
  FaRegCalendarCheck: "CalendarCheck2",
  HiOutlinePhotograph: "Image",
  HiOutlineSortDescending: "ArrowDownWideNarrow",
  HiOutlineExclamationCircle: "CircleAlert",
  HiOutlineExternalLink: "ExternalLink",
  HiOutlineTrash: "Trash2",
  HiOutlineSearch: "Search",
  HiOutlineDotsVertical: "MoreVertical",
  HiOutlineArchive: "Archive",
  HiOutlineInboxIn: "Inbox",
  HiOutlineVolumeOff: "VolumeX",
  HiOutlineVolumeUp: "Volume2",
  MdOutlineKeyboardArrowRight: "ChevronRight",
  MdKeyboardArrowUp: "ChevronUp",
  MdCheckCircle: "CheckCircle2",
  MdCheck: "Check",
  MdArrowForward: "ArrowRight",
  MdAttachMoney: "Banknote",
  MdAutorenew: "RefreshCw",
  MdCalendarToday: "CalendarDays",
  MdCameraAlt: "Camera",
  MdChat: "MessageCircle",
  MdChevronLeft: "ChevronLeft",
  MdChevronRight: "ChevronRight",
  MdCloudUpload: "UploadCloud",
  MdDelete: "Trash2",
  MdDownload: "Download",
  MdEdit: "Pencil",
  MdEditLocation: "MapPinned",
  MdExpandLess: "ChevronUp",
  MdFavorite: "Heart",
  MdFavoriteBorder: "Heart",
  MdFlag: "Flag",
  MdInfo: "Info",
  MdInventory: "Package",
  MdLocalOffer: "Tag",
  MdLocationOn: "MapPin",
  MdLock: "Lock",
  MdLockOpen: "LockOpen",
  MdLockOutline: "Lock",
  MdNotificationsNone: "Bell",
  MdOutlineLocationOn: "MapPin",
  MdOutlinePerson: "UserRound",
  MdOutlineTitle: "Type",
  MdPause: "Pause",
  MdPauseCircle: "PauseCircle",
  MdPhone: "Phone",
  MdPhoneIphone: "Smartphone",
  MdPlayArrow: "Play",
  MdQuestionAnswer: "MessageSquareMore",
  MdReceipt: "Receipt",
  MdRefresh: "RefreshCw",
  MdRemove: "Minus",
  MdSettings: "Settings",
  MdShare: "Share2",
  MdShoppingBag: "ShoppingBag",
  MdShuffle: "Shuffle",
  MdStar: "Star",
  MdStorefront: "Store",
  MdSyncAlt: "ArrowLeftRight",
  MdTag: "Tag",
  MdThumbUp: "ThumbsUp",
  MdThumbUpOffAlt: "ThumbsUp",
  MdVerifiedUser: "ShieldCheck",
  MdVolumeOff: "VolumeX",
  MdVolumeUp: "Volume2",
  MdWarning: "TriangleAlert",
  RiArrowLeftLine: "ArrowLeft",
  RiArrowRightLine: "ArrowRight",
  RiPlayCircleFill: "PlayCircle",
  RiVideoLine: "Video",
  RiZoomInLine: "ZoomIn",
  RiZoomOutLine: "ZoomOut",
  IoMenuOutline: "Menu",
  GiHamburgerMenu: "Menu",
  IconUserCircle: "CircleUser",
  IconListDetails: "ListTree",
  IconCurrencyDollar: "Banknote",
  IconCalendarExclamation: "CalendarX2",
  IconCirclePlus: "CirclePlus",
  IconCircleCheck: "CircleCheck",
  IconClockHour4: "Clock3",
  IconEyeOff: "EyeOff",
  IconFileText: "FileText",
  IconLayoutGrid: "LayoutGrid",
  IconLivePhoto: "ImagePlay",
  IconLockSquareRounded: "SquareUserRound",
  IconMessageCircle: "MessageCircle",
  IconWorld: "Globe",
};

const PREFIX_RE = /^(Icon|Io|Md|Fa|Fi|Bs|Bi|Ri|Hi|Gi|Go|Gr|Sl|Tb|Pi|Ci|Lia|Fc)/;
const SUFFIX_RE = /(Outline|Filled|Fill|Line|Alt|Round|Circle|Square|OffAlt|Off|Logo|Solid)$/g;

const KEYWORD_MAP = [
  [/google/, "Chrome"],
  [/facebook/, "Facebook"],
  [/instagram/, "Instagram"],
  [/linkedin/, "Linkedin"],
  [/whatsapp/, "MessageCircle"],
  [/telegram/, "Send"],
  [/twitter|xtwitter/, "Twitter"],
  [/youtube/, "Youtube"],
  [/viber/, "PhoneCall"],
  [/mail|email/, "Mail"],
  [/location|map|pin/, "MapPin"],
  [/phone|call/, "PhoneCall"],
  [/camera|photo|image/, "Image"],
  [/video/, "Video"],
  [/reel/, "Clapperboard"],
  [/microphone/, "Mic"],
  [/volumeup/, "Volume2"],
  [/volumeoff|volumex|mute/, "VolumeX"],
  [/play/, "Play"],
  [/pause/, "Pause"],
  [/star|favorite/, "Star"],
  [/heart/, "Heart"],
  [/chat|message/, "MessageCircle"],
  [/user|profile/, "UserRound"],
  [/home/, "House"],
  [/search/, "Search"],
  [/close|\bx\b/, "X"],
  [/check/, "Check"],
  [/plus|add/, "Plus"],
  [/minus|remove/, "Minus"],
  [/arrowleft|back/, "ArrowLeft"],
  [/arrowright|forward/, "ArrowRight"],
  [/arrowup/, "ArrowUp"],
  [/arrowdown/, "ArrowDown"],
  [/refresh|sync|autorenew/, "RefreshCw"],
  [/upload/, "Upload"],
  [/download/, "Download"],
  [/share/, "Share2"],
  [/settings|gear/, "Settings"],
  [/filter|slider|fader/, "Filter"],
  [/menu|hamburger|list/, "Menu"],
  [/lockopen|unlock/, "LockOpen"],
  [/lock/, "Lock"],
  [/warning|alert|exclamation/, "TriangleAlert"],
  [/info/, "Info"],
  [/bell|notification/, "Bell"],
  [/clock|time|history/, "Clock3"],
  [/calendar/, "CalendarDays"],
  [/money|dollar|price/, "Banknote"],
  [/tag|offer/, "Tag"],
  [/store|shop|bag/, "Store"],
  [/crown|pro/, "Crown"],
  [/trophy|medal|award/, "Trophy"],
  [/package|box|parcel/, "Package"],
  [/receipt|invoice/, "Receipt"],
  [/cloud/, "Cloud"],
  [/wifi/, "Wifi"],
  [/rocket|launch|zap|flash/, "Rocket"],
  [/shield|verified/, "ShieldCheck"],
  [/qr/, "QrCode"],
  [/truck/, "Truck"],
  [/music/, "Music"],
  [/globe|world/, "Globe"],
];

const STOP_TOKENS = new Set([
  "icon",
  "outline",
  "filled",
  "fill",
  "line",
  "alt",
  "round",
  "circle",
  "square",
  "solid",
  "regular",
  "thin",
  "bold",
  "duotone",
  "light",
  "md",
  "io",
  "fa",
  "fi",
  "bs",
  "bi",
  "ri",
  "hi",
  "gi",
  "go",
  "gr",
  "sl",
  "tb",
  "pi",
  "ci",
  "lia",
  "fc",
]);

const TOKEN_ALIASES = {
  attach: "paperclip",
  delete: "trash",
  remove: "trash",
  edit: "pencil",
  logout: "log",
  login: "log",
  chevron: "chevron",
  arrows: "arrow",
  stats: "chart",
  trend: "trending",
  trending: "trending",
  report: "flag",
  title: "text",
  tags: "tag",
  inventory: "package",
  send: "send",
  transfer: "arrow",
  swap: "arrow",
  fullscreen: "maximize",
  zoomin: "zoom",
  zoomout: "zoom",
  maximize: "maximize",
  minimize: "minimize",
  waypoints: "route",
  volume: "volume",
  bookmarkfilled: "bookmark",
  sparkles: "sparkle",
  verified: "badge",
};

const tokenize = (value = "") =>
  String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.replace(/\d+/g, ""))
    .filter(Boolean)
    .filter((token) => !STOP_TOKENS.has(token))
    .map((token) => TOKEN_ALIASES[token] || token);

const isIconComponent = (value) =>
  typeof value === "function" ||
  (value && typeof value === "object" && "$$typeof" in value);
const getByName = (name) => (name && isIconComponent(Lu[name]) ? Lu[name] : null);

const LUCIDE_ICON_CANDIDATES = Object.keys(Lu)
  .filter((name) => /^[A-Z]/.test(name) && isIconComponent(Lu[name]))
  .map((name) => ({ name, tokens: tokenize(name) }));

const chooseFuzzyLucideIcon = (sourceName) => {
  const sourceTokens = tokenize(sourceName);
  if (!sourceTokens.length) return null;

  let bestName = null;
  let bestScore = 0;

  for (const candidate of LUCIDE_ICON_CANDIDATES) {
    if (!candidate.tokens.length) continue;

    const shared = sourceTokens.filter((token) => candidate.tokens.includes(token)).length;
    if (!shared) continue;

    let score = shared * 4;
    if (candidate.tokens[0] && candidate.tokens[0] === sourceTokens[0]) score += 2;
    if (candidate.tokens.length === sourceTokens.length) score += 1;
    if (shared === sourceTokens.length) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestName = candidate.name;
    }
  }

  if (bestName && bestScore >= 4) {
    return getByName(bestName);
  }

  return null;
};

const resolveLucideIcon = (sourceName) => {
  const mapped = EXACT_MAP[sourceName];
  if (mapped && getByName(mapped)) return getByName(mapped);

  const direct = getByName(sourceName);
  if (direct) return direct;

  if (sourceName.startsWith("Icon")) {
    const droppedPrefix = sourceName.slice(4);
    const prefixedCandidate = getByName(droppedPrefix);
    if (prefixedCandidate) return prefixedCandidate;
  }

  const stripped = sourceName
    .replace(PREFIX_RE, "")
    .replace(SUFFIX_RE, "")
    .replace(/\d+$/, "")
    .trim();

  const strippedCandidate = getByName(stripped);
  if (strippedCandidate) return strippedCandidate;

  const lower = sourceName.toLowerCase();
  for (const [pattern, iconName] of KEYWORD_MAP) {
    if (pattern.test(lower)) {
      const icon = getByName(iconName);
      if (icon) return icon;
    }
  }

  const fuzzyIcon = chooseFuzzyLucideIcon(sourceName);
  if (fuzzyIcon) return fuzzyIcon;

  return getByName("Shapes") || getByName("Circle") || getByName("Info") || null;
};

const WEIGHT_TO_STROKE = {
  thin: 1,
  light: 1.5,
  regular: 2,
  normal: 2,
  duotone: 2,
  fill: 2.2,
  bold: 2.6,
};

const createUnifiedIcon = (name) => {
  const IconComponent = resolveLucideIcon(name) || Lu.Shapes || Lu.Circle;

  const Wrapped = forwardRef(function UnifiedIcon(
    {
      color = "currentColor",
      secondaryColor,
      size,
      className,
      weight = "regular",
      style,
      strokeWidth,
      ...props
    },
    ref
  ) {
    void secondaryColor;
    const mergedClassName = className ? `${className} align-middle` : "align-middle";
    const resolvedStrokeWidth =
      strokeWidth ?? WEIGHT_TO_STROKE[String(weight).toLowerCase()] ?? 2;

    return (
      <IconComponent
        ref={ref}
        size={size}
        strokeWidth={resolvedStrokeWidth}
        color={color}
        className={mergedClassName}
        style={style}
        {...props}
      />
    );
  });

  Wrapped.displayName = `${name}UnifiedIcon`;
  return Wrapped;
};

export const Activity = createUnifiedIcon("Activity");
export const AiOutlineBank = createUnifiedIcon("AiOutlineBank");
export const AlertCircle = createUnifiedIcon("AlertCircle");
export const AlertTriangle = createUnifiedIcon("AlertTriangle");
export const Archive = createUnifiedIcon("Archive");
export const ArchiveIcon = createUnifiedIcon("ArchiveIcon");
export const ArchiveRestore = createUnifiedIcon("ArchiveRestore");
export const ArrowDown = createUnifiedIcon("ArrowDown");
export const ArrowLeft = createUnifiedIcon("ArrowLeft");
export const ArrowLeftRight = createUnifiedIcon("ArrowLeftRight");
export const ArrowRight = createUnifiedIcon("ArrowRight");
export const ArrowUp = createUnifiedIcon("ArrowUp");
export const ArrowUpDown = createUnifiedIcon("ArrowUpDown");
export const Award = createUnifiedIcon("Award");
export const BadgeCheck = createUnifiedIcon("BadgeCheck");
export const BadgePercent = createUnifiedIcon("BadgePercent");
export const Banknote = createUnifiedIcon("Banknote");
export const BarChart3 = createUnifiedIcon("BarChart3");
export const Bell = createUnifiedIcon("Bell");
export const BellRinging = createUnifiedIcon("BellRinging");
export const BiCurrentLocation = createUnifiedIcon("BiCurrentLocation");
export const BiLink = createUnifiedIcon("BiLink");
export const BiLogoFacebook = createUnifiedIcon("BiLogoFacebook");
export const BiLogoWhatsapp = createUnifiedIcon("BiLogoWhatsapp");
export const BiMapPin = createUnifiedIcon("BiMapPin");
export const BiPhoneCall = createUnifiedIcon("BiPhoneCall");
export const Bold = createUnifiedIcon("Bold");
export const Bookmark = createUnifiedIcon("Bookmark");
export const Briefcase = createUnifiedIcon("Briefcase");
export const BsTag = createUnifiedIcon("BsTag");
export const BsTextParagraph = createUnifiedIcon("BsTextParagraph");
export const BsTwitterX = createUnifiedIcon("BsTwitterX");
export const Building2 = createUnifiedIcon("Building2");
export const Calendar = createUnifiedIcon("Calendar");
export const CalendarCheck = createUnifiedIcon("CalendarCheck");
export const CalendarClock = createUnifiedIcon("CalendarClock");
export const CalendarDays = createUnifiedIcon("CalendarDays");
export const Camera = createUnifiedIcon("Camera");
export const Check = createUnifiedIcon("Check");
export const CheckCheck = createUnifiedIcon("CheckCheck");
export const CheckCircle = createUnifiedIcon("CheckCircle");
export const CheckCircle2 = createUnifiedIcon("CheckCircle2");
export const CheckSquare = createUnifiedIcon("CheckSquare");
export const ChevronDown = createUnifiedIcon("ChevronDown");
export const ChevronLeft = createUnifiedIcon("ChevronLeft");
export const ChevronRight = createUnifiedIcon("ChevronRight");
export const ChevronUp = createUnifiedIcon("ChevronUp");
export const ChevronsUpDown = createUnifiedIcon("ChevronsUpDown");
export const CiGrid2H = createUnifiedIcon("CiGrid2H");
export const CiLink = createUnifiedIcon("CiLink");
export const Circle = createUnifiedIcon("Circle");
export const Clock = createUnifiedIcon("Clock");
export const Clock3 = createUnifiedIcon("Clock3");
export const Copy = createUnifiedIcon("Copy");
export const CornerDownRight = createUnifiedIcon("CornerDownRight");
export const CreditCard = createUnifiedIcon("CreditCard");
export const Crown = createUnifiedIcon("Crown");
export const Dice5 = createUnifiedIcon("Dice5");
export const DollarSign = createUnifiedIcon("DollarSign");
export const Download = createUnifiedIcon("Download");
export const Edit = createUnifiedIcon("Edit");
export const ExternalLink = createUnifiedIcon("ExternalLink");
export const Eye = createUnifiedIcon("Eye");
export const EyeOff = createUnifiedIcon("EyeOff");
export const FaAndroid = createUnifiedIcon("FaAndroid");
export const FaAngleRight = createUnifiedIcon("FaAngleRight");
export const FaApple = createUnifiedIcon("FaApple");
export const FaArrowLeft = createUnifiedIcon("FaArrowLeft");
export const FaArrowRight = createUnifiedIcon("FaArrowRight");
export const FaCheck = createUnifiedIcon("FaCheck");
export const FaChevronDown = createUnifiedIcon("FaChevronDown");
export const FaChevronUp = createUnifiedIcon("FaChevronUp");
export const FaEye = createUnifiedIcon("FaEye");
export const FaFacebook = createUnifiedIcon("FaFacebook");
export const FaInstagram = createUnifiedIcon("FaInstagram");
export const FaLinkedin = createUnifiedIcon("FaLinkedin");
export const FaLocationCrosshairs = createUnifiedIcon("FaLocationCrosshairs");
export const FaMicrophone = createUnifiedIcon("FaMicrophone");
export const FaPinterest = createUnifiedIcon("FaPinterest");
export const FaRegCalendarCheck = createUnifiedIcon("FaRegCalendarCheck");
export const FaRegEye = createUnifiedIcon("FaRegEye");
export const FaRegEyeSlash = createUnifiedIcon("FaRegEyeSlash");
export const FaRegStopCircle = createUnifiedIcon("FaRegStopCircle");
export const FaSquareXTwitter = createUnifiedIcon("FaSquareXTwitter");
export const FaTelegram = createUnifiedIcon("FaTelegram");
export const FaViber = createUnifiedIcon("FaViber");
export const FaWhatsapp = createUnifiedIcon("FaWhatsapp");
export const Facebook = createUnifiedIcon("Facebook");
export const FcGoogle = createUnifiedIcon("FcGoogle");
export const FiMaximize2 = createUnifiedIcon("FiMaximize2");
export const FiMinimize2 = createUnifiedIcon("FiMinimize2");
export const FiPercent = createUnifiedIcon("FiPercent");
export const Filter = createUnifiedIcon("Filter");
export const Flame = createUnifiedIcon("Flame");
export const Gem = createUnifiedIcon("Gem");
export const GiHamburgerMenu = createUnifiedIcon("GiHamburgerMenu");
export const GitCompare = createUnifiedIcon("GitCompare");
export const Globe = createUnifiedIcon("Globe");
export const GoReport = createUnifiedIcon("GoReport");
export const GrLocation = createUnifiedIcon("GrLocation");
export const Grid3X3 = createUnifiedIcon("Grid3X3");
export const Grid3x3 = createUnifiedIcon("Grid3x3");
export const GripVertical = createUnifiedIcon("GripVertical");
export const Handshake = createUnifiedIcon("Handshake");
export const Hash = createUnifiedIcon("Hash");
export const Heart = createUnifiedIcon("Heart");
export const Headset = createUnifiedIcon("Headset");
export const HiEye = createUnifiedIcon("HiEye");
export const HiOutlineArchive = createUnifiedIcon("HiOutlineArchive");
export const HiOutlineDotsVertical = createUnifiedIcon("HiOutlineDotsVertical");
export const HiOutlineExclamationCircle = createUnifiedIcon("HiOutlineExclamationCircle");
export const HiOutlineExternalLink = createUnifiedIcon("HiOutlineExternalLink");
export const HiOutlineInboxIn = createUnifiedIcon("HiOutlineInboxIn");
export const HiOutlinePhotograph = createUnifiedIcon("HiOutlinePhotograph");
export const HiOutlineSearch = createUnifiedIcon("HiOutlineSearch");
export const HiOutlineSortDescending = createUnifiedIcon("HiOutlineSortDescending");
export const HiOutlineTrash = createUnifiedIcon("HiOutlineTrash");
export const HiOutlineUpload = createUnifiedIcon("HiOutlineUpload");
export const HiOutlineVolumeOff = createUnifiedIcon("HiOutlineVolumeOff");
export const HiOutlineVolumeUp = createUnifiedIcon("HiOutlineVolumeUp");
export const HiPhone = createUnifiedIcon("HiPhone");
export const HiX = createUnifiedIcon("HiX");
export const History = createUnifiedIcon("History");
export const Home = createUnifiedIcon("Home");
export const IconArrowDown = createUnifiedIcon("IconArrowDown");
export const IconArrowUp = createUnifiedIcon("IconArrowUp");
export const IconArrowsSort = createUnifiedIcon("IconArrowsSort");
export const IconBell = createUnifiedIcon("IconBell");
export const IconBookmark = createUnifiedIcon("IconBookmark");
export const IconBookmarkFilled = createUnifiedIcon("IconBookmarkFilled");
export const IconBriefcase = createUnifiedIcon("IconBriefcase");
export const IconBroadcast = createUnifiedIcon("IconBroadcast");
export const IconCalendarExclamation = createUnifiedIcon("IconCalendarExclamation");
export const IconCheck = createUnifiedIcon("IconCheck");
export const IconChevronDown = createUnifiedIcon("IconChevronDown");
export const IconChevronRight = createUnifiedIcon("IconChevronRight");
export const IconCircleCheck = createUnifiedIcon("IconCircleCheck");
export const IconCirclePlus = createUnifiedIcon("IconCirclePlus");
export const IconClock = createUnifiedIcon("IconClock");
export const IconClockHour4 = createUnifiedIcon("IconClockHour4");
export const IconCrown = createUnifiedIcon("IconCrown");
export const IconCurrencyDollar = createUnifiedIcon("IconCurrencyDollar");
export const IconDots = createUnifiedIcon("IconDots");
export const IconEdit = createUnifiedIcon("IconEdit");
export const IconExternalLink = createUnifiedIcon("IconExternalLink");
export const IconEyeOff = createUnifiedIcon("IconEyeOff");
export const IconFileText = createUnifiedIcon("IconFileText");
export const IconFlame = createUnifiedIcon("IconFlame");
export const IconFolder = createUnifiedIcon("IconFolder");
export const IconHeart = createUnifiedIcon("IconHeart");
export const IconHome = createUnifiedIcon("IconHome");
export const IconLayoutGrid = createUnifiedIcon("IconLayoutGrid");
export const IconListDetails = createUnifiedIcon("IconListDetails");
export const IconLivePhoto = createUnifiedIcon("IconLivePhoto");
export const IconLoader2 = createUnifiedIcon("IconLoader2");
export const IconLockSquareRounded = createUnifiedIcon("IconLockSquareRounded");
export const IconLogout = createUnifiedIcon("IconLogout");
export const IconMapPin = createUnifiedIcon("IconMapPin");
export const IconMessage = createUnifiedIcon("IconMessage");
export const IconMessageCircle = createUnifiedIcon("IconMessageCircle");
export const IconMoon = createUnifiedIcon("IconMoon");
export const IconPencil = createUnifiedIcon("IconPencil");
export const IconRocket = createUnifiedIcon("IconRocket");
export const IconRosetteDiscount = createUnifiedIcon("IconRosetteDiscount");
export const IconSearch = createUnifiedIcon("IconSearch");
export const IconSettings = createUnifiedIcon("IconSettings");
export const IconSparkles = createUnifiedIcon("IconSparkles");
export const IconStar = createUnifiedIcon("IconStar");
export const IconStarFilled = createUnifiedIcon("IconStarFilled");
export const IconSun = createUnifiedIcon("IconSun");
export const IconTrash = createUnifiedIcon("IconTrash");
export const IconUser = createUnifiedIcon("IconUser");
export const IconUserCircle = createUnifiedIcon("IconUserCircle");
export const IconWorld = createUnifiedIcon("IconWorld");
export const IconX = createUnifiedIcon("IconX");
export const Image = createUnifiedIcon("Image");
export const ImageIcon = createUnifiedIcon("ImageIcon");
export const Images = createUnifiedIcon("Images");
export const IdentificationCard = createUnifiedIcon("IdentificationCard");
export const Inbox = createUnifiedIcon("Inbox");
export const Info = createUnifiedIcon("Info");
export const Instagram = createUnifiedIcon("Instagram");
export const IoAddCircleOutline = createUnifiedIcon("IoAddCircleOutline");
export const IoAlertCircleOutline = createUnifiedIcon("IoAlertCircleOutline");
export const IoArrowBack = createUnifiedIcon("IoArrowBack");
export const IoBagHandleOutline = createUnifiedIcon("IoBagHandleOutline");
export const IoBookmarkOutline = createUnifiedIcon("IoBookmarkOutline");
export const IoCalendarOutline = createUnifiedIcon("IoCalendarOutline");
export const IoCallOutline = createUnifiedIcon("IoCallOutline");
export const IoCardOutline = createUnifiedIcon("IoCardOutline");
export const IoChatbubbleEllipsesOutline = createUnifiedIcon("IoChatbubbleEllipsesOutline");
export const IoChatbubbleOutline = createUnifiedIcon("IoChatbubbleOutline");
export const IoCheckmarkCircle = createUnifiedIcon("IoCheckmarkCircle");
export const IoCheckmarkCircleOutline = createUnifiedIcon("IoCheckmarkCircleOutline");
export const IoChevronBack = createUnifiedIcon("IoChevronBack");
export const IoChevronDown = createUnifiedIcon("IoChevronDown");
export const IoChevronForward = createUnifiedIcon("IoChevronForward");
export const IoChevronUp = createUnifiedIcon("IoChevronUp");
export const IoClose = createUnifiedIcon("IoClose");
export const IoCloseCircle = createUnifiedIcon("IoCloseCircle");
export const IoCloseCircleOutline = createUnifiedIcon("IoCloseCircleOutline");
export const IoCloseOutline = createUnifiedIcon("IoCloseOutline");
export const IoCopyOutline = createUnifiedIcon("IoCopyOutline");
export const IoCreateOutline = createUnifiedIcon("IoCreateOutline");
export const IoDesktopOutline = createUnifiedIcon("IoDesktopOutline");
export const IoEyeOutline = createUnifiedIcon("IoEyeOutline");
export const IoFilterOutline = createUnifiedIcon("IoFilterOutline");
export const IoFlashOutline = createUnifiedIcon("IoFlashOutline");
export const IoGrid = createUnifiedIcon("IoGrid");
export const IoHeartOutline = createUnifiedIcon("IoHeartOutline");
export const IoHelpCircleOutline = createUnifiedIcon("IoHelpCircleOutline");
export const IoImageOutline = createUnifiedIcon("IoImageOutline");
export const IoInformationCircleOutline = createUnifiedIcon("IoInformationCircleOutline");
export const IoIosAddCircleOutline = createUnifiedIcon("IoIosAddCircleOutline");
export const IoIosArrowUp = createUnifiedIcon("IoIosArrowUp");
export const IoLayersOutline = createUnifiedIcon("IoLayersOutline");
export const IoLocationOutline = createUnifiedIcon("IoLocationOutline");
export const IoLockClosed = createUnifiedIcon("IoLockClosed");
export const IoLogOutOutline = createUnifiedIcon("IoLogOutOutline");
export const IoLogoFacebook = createUnifiedIcon("IoLogoFacebook");
export const IoLogoInstagram = createUnifiedIcon("IoLogoInstagram");
export const IoLogoWhatsapp = createUnifiedIcon("IoLogoWhatsapp");
export const IoMdAttach = createUnifiedIcon("IoMdAttach");
export const IoMdClose = createUnifiedIcon("IoMdClose");
export const IoMdSend = createUnifiedIcon("IoMdSend");
export const IoMenuOutline = createUnifiedIcon("IoMenuOutline");
export const IoNotificationsOutline = createUnifiedIcon("IoNotificationsOutline");
export const IoOptionsOutline = createUnifiedIcon("IoOptionsOutline");
export const IoPersonOutline = createUnifiedIcon("IoPersonOutline");
export const IoPhonePortraitOutline = createUnifiedIcon("IoPhonePortraitOutline");
export const IoPrintOutline = createUnifiedIcon("IoPrintOutline");
export const IoReceiptOutline = createUnifiedIcon("IoReceiptOutline");
export const IoRefreshOutline = createUnifiedIcon("IoRefreshOutline");
export const IoRibbonOutline = createUnifiedIcon("IoRibbonOutline");
export const IoRocketOutline = createUnifiedIcon("IoRocketOutline");
export const IoSearch = createUnifiedIcon("IoSearch");
export const IoSearchOutline = createUnifiedIcon("IoSearchOutline");
export const IoSendOutline = createUnifiedIcon("IoSendOutline");
export const IoShareSocialOutline = createUnifiedIcon("IoShareSocialOutline");
export const IoShieldCheckmarkOutline = createUnifiedIcon("IoShieldCheckmarkOutline");
export const IoSparkles = createUnifiedIcon("IoSparkles");
export const IoSparklesOutline = createUnifiedIcon("IoSparklesOutline");
export const IoStarOutline = createUnifiedIcon("IoStarOutline");
export const IoStatsChart = createUnifiedIcon("IoStatsChart");
export const IoStatsChartOutline = createUnifiedIcon("IoStatsChartOutline");
export const IoStorefrontOutline = createUnifiedIcon("IoStorefrontOutline");
export const IoSwapHorizontalOutline = createUnifiedIcon("IoSwapHorizontalOutline");
export const IoTabletPortraitOutline = createUnifiedIcon("IoTabletPortraitOutline");
export const IoTimeOutline = createUnifiedIcon("IoTimeOutline");
export const IoTrashOutline = createUnifiedIcon("IoTrashOutline");
export const IoTrendingDown = createUnifiedIcon("IoTrendingDown");
export const IoTrendingDownOutline = createUnifiedIcon("IoTrendingDownOutline");
export const IoTrendingUp = createUnifiedIcon("IoTrendingUp");
export const IoTrendingUpOutline = createUnifiedIcon("IoTrendingUpOutline");
export const IoTrophyOutline = createUnifiedIcon("IoTrophyOutline");
export const IoVideocamOutline = createUnifiedIcon("IoVideocamOutline");
export const Italic = createUnifiedIcon("Italic");
export const Layers = createUnifiedIcon("Layers");
export const Layers3 = createUnifiedIcon("Layers3");
export const LayoutGrid = createUnifiedIcon("LayoutGrid");
export const LayoutList = createUnifiedIcon("LayoutList");
export const LiaUserEditSolid = createUnifiedIcon("LiaUserEditSolid");
export const Link = createUnifiedIcon("Link");
export const Link2 = createUnifiedIcon("Link2");
export const List = createUnifiedIcon("List");
export const ListChecks = createUnifiedIcon("ListChecks");
export const ListOrdered = createUnifiedIcon("ListOrdered");
export const Loader2 = createUnifiedIcon("Loader2");
export const LogOut = createUnifiedIcon("LogOut");
export const Mail = createUnifiedIcon("Mail");
export const MailOpen = createUnifiedIcon("MailOpen");
export const Map = createUnifiedIcon("Map");
export const MapPin = createUnifiedIcon("MapPin");
export const MdAccessTime = createUnifiedIcon("MdAccessTime");
export const MdAdd = createUnifiedIcon("MdAdd");
export const MdArrowBack = createUnifiedIcon("MdArrowBack");
export const MdArrowForward = createUnifiedIcon("MdArrowForward");
export const MdAttachMoney = createUnifiedIcon("MdAttachMoney");
export const MdAutorenew = createUnifiedIcon("MdAutorenew");
export const MdCalendarToday = createUnifiedIcon("MdCalendarToday");
export const MdCameraAlt = createUnifiedIcon("MdCameraAlt");
export const MdChat = createUnifiedIcon("MdChat");
export const MdCheck = createUnifiedIcon("MdCheck");
export const MdCheckCircle = createUnifiedIcon("MdCheckCircle");
export const MdChevronLeft = createUnifiedIcon("MdChevronLeft");
export const MdChevronRight = createUnifiedIcon("MdChevronRight");
export const MdClose = createUnifiedIcon("MdClose");
export const MdCloudUpload = createUnifiedIcon("MdCloudUpload");
export const MdDelete = createUnifiedIcon("MdDelete");
export const MdDescription = createUnifiedIcon("MdDescription");
export const MdDirections = createUnifiedIcon("MdDirections");
export const MdDownload = createUnifiedIcon("MdDownload");
export const MdEdit = createUnifiedIcon("MdEdit");
export const MdEditLocation = createUnifiedIcon("MdEditLocation");
export const MdExpandLess = createUnifiedIcon("MdExpandLess");
export const MdExpandMore = createUnifiedIcon("MdExpandMore");
export const MdFavorite = createUnifiedIcon("MdFavorite");
export const MdFavoriteBorder = createUnifiedIcon("MdFavoriteBorder");
export const MdFilterList = createUnifiedIcon("MdFilterList");
export const MdFlag = createUnifiedIcon("MdFlag");
export const MdHistory = createUnifiedIcon("MdHistory");
export const MdInfo = createUnifiedIcon("MdInfo");
export const MdInfoOutline = createUnifiedIcon("MdInfoOutline");
export const MdInventory = createUnifiedIcon("MdInventory");
export const MdKeyboardArrowUp = createUnifiedIcon("MdKeyboardArrowUp");
export const MdList = createUnifiedIcon("MdList");
export const MdLocalOffer = createUnifiedIcon("MdLocalOffer");
export const MdLocationOn = createUnifiedIcon("MdLocationOn");
export const MdLock = createUnifiedIcon("MdLock");
export const MdLockOpen = createUnifiedIcon("MdLockOpen");
export const MdLockOutline = createUnifiedIcon("MdLockOutline");
export const MdMap = createUnifiedIcon("MdMap");
export const MdMoreVert = createUnifiedIcon("MdMoreVert");
export const MdNotificationsNone = createUnifiedIcon("MdNotificationsNone");
export const MdOpenInNew = createUnifiedIcon("MdOpenInNew");
export const MdOutlineAttachFile = createUnifiedIcon("MdOutlineAttachFile");
export const MdOutlineEmail = createUnifiedIcon("MdOutlineEmail");
export const MdOutlineKeyboardArrowRight = createUnifiedIcon("MdOutlineKeyboardArrowRight");
export const MdOutlineLocalPhone = createUnifiedIcon("MdOutlineLocalPhone");
export const MdOutlineLocationOn = createUnifiedIcon("MdOutlineLocationOn");
export const MdOutlinePerson = createUnifiedIcon("MdOutlinePerson");
export const MdOutlineTitle = createUnifiedIcon("MdOutlineTitle");
export const MdPause = createUnifiedIcon("MdPause");
export const MdPauseCircle = createUnifiedIcon("MdPauseCircle");
export const MdPhone = createUnifiedIcon("MdPhone");
export const MdPhoneIphone = createUnifiedIcon("MdPhoneIphone");
export const MdPlayArrow = createUnifiedIcon("MdPlayArrow");
export const MdQuestionAnswer = createUnifiedIcon("MdQuestionAnswer");
export const MdReceipt = createUnifiedIcon("MdReceipt");
export const MdRefresh = createUnifiedIcon("MdRefresh");
export const MdRemove = createUnifiedIcon("MdRemove");
export const MdRocketLaunch = createUnifiedIcon("MdRocketLaunch");
export const MdSell = createUnifiedIcon("MdSell");
export const MdSend = createUnifiedIcon("MdSend");
export const MdSettings = createUnifiedIcon("MdSettings");
export const MdShare = createUnifiedIcon("MdShare");
export const MdShoppingBag = createUnifiedIcon("MdShoppingBag");
export const MdShuffle = createUnifiedIcon("MdShuffle");
export const MdSpeed = createUnifiedIcon("MdSpeed");
export const MdStar = createUnifiedIcon("MdStar");
export const MdStorefront = createUnifiedIcon("MdStorefront");
export const MdSyncAlt = createUnifiedIcon("MdSyncAlt");
export const MdTag = createUnifiedIcon("MdTag");
export const MdThumbUp = createUnifiedIcon("MdThumbUp");
export const MdThumbUpOffAlt = createUnifiedIcon("MdThumbUpOffAlt");
export const MdTouchApp = createUnifiedIcon("MdTouchApp");
export const MdTrendingDown = createUnifiedIcon("MdTrendingDown");
export const MdTrendingUp = createUnifiedIcon("MdTrendingUp");
export const MdVerified = createUnifiedIcon("MdVerified");
export const MdVerifiedUser = createUnifiedIcon("MdVerifiedUser");
export const MdVisibility = createUnifiedIcon("MdVisibility");
export const MdVolumeOff = createUnifiedIcon("MdVolumeOff");
export const MdVolumeUp = createUnifiedIcon("MdVolumeUp");
export const MdWarning = createUnifiedIcon("MdWarning");
export const Medal = createUnifiedIcon("Medal");
export const Menu = createUnifiedIcon("Menu");
export const MessageCircle = createUnifiedIcon("MessageCircle");
export const MessageSquare = createUnifiedIcon("MessageSquare");
export const MessageSquareMore = createUnifiedIcon("MessageSquareMore");
export const MessagesSquare = createUnifiedIcon("MessagesSquare");
export const Minus = createUnifiedIcon("Minus");
export const MinusCircle = createUnifiedIcon("MinusCircle");
export const MoreHorizontal = createUnifiedIcon("MoreHorizontal");
export const MoreVertical = createUnifiedIcon("MoreVertical");
export const MousePointerClick = createUnifiedIcon("MousePointerClick");
export const Music = createUnifiedIcon("Music");
export const Music2 = createUnifiedIcon("Music2");
export const Navigation = createUnifiedIcon("Navigation");
export const Package = createUnifiedIcon("Package");
export const Pause = createUnifiedIcon("Pause");
export const Percent = createUnifiedIcon("Percent");
export const Phone = createUnifiedIcon("Phone");
export const PiWarningOctagon = createUnifiedIcon("PiWarningOctagon");
export const Pin = createUnifiedIcon("Pin");
export const PinOff = createUnifiedIcon("PinOff");
export const Plane = createUnifiedIcon("Plane");
export const Play = createUnifiedIcon("Play");
export const PlayCircle = createUnifiedIcon("PlayCircle");
export const Plus = createUnifiedIcon("Plus");
export const PlusCircle = createUnifiedIcon("PlusCircle");
export const QrCode = createUnifiedIcon("QrCode");
export const Radar = createUnifiedIcon("Radar");
export const Receipt = createUnifiedIcon("Receipt");
export const RefreshCcw = createUnifiedIcon("RefreshCcw");
export const RefreshCw = createUnifiedIcon("RefreshCw");
export const RiArrowLeftLine = createUnifiedIcon("RiArrowLeftLine");
export const RiArrowRightLine = createUnifiedIcon("RiArrowRightLine");
export const RiFullscreenLine = createUnifiedIcon("RiFullscreenLine");
export const RiMailSendFill = createUnifiedIcon("RiMailSendFill");
export const RiMailSendLine = createUnifiedIcon("RiMailSendLine");
export const RiPlayCircleFill = createUnifiedIcon("RiPlayCircleFill");
export const RiTwitterXLine = createUnifiedIcon("RiTwitterXLine");
export const RiUserForbidLine = createUnifiedIcon("RiUserForbidLine");
export const RiVideoLine = createUnifiedIcon("RiVideoLine");
export const RiZoomInLine = createUnifiedIcon("RiZoomInLine");
export const RiZoomOutLine = createUnifiedIcon("RiZoomOutLine");
export const Rocket = createUnifiedIcon("Rocket");
export const RotateCcw = createUnifiedIcon("RotateCcw");
export const Save = createUnifiedIcon("Save");
export const Search = createUnifiedIcon("Search");
export const SearchX = createUnifiedIcon("SearchX");
export const Send = createUnifiedIcon("Send");
export const Settings = createUnifiedIcon("Settings");
export const Settings2 = createUnifiedIcon("Settings2");
export const Share2 = createUnifiedIcon("Share2");
export const Shield = createUnifiedIcon("Shield");
export const ShieldCheck = createUnifiedIcon("ShieldCheck");
export const ShoppingBag = createUnifiedIcon("ShoppingBag");
export const SlLocationPin = createUnifiedIcon("SlLocationPin");
export const SlidersHorizontal = createUnifiedIcon("SlidersHorizontal");
export const Smile = createUnifiedIcon("Smile");
export const Sparkles = createUnifiedIcon("Sparkles");
export const Square = createUnifiedIcon("Square");
export const Star = createUnifiedIcon("Star");
export const Store = createUnifiedIcon("Store");
export const Tag = createUnifiedIcon("Tag");
export const Target = createUnifiedIcon("Target");
export const TbPhoneCall = createUnifiedIcon("TbPhoneCall");
export const TbTransferVertical = createUnifiedIcon("TbTransferVertical");
export const Trash2 = createUnifiedIcon("Trash2");
export const TrendingDown = createUnifiedIcon("TrendingDown");
export const TrendingUp = createUnifiedIcon("TrendingUp");
export const Trophy = createUnifiedIcon("Trophy");
export const Truck = createUnifiedIcon("Truck");
export const Type = createUnifiedIcon("Type");
export const Upload = createUnifiedIcon("Upload");
export const UploadCloud = createUnifiedIcon("UploadCloud");
export const User = createUnifiedIcon("User");
export const UserList = createUnifiedIcon("UserList");
export const UserRound = createUnifiedIcon("UserRound");
export const Users = createUnifiedIcon("Users");
export const Video = createUnifiedIcon("Video");
export const Volume2 = createUnifiedIcon("Volume2");
export const VolumeX = createUnifiedIcon("VolumeX");
export const Wallet = createUnifiedIcon("Wallet");
export const Waypoints = createUnifiedIcon("Waypoints");
export const Wifi = createUnifiedIcon("Wifi");
export const X = createUnifiedIcon("X");
export const XCircle = createUnifiedIcon("XCircle");
export const Youtube = createUnifiedIcon("Youtube");
export const Zap = createUnifiedIcon("Zap");
