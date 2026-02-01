"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Award,
  Crown,
  Medal,
  Target,
  Zap,
  TrendingUp,
  Users,
  ChevronRight,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  Gift,
  Shield,
  Heart,
  MessageSquare,
  Eye,
  ShoppingBag,
  Camera,
  Verified,
  Flame,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  Info,
  X,
} from "lucide-react";
import { gamificationApi } from "@/utils/api";
import {
  setUserBadges,
  setUserBadgesLoading,
  setUserPoints,
  setUserPointsLoading,
  setLeaderboard,
  setLeaderboardLoading,
  setLeaderboardFilter,
  setAllBadges,
  setAllBadgesLoading,
  setPointsHistory,
  setPointsHistoryLoading,
} from "@/redux/reducer/gamificationSlice";

// ============================================
// BADGE ICON MAPPING
// ============================================
const BADGE_ICONS = {
  first_ad: ShoppingBag,
  verified_seller: Verified,
  top_seller: Crown,
  trusted_seller: Shield,
  quick_responder: Zap,
  power_seller: Flame,
  community_helper: Heart,
  active_chatter: MessageSquare,
  profile_complete: CheckCircle2,
  photo_pro: Camera,
  popular_seller: Eye,
  loyal_member: Calendar,
  review_master: Star,
  super_host: Trophy,
  deal_maker: Target,
  early_adopter: Gift,
  default: Award,
};

const getBadgeIcon = (badgeKey) => {
  return BADGE_ICONS[badgeKey] || BADGE_ICONS.default;
};

// ============================================
// BADGE RARITY COLORS
// ============================================
const RARITY_COLORS = {
  common: {
    bg: "bg-slate-100",
    border: "border-slate-300",
    text: "text-slate-600",
    glow: "",
    label: "Uobičajen",
  },
  uncommon: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-600",
    glow: "",
    label: "Neobičan",
  },
  rare: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    text: "text-blue-600",
    glow: "shadow-blue-200",
    label: "Rijedak",
  },
  epic: {
    bg: "bg-purple-50",
    border: "border-purple-400",
    text: "text-purple-600",
    glow: "shadow-purple-200",
    label: "Epski",
  },
  legendary: {
    bg: "bg-gradient-to-br from-amber-50 to-yellow-100",
    border: "border-amber-400",
    text: "text-amber-600",
    glow: "shadow-amber-300 shadow-lg",
    label: "Legendarni",
  },
};

const getRarityStyle = (rarity) => {
  return RARITY_COLORS[rarity] || RARITY_COLORS.common;
};

// ============================================
// MOCK DATA (fallback when API unavailable)
// ============================================
const MOCK_USER_BADGES = {
  badges: [
    {
      id: 1,
      key: "first_ad",
      name: "Prvi oglas",
      description: "Objavio si svoj prvi oglas",
      rarity: "common",
      earned_at: "2024-01-15T10:30:00Z",
      points: 50,
    },
    {
      id: 2,
      key: "verified_seller",
      name: "Verifikovan prodavač",
      description: "Profil je verifikovan",
      rarity: "uncommon",
      earned_at: "2024-02-20T14:00:00Z",
      points: 100,
    },
    {
      id: 3,
      key: "quick_responder",
      name: "Brzi odgovor",
      description: "Prosječno vrijeme odgovora ispod 1 sata",
      rarity: "rare",
      earned_at: "2024-03-10T09:15:00Z",
      points: 150,
    },
  ],
};

const MOCK_USER_POINTS = {
  total_points: 1250,
  level: 5,
  level_name: "Iskusni trgovac",
  points_to_next_level: 250,
  next_level_threshold: 1500,
};

const MOCK_LEADERBOARD = {
  users: [
    { rank: 1, user_id: 101, name: "Marko T.", points: 5420, avatar: null, change: 0 },
    { rank: 2, user_id: 102, name: "Ana S.", points: 4890, avatar: null, change: 1 },
    { rank: 3, user_id: 103, name: "Ivan P.", points: 4350, avatar: null, change: -1 },
    { rank: 4, user_id: 104, name: "Maja K.", points: 3920, avatar: null, change: 2 },
    { rank: 5, user_id: 105, name: "Petar M.", points: 3510, avatar: null, change: 0 },
  ],
  current_user: { rank: 12, points: 1250, change: 3 },
};

