import dynamic from "next/dynamic";
import PageLoadingShell from "@/components/Common/PageLoadingShell";

const AdsListing = dynamic(
  () => import("@/components/PagesComponent/AdsListing/AdsListing"),
  {
    loading: () => <PageLoadingShell title="Učitavanje forme za objavu oglasa" />,
  },
);
const AdListingPage = () => {
  return <AdsListing />;
};
export default AdListingPage;
