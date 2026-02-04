"use client";

import React from "react";
import AvatarMaker from "@/components/Avatar/LmxAvatarGenerator";

const AvatarPage = () => {
  const handleAvatarUpdated = (data) => {
    // Ovdje možeš osvježiti user state u Reduxu ako je potrebno
    // npr. dispatch(updateUserAvatar(data.image_url));
    console.log("Avatar updated:", data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Kreiraj svoj novi izgled</h1>
        <p className="text-gray-500 mt-2">Dizajniraj jedinstven avatar koji će se prikazivati na tvom profilu.</p>
      </div>

      {/* Glavna Komponenta */}
      <AvatarMaker onSaveSuccess={handleAvatarUpdated} />
    </div>
  );
};

export default AvatarPage;