const MOCK_ALL_BADGES = {
  badges: [
    { id: 1, key: "first_ad", name: "Prvi oglas", description: "Objavi svoj prvi oglas", rarity: "common", points: 50, requirement: "1 oglas" },
    { id: 2, key: "verified_seller", name: "Verifikovan prodavač", description: "Verifikuj svoj profil", rarity: "uncommon", points: 100, requirement: "Verifikacija" },
    { id: 3, key: "quick_responder", name: "Brzi odgovor", description: "Održi prosječno vrijeme odgovora ispod 1 sata", rarity: "rare", points: 150, requirement: "< 1h odgovor" },
    { id: 4, key: "top_seller", name: "Top prodavač", description: "Ostvari 50+ uspješnih prodaja", rarity: "epic", points: 500, requirement: "50 prodaja" },
    { id: 5, key: "power_seller", name: "Power Seller", description: "Ostvari 100+ uspješnih prodaja", rarity: "legendary", points: 1000, requirement: "100 prodaja" },
    { id: 6, key: "trusted_seller", name: "Povjerljiv prodavač", description: "Dobij 20+ pozitivnih recenzija sa 5 zvjezdica", rarity: "rare", points: 200, requirement: "20x 5★" },
    { id: 7, key: "community_helper", name: "Pomoćnik zajednice", description: "Pomogni 10 korisnika kroz chat", rarity: "uncommon", points: 100, requirement: "10 pomoći" },
    { id: 8, key: "active_chatter", name: "Aktivan u chatu", description: "Pošalji 100+ poruka", rarity: "common", points: 50, requirement: "100 poruka" },
    { id: 9, key: "profile_complete", name: "Kompletan profil", description: "Popuni sve informacije profila", rarity: "common", points: 75, requirement: "100% profil" },
    { id: 10, key: "photo_pro", name: "Foto profesionalac", description: "Objavi oglas sa 5+ kvalitetnih fotografija", rarity: "uncommon", points: 100, requirement: "5+ slika" },
    { id: 11, key: "popular_seller", name: "Popularni prodavač", description: "Ostvari 1000+ pregleda na oglasima", rarity: "rare", points: 150, requirement: "1000 pregleda" },
    { id: 12, key: "loyal_member", name: "Lojalni član", description: "Budi aktivan član 1+ godinu", rarity: "epic", points: 300, requirement: "1 godina" },
  ],
};

const MOCK_POINTS_HISTORY = {
  history: [
    { id: 1, action: "Objavljen oglas", points: 10, created_at: "2024-03-15T10:30:00Z" },
    { id: 2, action: "Primljena recenzija (5★)", points: 25, created_at: "2024-03-14T16:45:00Z" },
    { id: 3, action: "Brzi odgovor", points: 5, created_at: "2024-03-14T09:20:00Z" },
    { id: 4, action: "Uspješna prodaja", points: 50, created_at: "2024-03-13T14:00:00Z" },
    { id: 5, action: "Dnevna prijava", points: 5, created_at: "2024-03-13T08:00:00Z" },
  ],
};

// ============================================
// LEVEL CONFIGURATION
// ============================================
const LEVELS = [
  { level: 1, name: "Početnik", threshold: 0 },
  { level: 2, name: "Učenik", threshold: 100 },
  { level: 3, name: "Pomoćnik", threshold: 300 },
  { level: 4, name: "Trgovac", threshold: 600 },
  { level: 5, name: "Iskusni trgovac", threshold: 1000 },
  { level: 6, name: "Stručnjak", threshold: 1500 },
  { level: 7, name: "Majstor", threshold: 2500 },
  { level: 8, name: "Ekspert", threshold: 4000 },
  { level: 9, name: "Guru", threshold: 6000 },
  { level: 10, name: "Legenda", threshold: 10000 },
];

const getLevelInfo = (points) => {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].threshold) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }

  const pointsInLevel = points - currentLevel.threshold;
  const pointsNeeded = nextLevel ? nextLevel.threshold - currentLevel.threshold : 0;
  const progress = nextLevel ? (pointsInLevel / pointsNeeded) * 100 : 100;

  return {
    ...currentLevel,
    nextLevel,
    pointsInLevel,
    pointsNeeded,
    progress: Math.min(progress, 100),
  };
};

// ============================================
// SUB-COMPONENTS
// ============================================

