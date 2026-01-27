"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Calendar,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  Home,
  Sparkles,
  PartyPopper,
  Clock,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";

// ═══════════════════════════════════════════════════════════════════
// CONFETTI COMPONENT
// ═══════════════════════════════════════════════════════════════════
const Confetti = () => {
  const colors = ["#1A4B8C", "#F7941D", "#00A19B", "#FFD700", "#FF6B6B"];
  const pieces = Array.from({ length: 50 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            opacity: 1,
            y: -20,
            x: Math.random() * 400 - 200,
            rotate: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: 500,
            x: Math.random() * 400 - 200,
            rotate: Math.random() * 720 - 360,
            opacity: 0,
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
          className="absolute top-0 left-1/2"
          style={{
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
          }}
        />
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// SUCCESS ICON WITH ANIMATION
// ═══════════════════════════════════════════════════════════════════
const SuccessIcon = ({ isScheduled }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", duration: 0.6, delay: 0.2 }}
      className="relative"
    >
      {/* Glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0.5, 0.2, 0.5], scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`absolute inset-0 rounded-full blur-xl ${
          isScheduled
            ? "bg-gradient-to-br from-[#F7941D] to-[#1A4B8C]"
            : "bg-gradient-to-br from-[#00A19B] to-[#1A4B8C]"
        }`}
      />
      
      {/* Main icon container */}
      <div
        className={`relative w-28 h-28 rounded-full flex items-center justify-center ${
          isScheduled
            ? "bg-gradient-to-br from-[#F7941D] to-[#1A4B8C]"
            : "bg-gradient-to-br from-[#00A19B] to-[#1A4B8C]"
        }`}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8, delay: 0.4 }}
        >
          {isScheduled ? (
            <Calendar size={48} className="text-white" />
          ) : (
            <CheckCircle2 size={48} className="text-white" />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════
const StatCard = ({ icon: Icon, value, label, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="text-center p-3 bg-gray-50 rounded-xl"
    >
      <div className="flex items-center justify-center gap-1 text-[#1A4B8C] mb-1">
        <Icon size={16} />
        <span className="font-bold text-lg">{value}</span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const AdSuccessModal = ({
  openSuccessModal,
  setOpenSuccessModal,
  createdAdSlug,
  isScheduled = false,
  scheduledDate = null,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (openSuccessModal && !isScheduled) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [openSuccessModal, isScheduled]);

  const closeSuccessModal = () => {
    setOpenSuccessModal(false);
  };

  // Format date for display
  const formatScheduledDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
    const months = ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${dayName}, ${day}. ${month} ${year}. u ${hours}:${minutes}h`;
  };

  const adUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/my-listing/${createdAdSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(adUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Pogledajte moj oglas",
          url: adUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={openSuccessModal} onOpenChange={closeSuccessModal}>
      <DialogContent
        className="!max-w-[480px] p-0 overflow-hidden border-0 rounded-3xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && <Confetti />}
        </AnimatePresence>

        {/* Content */}
        <div className="relative px-8 py-10 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <SuccessIcon isScheduled={isScheduled} />
          </div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            {isScheduled ? "Oglas je zakazan! 📅" : "Oglas je objavljen! 🎉"}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            {isScheduled
              ? "Vaš oglas će biti automatski objavljen:"
              : "Vaš oglas je sada vidljiv svima"}
          </motion.p>

          {/* Scheduled Date Badge */}
          {isScheduled && scheduledDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#F7941D]/10 to-[#1A4B8C]/10 border-2 border-[#F7941D]/30 rounded-xl mb-6"
            >
              <Clock size={18} className="text-[#F7941D]" />
              <span className="font-semibold text-[#1A4B8C]">
                {formatScheduledDate(scheduledDate)}
              </span>
            </motion.div>
          )}

          {/* Stats */}
          {!isScheduled && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <StatCard icon={Eye} value="~500" label="Očekivani pregledi" delay={0.6} />
              <StatCard icon={MessageCircle} value="~15" label="Poruka/sedmica" delay={0.7} />
              <StatCard icon={TrendingUp} value="90%" label="Šansa za prodaju" delay={0.8} />
            </motion.div>
          )}

          {/* Share Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-2 mb-6"
          >
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 size={18} className="text-green-500" />
                  Kopirano!
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Kopiraj link
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
            >
              <Share2 size={18} />
              Podijeli
            </button>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <CustomLink
              href={`/my-listing/${createdAdSlug}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-[#1A4B8C] to-[#00A19B] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
            >
              <ExternalLink size={18} />
              Pregledaj oglas
            </CustomLink>

            <CustomLink
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              <Home size={18} />
              Nazad na početnu
            </CustomLink>
          </motion.div>

          {/* Tips for scheduled */}
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mt-6 p-4 bg-[#00A19B]/10 rounded-xl text-left"
            >
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-[#00A19B] mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#00A19B]">Savjet</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Možete pregledati i urediti oglas prije zakazane objave. Oglas možete pronaći u "Moji oglasi".
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdSuccessModal;