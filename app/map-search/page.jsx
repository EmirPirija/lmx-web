// app/map-search/page.jsx
// Next.js 13+ App Router

import MapSearchPage from "@/components/MapSearchPage";

export const metadata = {
  title: "Pretraga na mapi | Oglasi",
  description: "Pronađite oglase na interaktivnoj mapi - nekretnine, automobili i više",
  keywords: "mapa, oglasi, nekretnine, pretraga, lokacija",
};

export default function MapSearchPageRoute() {
  return <MapSearchPage />;
}


// ============================================
// ALTERNATIVE: Pages Router (app/pages/map-search.jsx)
// ============================================

/*
import MapSearchPage from "@/components/MapSearchPage";
import Head from "next/head";

export default function MapSearch() {
  return (
    <>
      <Head>
        <title>Pretraga na mapi | Oglasi</title>
        <meta 
          name="description" 
          content="Pronađite oglase na interaktivnoj mapi" 
        />
      </Head>
      <MapSearchPage />
    </>
  );
}
*/


// ============================================
// LAYOUT sa sidebar-om (optional)
// ============================================

/*
// app/map-search/layout.jsx

export default function MapSearchLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
*/