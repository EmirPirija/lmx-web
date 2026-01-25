"use client";

import { useEffect } from "react";
import Layout from "@/components/Layout/Layout";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb";
import ProfileNavigation from "@/components/Profile/ProfileNavigation";
import SavedSearches from "./SavedSearches";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { useSelector } from "react-redux";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice.js";
import { useNavigate } from "@/components/Common/useNavigate";
import { setBreadcrumbPath } from "@/redux/reducer/breadCrumbSlice";

const breadcrumbPath = [
  { label: "Profil", href: "/profile" },
  { label: "Spašene pretrage", href: "/profile/saved-searches" },
];

export default function SavedSearchesPage() {
  const isLoggedIn = useSelector(getIsLoggedIn);
  const { navigate } = useNavigate();

  useEffect(() => {
    setBreadcrumbPath(breadcrumbPath);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      navigate("/");
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;

  return (
    <Layout currentPageId="saved-searches" parentPage="profile">
      <BreadCrumb ParentPage="Profil" ChildPage="Spašene pretrage" />
      <ProfileNavigation />
      <SavedSearches />
    </Layout>
  );
}
