"use client";

import Layout from "@/components/Layout/Layout";
import { MapPin } from "lucide-react";

export default function MapSearchPage() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Pretraga na mapi</h1>
          <p className="text-slate-500 text-sm">
            Ova funkcionalnost je u razvoju. Uskoro ćete moći pretraživati oglase na interaktivnoj mapi.
          </p>
        </div>
      </div>
    </Layout>
  );
}