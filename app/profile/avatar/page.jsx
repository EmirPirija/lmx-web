"use client";

import React from "react";
import { motion } from "framer-motion";
import AvatarMaker from "@/components/Avatar/LmxAvatarGenerator";
import ProfileLayout from "@/components/Profile/ProfileLayout";

import { Sparkles, Palette, Wand2 } from "lucide-react";

const AvatarPage = () => {
  const handleAvatarUpdated = (data) => {
    console.log("Avatar updated:", data);
  };

  return (
    <ProfileLayout title="Moj Avatar" subtitle="Kreiraj jedinstven avatar za svoj profil">
      <div className="space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 rounded-[2rem] p-8 text-white shadow-2xl"
        >
          <div className="absolute inset-0 bg-[url('/assets/pattern.svg')] opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <Palette size={40} />
              </div>
              <div>
                <h1 className="text-3xl font-black">Kreiraj svoj novi izgled</h1>
                <p className="text-white/80 mt-2 max-w-lg">
                  Dizajniraj jedinstven avatar koji će se prikazivati na tvom profilu i u razgovorima sa drugim korisnicima.
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Sparkles size={24} />
                <span className="font-semibold">Jedinstven stil</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Wand2 size={24} />
                <span className="font-semibold">Lako korištenje</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                <Palette size={24} />
                <span className="font-semibold">Mnogo opcija</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avatar Maker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-200/50 dark:border-slate-700/50 p-6 md:p-8"
        >
          <AvatarMaker onSaveSuccess={handleAvatarUpdated} />
        </motion.div>
      </div>
    </ProfileLayout>
  );
};

export default AvatarPage;
