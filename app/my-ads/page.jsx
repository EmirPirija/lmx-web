import dynamic from "next/dynamic";

const ProfileDashboard = dynamic(
  () => import("@/components/PagesComponent/ProfileDashboard/ProfileDashboard"),
  {
    loading: () => (
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 dark:border-slate-700 dark:bg-slate-800/60" />
      </div>
    ),
  },
);

const MyAdsPage = () => {
  return <ProfileDashboard />;
};
export default MyAdsPage;
