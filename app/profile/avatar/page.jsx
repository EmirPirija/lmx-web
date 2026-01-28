"use client";

import React from "react";
import AvatarMaker from "@/components/Avatar/LmxAvatarGenerator";
import BreadCrumb from "@/components/BreadCrumb/BreadCrumb"; // Tvoja breadcrumb komponenta
import Layout from "@/components/Layout/Layout"; // Tvoj layout

const AvatarPage = () => {

  const handleAvatarUpdated = (data) => {
    // Ovdje možeš osvježiti user state u Reduxu ako je potrebno
    // npr. dispatch(updateUserAvatar(data.image_url));
    console.log("Avatar updated:", data);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <BreadCrumb title="Moj Avatar" />
        
        <div className="mt-6 mb-10 text-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Kreiraj svoj novi izgled</h1>
            <p className="text-gray-500 mt-2">Dizajniraj jedinstven avatar koji će se prikazivati na tvom profilu.</p>
        </div>

        {/* Glavna Komponenta */}
        <AvatarMaker onSaveSuccess={handleAvatarUpdated} />
        
      </div>
    </Layout>
  );
};

export default AvatarPage;