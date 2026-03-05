import dynamic from "next/dynamic";
import PageLoadingShell from "@/components/Common/PageLoadingShell";

const MapSearchPage = dynamic(() => import("@/components/MapSearchPage"), {
  loading: () => <PageLoadingShell title="Učitavanje map pretrage" />,
});

export const metadata = {
  title: "Pretraga na mapi | Oglasi",
  description: "Pronađite oglase na interaktivnoj mapi - nekretnine, automobili i više",
  keywords: "mapa, oglasi, nekretnine, pretraga, lokacija",
};

export default function MapSearchPageRoute() {
  return <MapSearchPage />;
}
