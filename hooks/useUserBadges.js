"use client";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { gamificationApi } from "@/utils/api";
import {
  setUserBadges,
  setUserBadgesLoading,
  setUserBadgesError,
  setUserPoints,
  setUserPointsLoading,
} from "@/redux/reducer/gamificationSlice";

export const useUserBadges = () => {
  const dispatch = useDispatch();
  const { data: badges, loading, error } = useSelector(
    (state) => state.Gamification.userBadges
  );
  const { data: points } = useSelector((state) => state.Gamification.userPoints);

  useEffect(() => {
    if (!badges && !loading) {
      fetchBadges();
    }
  }, []);

  const fetchBadges = async () => {
    dispatch(setUserBadgesLoading(true));
    dispatch(setUserPointsLoading(true));

    try {
      const [badgesRes, pointsRes] = await Promise.all([
        gamificationApi.getUserBadges(),
        gamificationApi.getUserPoints(),
      ]);

      if (!badgesRes.data.error) {
        dispatch(setUserBadges(badgesRes.data.data));
      }

      if (!pointsRes.data.error) {
        dispatch(setUserPoints(pointsRes.data.data));
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      dispatch(setUserBadgesError(error.message));
    }
  };

  const refetch = () => {
    fetchBadges();
  };

  return {
    badges: badges?.badges || [],
    points,
    loading,
    error,
    refetch,
  };
};
