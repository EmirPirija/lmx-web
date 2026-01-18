"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { gamificationApi } from "@/utils/api";
import {
  setLeaderboard,
  setLeaderboardLoading,
  setLeaderboardError,
  setLeaderboardFilter,
} from "@/redux/reducer/gamificationSlice";
import LeaderboardCard from "@/components/PagesComponent/Gamification/LeaderboardCard";
import { t, updateMetadata } from "@/utils";
import { toast } from "sonner";

const LeaderboardPage = () => {
  const dispatch = useDispatch();
  const { leaderboard, loading } = useSelector((state) => state.Gamification.leaderboard);
  const currentFilter = useSelector((state) => state.Gamification.leaderboard.filter);
  const [page, setPage] = useState(1);

  useEffect(() => {
    updateMetadata({
      title: `${t("leaderboard")} - LMX`,
      description: t("leaderboardDescription"),
    });
  }, []);

  useEffect(() => {
    fetchLeaderboard(currentFilter, page);
  }, [currentFilter, page]);

  const fetchLeaderboard = async (period, pageNum) => {
    dispatch(setLeaderboardLoading(true));
    try {
      const response = await gamificationApi.getLeaderboard({
        period,
        page: pageNum,
      });

      if (response.data.error) {
        toast.error(response.data.message);
        dispatch(setLeaderboardError(response.data.message));
      } else {
        dispatch(setLeaderboard(response.data.data));
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      dispatch(setLeaderboardError(error.message));
      toast.error(t("errorFetchingLeaderboard"));
    }
  };

  const handleFilterChange = (newFilter) => {
    dispatch(setLeaderboardFilter(newFilter));
    setPage(1);
  };

  const filters = [
    { value: "weekly", label: t("weekly") },
    { value: "monthly", label: t("monthly") },
    { value: "all-time", label: t("allTime") },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          🏆 {t("leaderboard")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t("topUsersOnPlatform")}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={`px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              currentFilter === filter.value
                ? "bg-purple-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-20 rounded-lg" />
          ))}
        </div>
      ) : leaderboard?.users && leaderboard.users.length > 0 ? (
        <div className="space-y-3">
          {leaderboard.users.map((user, index) => (
            <LeaderboardCard
              key={user.id}
              user={user}
              rank={(page - 1) * (leaderboard.per_page || 20) + index + 1}
            />
          ))}

          {/* Pagination */}
          {leaderboard.total > leaderboard.per_page && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                {t("previous")}
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {page} / {Math.ceil(leaderboard.total / leaderboard.per_page)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(leaderboard.total / leaderboard.per_page)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {t("noDataAvailable")}
          </p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
