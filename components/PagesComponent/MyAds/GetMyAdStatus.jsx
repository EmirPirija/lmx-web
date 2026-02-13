// 📌 components/Common/GetMyAdStatus.jsx
import {
  IconBroadcast,
  IconX,
  IconCalendarExclamation,
  IconCircleCheck,
  IconClockHour4,
  IconLivePhoto,
  IconRocket,
  IconLockSquareRounded,
  IconEyeOff,
} from "@/components/Common/UnifiedIconPack";

const buildBadges = ({ status, isApprovedSort, isFeature, isJobCategory }) => {
  const badges = [];

  // ⭐ FEATURED / ISTAKNUT
  if (isFeature) {
    badges.push({
      key: "featured",
      icon: <IconRocket size={18} stroke={2} className="text-white" />,
      bg: "bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-400",
    });
  }

  // ✅ APPROVED / ACTIVE
  if (status === "approved" || status === "featured") {
    badges.push({
      key: "active",
      icon: isApprovedSort ? (
        <IconBroadcast size={18} stroke={2} className="text-white" />
      ) : (
        <IconLivePhoto size={18} stroke={2} className="text-white" />
      ),
      bg: isApprovedSort ? "bg-primary" : "bg-emerald-600",
    });
  }

  // ⏳ REVIEW
  if (status === "review") {
    badges.push({
      key: "review",
      icon: <IconClockHour4 size={18} stroke={2} className="text-white" />,
      bg: "bg-amber-500",
    });
  }

  // ❌ PERMANENT REJECTED
  if (status === "permanent rejected") {
    badges.push({
      key: "permanent-rejected",
      icon: <IconX size={18} stroke={2} className="text-white" />,
      bg: "bg-red-600",
    });
  }

  // ⚠️ SOFT REJECTED
  if (status === "soft rejected") {
    badges.push({
      key: "soft-rejected",
      icon: <IconX size={18} stroke={2} className="text-white" />,
      bg: "bg-red-500",
    });
  }

  // 💤 INACTIVE
  if (status === "inactive") {
    badges.push({
      key: "inactive",
      icon: <IconEyeOff size={18} stroke={2} className="text-white" />,
      bg: "bg-gray-500",
    });
  }

  // 🔒 SOLD OUT
  if (status === "sold out") {
    badges.push({
      key: "sold-out",
      icon: (
        <IconLockSquareRounded size={18} stroke={2} className="text-white" />
      ),
      bg: "bg-yellow-600",
    });
  }

  // 🟢 RESUBMITTED
  if (status === "resubmitted") {
    badges.push({
      key: "resubmitted",
      icon: (
        <IconCircleCheck size={18} stroke={2} className="text-white" />
      ),
      bg: "bg-green-600",
    });
  }

  // ⏱ EXPIRED
  if (status === "expired") {
    badges.push({
      key: "expired",
      icon: (
        <IconCalendarExclamation size={18} stroke={2} className="text-white" />
      ),
      bg: "bg-gray-700",
    });
  }

  return badges;
};

const GetMyAdStatus = ({
  status,
  isApprovedSort = false,
  isFeature = false,
  isJobCategory = false,
}) => {
  const badges = buildBadges({ status, isApprovedSort, isFeature, isJobCategory });

  if (!status || !badges.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {badges.map((badge) => (
        <div
          key={badge.key}
          className={`flex items-center justify-center ${badge.bg} rounded-md w-[28px] h-[28px] shadow-sm backdrop-blur-sm transition-all duration-150 hover:brightness-110 active:scale-95`}
        >
          {badge.icon}
        </div>
      ))}
    </div>
  );
};

export default GetMyAdStatus;
