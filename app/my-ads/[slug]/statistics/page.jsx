"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowBack, IoRefreshOutline } from "@/components/Common/UnifiedIconPack";
import ItemStatisticsDashboard from "@/components/PagesComponent/MyAds/ItemStatisticsDashboard";
import Layout from "@/components/Layout/Layout";


import Api from "@/api/AxiosInterceptors";

const fetchItemBySlug = async (slug) => {
  try {
    const res = await Api.get(`/get-item`, {
      params: { slug },
      // headers ti ne trebaju, interceptor već dodaje token + Content-Language
    });

    // prilagodi prema tvojoj strukturi odgovora:
    return res.data?.data?.data?.[0] || null;
  } catch (error) {
    console.error("Error fetching item:", error?.response?.data || error);
    return null;
  }
};


export default function Page() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        setError("Oglas nije pronađen.");
        setLoading(false);
        return;
      }

      const itemData = await fetchItemBySlug(slug);

      if (itemData) setItem(itemData);
      else setError("Oglas nije pronađen ili nemate pristup.");

      setLoading(false);
    };

    load();
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-50">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500">Učitavanje...</p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className=" bg-slate-50">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-2xl p-8 text-center">
              <h1 className="text-xl font-bold text-slate-800 mb-2">Greška</h1>
              <p className="text-slate-500 mb-6">{error || "Oglas nije pronađen"}</p>
              <Link
                href="/my-ads"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <IoArrowBack size={18} />
                Nazad na moje oglase
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <IoArrowBack size={20} className="text-slate-600" />
                </button>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-slate-800 truncate max-w-md">
                    {item.name}
                  </h1>
                  <p className="text-xs text-slate-500">Statistika oglasa</p>
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Osvježi"
              >
                <IoRefreshOutline size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="sm:hidden bg-white px-4 py-3 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-800 truncate">{item.name}</h1>
          <p className="text-xs text-slate-500">Statistika oglasa</p>
        </div>

        <div className="container mx-auto px-4 py-6">
          <ItemStatisticsDashboard itemId={item.id} itemName={item.name} />
        </div>

        <div className="h-20 lg:h-0" />
      </div>
    </Layout>
  );
}
