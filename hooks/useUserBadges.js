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

      // Provjeri da li API vraća podatke, ako ne - koristi mock
      const badgesData = badgesRes.data?.data?.badges?.length > 0 
        ? badgesRes.data.data 
        : MOCK_USER_BADGES;
      
      const pointsData = pointsRes.data?.data?.total_points !== undefined
        ? pointsRes.data.data
        : MOCK_USER_POINTS;

      dispatch(setUserBadges(badgesData));
      dispatch(setUserPoints(pointsData));
      
    } catch (error) {
      console.error("Error fetching badges, using mock data:", error);
      // Koristi mock podatke kada API ne radi
      dispatch(setUserBadgesError(null)); // Ne prikazuj error ako imamo fallback
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
