"use client";

import { formatDateMonthYear, t } from "@/utils";
import { useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getNotificationList } from "@/utils/api";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import Pagination from "@/components/Common/Pagination";
import NoData from "@/components/EmptyStates/NoData";
import NotificationSkeleton from "./NotificationSkeleton";
import CustomImage from "@/components/Common/CustomImage";
import { userSignUpData } from "@/redux/reducer/authSlice";
import { useNavigate } from "@/components/Common/useNavigate";
import { cn } from "@/lib/utils";

import {
  Bell,
  Package,
  MessageSquare,
  Star,
  Heart,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
} from "@/components/Common/UnifiedIconPack";

// ============================================
// COMPONENTS
// ============================================

function NotificationCard({ notification, onClick }) {
  const getNotificationIcon = (type) => {
    const icons = {
      message: MessageSquare,
      order: Package,
      review: Star,
      like: Heart,
      alert: AlertCircle,
      success: CheckCircle,
    };
    return icons[type] || Bell;
  };

  const getIconColor = (type) => {
    const colors = {
      message: "from-green-500 to-emerald-600",
      order: "from-blue-500 to-indigo-600",
      review: "from-amber-500 to-orange-600",
      like: "from-pink-500 to-rose-600",
      alert: "from-red-500 to-rose-600",
      success: "from-emerald-500 to-green-600",
    };
    return colors[type] || "from-slate-500 to-slate-600";
  };

  const Icon = getNotificationIcon(notification.type);
  const iconColor = getIconColor(notification.type);
  const isClickable = Boolean(notification?.item?.slug);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isClickable ? { scale: 1.01, x: 4 } : {}}
      onClick={isClickable ? onClick : undefined}
      className={cn(
        "group flex items-start gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 transition-all duration-300",
        isClickable 
          ? "cursor-pointer border-slate-200 dark:border-slate-700 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5" 
          : "border-slate-200 dark:border-slate-700"
      )}
    >
      {/* Icon or Image */}
      <div className="shrink-0">
        {notification?.image ? (
          <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
            <CustomImage
              src={notification.image}
              width={56}
              height={56}
              alt="notification"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg", iconColor)}>
            <Icon size={24} className="text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">
              {notification.title}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {notification.message}
            </p>
          </div>
          
          {isClickable && (
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
              <ChevronRight size={16} />
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 mt-3">
          <Clock size={14} className="text-slate-400" />
          <span className="text-xs text-slate-400">
            {formatDateMonthYear(notification.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

const Notifications = () => {
  const CurrentLanguage = useSelector(CurrentLanguageData);
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const userData = useSelector(userSignUpData);
  const { navigate } = useNavigate();

  const fetchNotificationData = useCallback(async (page) => {
    try {
      setIsLoading(true);
      const response = await getNotificationList.getNotification({ page });
      if (response?.data?.error === false) {
        setNotifications(response?.data.data.data);
        setTotalPages(response?.data?.data?.last_page);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationData(currentPage);
  }, [currentPage, fetchNotificationData]);

  useEffect(() => {
    const handleRealtimeRefresh = (event) => {
      const detail = event?.detail;
      if (!detail) return;
      if (detail?.category === "notification" || detail?.category === "system") {
        fetchNotificationData(currentPage);
      }
    };

    window.addEventListener("lmx:realtime-event", handleRealtimeRefresh);
    return () => window.removeEventListener("lmx:realtime-event", handleRealtimeRefresh);
  }, [currentPage, fetchNotificationData]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleNotificationClick = (notification) => {
    if (notification?.item?.slug) {
      const currentUserId = userData?.id;
      const notificationUserId = notification?.item?.user_id;

      if (currentUserId == notificationUserId) {
        navigate(`/my-listing/${notification.item.slug}`);
      } else {
        navigate(`/ad-details/${notification.item.slug}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start gap-4 p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <div className="w-14 h-14 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return <NoData name={t("notifications")} />;
  }

  return (
    <div className="space-y-6">
      {/* Notifications List */}
      <div className="space-y-3">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <NotificationCard
              key={notification.id || index}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Notifications;