function PointsDisplay({ points, levelInfo, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white animate-pulse">
        <div className="h-8 w-32 bg-white/20 rounded mb-4" />
        <div className="h-12 w-48 bg-white/20 rounded mb-4" />
        <div className="h-4 w-full bg-white/20 rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <span className="text-sm font-medium opacity-90">Tvoji bodovi</span>
          </div>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
            <Star className="w-4 h-4" />
            <span className="text-sm font-semibold">Nivo {levelInfo.level}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-4xl font-bold mb-1">
            {points?.toLocaleString("bs-BA") || 0}
          </div>
          <div className="text-sm opacity-90">{levelInfo.name}</div>
        </div>

        {levelInfo.nextLevel && (
          <div>
            <div className="flex justify-between text-xs mb-2 opacity-90">
              <span>Napredak do nivoa {levelInfo.nextLevel.level}</span>
              <span>
                {levelInfo.pointsInLevel} / {levelInfo.pointsNeeded}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white rounded-full"
              />
            </div>
            <div className="text-xs mt-2 opacity-75">
              Još {levelInfo.pointsNeeded - levelInfo.pointsInLevel} bodova do "{levelInfo.nextLevel.name}"
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BadgeCard({ badge, earned = false, onClick }) {
  const Icon = getBadgeIcon(badge.key);
  const rarityStyle = getRarityStyle(badge.rarity);

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick?.(badge)}
      className={`
        relative p-4 rounded-xl border-2 text-left transition-all w-full
        ${rarityStyle.bg} ${rarityStyle.border}
        ${earned ? rarityStyle.glow : "opacity-60 grayscale"}
        ${earned ? "cursor-pointer" : "cursor-default"}
      `}
    >
      {!earned && (
        <div className="absolute inset-0 bg-slate-900/10 rounded-xl flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-500" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${earned ? rarityStyle.text : "text-slate-400"} bg-white/50`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm truncate ${earned ? "text-slate-800" : "text-slate-500"}`}>
              {badge.name}
            </h4>
            {earned && <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />}
          </div>
          <p className={`text-xs line-clamp-2 ${earned ? "text-slate-600" : "text-slate-400"}`}>
            {badge.description}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${rarityStyle.bg} ${rarityStyle.text} border ${rarityStyle.border}`}>
              {rarityStyle.label}
            </span>
            <span className="text-xs text-slate-500">+{badge.points} bodova</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function BadgeDetailModal({ badge, isOpen, onClose, earned }) {
  const Icon = getBadgeIcon(badge?.key);
  const rarityStyle = getRarityStyle(badge?.rarity);

  if (!isOpen || !badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-sm w-full p-6 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>

          <div className="text-center">
            <div className={`
              inline-flex p-4 rounded-2xl mb-4
              ${rarityStyle.bg} ${rarityStyle.border} border-2 ${rarityStyle.glow}
              ${!earned && "opacity-50 grayscale"}
            `}>
              <Icon className={`w-12 h-12 ${rarityStyle.text}`} />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">{badge.name}</h3>
            <p className="text-slate-600 mb-4">{badge.description}</p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm ${rarityStyle.bg} ${rarityStyle.text} border ${rarityStyle.border}`}>
                {rarityStyle.label}
              </span>
              <span className="px-3 py-1 rounded-full text-sm bg-amber-50 text-amber-600 border border-amber-200">
                +{badge.points} bodova
              </span>
            </div>

            {badge.requirement && (
              <div className="bg-slate-50 rounded-xl p-4 text-sm">
                <div className="text-slate-500 mb-1">Potrebno za otključavanje:</div>
                <div className="font-medium text-slate-700">{badge.requirement}</div>
              </div>
            )}

            {earned && badge.earned_at && (
              <div className="mt-4 text-sm text-slate-500">
                <Clock className="w-4 h-4 inline-block mr-1" />
                Osvojeno: {new Date(badge.earned_at).toLocaleDateString("bs-BA")}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function LeaderboardItem({ user, isCurrentUser }) {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center font-semibold text-slate-500">{rank}</span>;
  };

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl transition-all
      ${isCurrentUser ? "bg-indigo-50 border-2 border-indigo-200" : "hover:bg-slate-50"}
    `}>
      <div className="w-8 flex justify-center">
        {getRankIcon(user.rank)}
      </div>

      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-medium">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          user.name?.charAt(0) || "?"
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isCurrentUser ? "text-indigo-700" : "text-slate-800"}`}>
          {user.name} {isCurrentUser && "(Ti)"}
        </div>
        <div className="text-sm text-slate-500">
          {user.points?.toLocaleString("bs-BA")} bodova
        </div>
      </div>

      <div className="flex items-center gap-1">
        {getChangeIcon(user.change)}
        {user.change !== 0 && (
          <span className={`text-xs ${user.change > 0 ? "text-green-500" : "text-red-500"}`}>
            {Math.abs(user.change)}
          </span>
        )}
      </div>
    </div>
  );
}

function PointsHistoryItem({ item }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <Zap className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-800">{item.action}</div>
          <div className="text-xs text-slate-500">
            {new Date(item.created_at).toLocaleDateString("bs-BA", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
      <div className="text-sm font-semibold text-green-600">+{item.points}</div>
    </div>
  );
}

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
        ${active ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-100"}
      `}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
        ${active ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}
      `}
    >
      {children}
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function UserBadges() {
  const dispatch = useDispatch();
  const { data: userData } = useSelector((state) => state.UserSignUp);
  
  // Redux state
  const { data: badgesData, loading: badgesLoading } = useSelector(
    (state) => state.Gamification.userBadges
  );
  const { data: pointsData, loading: pointsLoading } = useSelector(
    (state) => state.Gamification.userPoints
  );
  const { data: leaderboardData, loading: leaderboardLoading, filter: leaderboardFilter } = useSelector(
    (state) => state.Gamification.leaderboard
  );
  const { data: allBadgesData, loading: allBadgesLoading } = useSelector(
    (state) => state.Gamification.allBadges
  );
  const { data: pointsHistoryData, loading: pointsHistoryLoading } = useSelector(
    (state) => state.Gamification.pointsHistory
  );

  // Local state
  const [activeTab, setActiveTab] = useState("badges");
  const [badgeFilter, setBadgeFilter] = useState("all"); // all, earned, locked
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Computed values
  const userBadges = badgesData?.badges || MOCK_USER_BADGES.badges;
  const userPoints = pointsData?.total_points || MOCK_USER_POINTS.total_points;
  const allBadges = allBadgesData?.badges || MOCK_ALL_BADGES.badges;
  const leaderboard = leaderboardData?.users || MOCK_LEADERBOARD.users;
  const currentUserRank = leaderboardData?.current_user || MOCK_LEADERBOARD.current_user;
  const pointsHistory = pointsHistoryData?.history || MOCK_POINTS_HISTORY.history;

  const earnedBadgeIds = useMemo(() => {
    return new Set(userBadges.map((b) => b.id));
  }, [userBadges]);

  const levelInfo = useMemo(() => getLevelInfo(userPoints), [userPoints]);

  const filteredBadges = useMemo(() => {
    if (badgeFilter === "earned") {
      return allBadges.filter((b) => earnedBadgeIds.has(b.id));
    }
    if (badgeFilter === "locked") {
      return allBadges.filter((b) => !earnedBadgeIds.has(b.id));
    }
    return allBadges;
  }, [allBadges, earnedBadgeIds, badgeFilter]);

  // Fetch data
  const fetchAllData = useCallback(async () => {
    try {
      dispatch(setUserBadgesLoading(true));
      dispatch(setUserPointsLoading(true));
      dispatch(setLeaderboardLoading(true));
      dispatch(setAllBadgesLoading(true));
      dispatch(setPointsHistoryLoading(true));

      const [badgesRes, pointsRes, leaderboardRes, allBadgesRes, historyRes] = await Promise.allSettled([
        gamificationApi.getUserBadges(),
        gamificationApi.getUserPoints(),
        gamificationApi.getLeaderboard({ period: leaderboardFilter }),
        gamificationApi.getAllBadges(),
        gamificationApi.getPointsHistory(),
      ]);

      if (badgesRes.status === "fulfilled" && badgesRes.value.data?.data) {
        dispatch(setUserBadges(badgesRes.value.data.data));
      }
      if (pointsRes.status === "fulfilled" && pointsRes.value.data?.data) {
        dispatch(setUserPoints(pointsRes.value.data.data));
      }
      if (leaderboardRes.status === "fulfilled" && leaderboardRes.value.data?.data) {
        dispatch(setLeaderboard(leaderboardRes.value.data.data));
      }
      if (allBadgesRes.status === "fulfilled" && allBadgesRes.value.data?.data) {
        dispatch(setAllBadges(allBadgesRes.value.data.data));
      }
      if (historyRes.status === "fulfilled" && historyRes.value.data?.data) {
        dispatch(setPointsHistory(historyRes.value.data.data));
      }
    } catch (error) {
      console.error("Error fetching gamification data:", error);
    }
  }, [dispatch, leaderboardFilter]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleLeaderboardFilterChange = async (period) => {
    dispatch(setLeaderboardFilter(period));
    dispatch(setLeaderboardLoading(true));
    try {
      const res = await gamificationApi.getLeaderboard({ period });
      if (res.data?.data) {
        dispatch(setLeaderboard(res.data.data));
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    setIsModalOpen(true);
  };

  const isLoading = badgesLoading || pointsLoading;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Dostignuća</h1>
              <p className="text-sm text-slate-500">Tvoji bedževi i napredak</p>
            </div>
            <button
              onClick={fetchAllData}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              disabled={isLoading}
            >
              <RefreshCw className={`w-5 h-5 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <TabButton active={activeTab === "badges"} onClick={() => setActiveTab("badges")} icon={Award}>
              Bedževi
            </TabButton>
            <TabButton active={activeTab === "leaderboard"} onClick={() => setActiveTab("leaderboard")} icon={Trophy}>
              Rang lista
            </TabButton>
            <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")} icon={Clock}>
              Historija
            </TabButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Points Card - Always visible */}
        <div className="mb-6">
          <PointsDisplay points={userPoints} levelInfo={levelInfo} loading={pointsLoading} />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-2xl font-bold text-slate-800">{userBadges.length}</div>
                  <div className="text-xs text-slate-500">Osvojeno</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-2xl font-bold text-slate-800">{allBadges.length - userBadges.length}</div>
                  <div className="text-xs text-slate-500">Zaključano</div>
                </div>
                <div className="bg-white rounded-xl p-4 text-center border border-slate-200">
                  <div className="text-2xl font-bold text-slate-800">{allBadges.length}</div>
                  <div className="text-xs text-slate-500">Ukupno</div>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2 mb-4">
                <FilterButton active={badgeFilter === "all"} onClick={() => setBadgeFilter("all")}>
                  Svi ({allBadges.length})
                </FilterButton>
                <FilterButton active={badgeFilter === "earned"} onClick={() => setBadgeFilter("earned")}>
                  Osvojeni ({userBadges.length})
                </FilterButton>
                <FilterButton active={badgeFilter === "locked"} onClick={() => setBadgeFilter("locked")}>
                  Zaključani ({allBadges.length - userBadges.length})
                </FilterButton>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allBadgesLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                          <div className="h-3 w-full bg-slate-200 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  filteredBadges.map((badge) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      earned={earnedBadgeIds.has(badge.id)}
                      onClick={handleBadgeClick}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Period Filter */}
              <div className="flex gap-2 mb-4">
                <FilterButton
                  active={leaderboardFilter === "weekly"}
                  onClick={() => handleLeaderboardFilterChange("weekly")}
                >
                  Sedmično
                </FilterButton>
                <FilterButton
                  active={leaderboardFilter === "monthly"}
                  onClick={() => handleLeaderboardFilterChange("monthly")}
                >
                  Mjesečno
                </FilterButton>
                <FilterButton
                  active={leaderboardFilter === "all-time"}
                  onClick={() => handleLeaderboardFilterChange("all-time")}
                >
                  Svo vrijeme
                </FilterButton>
              </div>

              {/* Your Rank Card */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 text-white mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-1">Tvoja pozicija</div>
                    <div className="text-3xl font-bold">#{currentUserRank.rank}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm opacity-90 mb-1">Bodovi</div>
                    <div className="text-xl font-semibold">{currentUserRank.points?.toLocaleString("bs-BA")}</div>
                  </div>
                  {currentUserRank.change !== 0 && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${currentUserRank.change > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                      {currentUserRank.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      <span className="text-sm">{Math.abs(currentUserRank.change)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Leaderboard List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {leaderboardLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-slate-200 rounded-full" />
                        <div className="w-10 h-10 bg-slate-200 rounded-full" />
                        <div className="flex-1">
                          <div className="h-4 w-24 bg-slate-200 rounded mb-1" />
                          <div className="h-3 w-16 bg-slate-200 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {leaderboard.map((user) => (
                      <LeaderboardItem
                        key={user.user_id}
                        user={user}
                        isCurrentUser={user.user_id === userData?.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Posljednje aktivnosti
                </h3>

                {pointsHistoryLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                        <div className="flex-1">
                          <div className="h-4 w-32 bg-slate-200 rounded mb-1" />
                          <div className="h-3 w-20 bg-slate-200 rounded" />
                        </div>
                        <div className="h-4 w-12 bg-slate-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : pointsHistory.length > 0 ? (
                  <div>
                    {pointsHistory.map((item) => (
                      <PointsHistoryItem key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Nema aktivnosti za prikaz</p>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Kako zaraditi bodove?</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Objavi oglas (+10 bodova)</li>
                      <li>• Primi pozitivnu recenziju (+25 bodova)</li>
                      <li>• Uspješna prodaja (+50 bodova)</li>
                      <li>• Brzi odgovor na poruke (+5 bodova)</li>
                      <li>• Dnevna prijava (+5 bodova)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Badge Detail Modal */}
      <BadgeDetailModal
        badge={selectedBadge}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        earned={selectedBadge ? earnedBadgeIds.has(selectedBadge.id) : false}
      />
    </div>
  );
}
