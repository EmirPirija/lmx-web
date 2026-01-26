"use client";

import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import SellerDashboard from "@/components/Profile/SellerDashboard";
import SellerAreaTabs from "@/components/Profile/SellerAreaTabs";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setBreadcrumbPath } from "@/redux/reducer/breadCrumbSlice";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { useRouter } from "next/navigation";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";

export default function SellerDashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const isLoggedIn = useSelector(getIsLoggedIn);

  useEffect(() => {
    dispatch(
      setBreadcrumbPath([
        { name: "Profil", slug: "/profile" },
        { name: "Prodaja", slug: "/profile/seller" },
      ])
    );
  }, [dispatch]);

  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      router.push("/");
    }
  }, [isLoggedIn, router, dispatch]);

  if (!isLoggedIn) return null;

  return (
    <Layout>
      <BreadCrumb title2="Prodaja" />
      <div className="container py-6 lg:py-10">
        <SellerAreaTabs />
        <SellerDashboard />
      </div>
    </Layout>
  );
}
