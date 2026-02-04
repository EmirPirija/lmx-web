"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocialSharing } from "@/hooks/useSocialsharing";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Share2,
  Copy,
  Check,
  Facebook,
  MessageCircle,
  Send,
  Link as LinkIcon,
  X,
  Loader2,
} from "lucide-react";
import {
  IoLogoWhatsapp,
  IoLogoInstagram,
  IoLogoFacebook,
} from "react-icons/io5";
import { FaTelegram, FaViber } from "react-icons/fa";
import { BsTwitterX } from "react-icons/bs";

// ============================================
// PLATFORM ICONS
// ============================================
const PlatformIcon = ({ platform, size = 20, className }) => {
  const icons = {
    facebook: <IoLogoFacebook size={size} className={className} />,
    instagram: <IoLogoInstagram size={size} className={className} />,
    twitter: <BsTwitterX size={size} className={className} />,
    whatsapp: <IoLogoWhatsapp size={size} className={className} />,
    viber: <FaViber size={size} className={className} />,
    telegram: <FaTelegram size={size} className={className} />,
  };
  return icons[platform] || <Share2 size={size} className={className} />;
};

// ============================================
// SHARE BUTTON (Single Platform)
// ============================================
const ShareButton = ({ platform, label, onClick, isLoading, color }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    disabled={isLoading}
    className={cn(
      "flex items-center gap-3 w-full p-3 rounded-xl transition-all",
      "hover:bg-slate-50 active:bg-slate-100",
      "disabled:opacity-50 disabled:cursor-not-allowed"
    )}
    style={{ "--platform-color": color }}
  >
    <div
      className="p-2 rounded-lg text-white"
      style={{ backgroundColor: color }}
    >
      <PlatformIcon platform={platform} size={18} />
    </div>
    <span className="text-sm font-medium text-slate-700">{label}</span>
    {isLoading && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
  </motion.button>
);

// ============================================
// COPY LINK BUTTON
// ============================================
const CopyLinkButton = ({ onClick, copied }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full p-3 rounded-xl transition-all",
      copied
        ? "bg-green-50 text-green-700"
        : "hover:bg-slate-50 active:bg-slate-100"
    )}
  >
    <div className={cn(
      "p-2 rounded-lg",
      copied ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
    )}>
      {copied ? <Check size={18} /> : <LinkIcon size={18} />}
    </div>
    <span className="text-sm font-medium">
      {copied ? "Link kopiran!" : "Kopiraj link"}
    </span>
  </motion.button>
);

// ============================================
// INLINE SHARE BUTTONS (Horizontal)
// ============================================
export const InlineShareButtons = ({ item, size = "sm", className }) => {
  const { shareToplatform, copyLink, isSharing, platforms } = useSocialSharing();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyLink(item);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const buttonSizes = {
    sm: "p-2",
    md: "p-2.5",
    lg: "p-3",
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const mainPlatforms = ["facebook", "whatsapp", "viber", "telegram"];

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {mainPlatforms.map((platform) => (
        <motion.button
          key={platform}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => shareToplatform(platform, item)}
          disabled={isSharing}
          className={cn(
            buttonSizes[size],
            "rounded-lg text-white transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          style={{ backgroundColor: platforms[platform]?.color }}
          title={platforms[platform]?.name}
        >
          <PlatformIcon platform={platform} size={iconSizes[size]} />
        </motion.button>
      ))}
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopy}
        className={cn(
          buttonSizes[size],
          "rounded-lg transition-all",
          copied
            ? "bg-green-500 text-white"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
        title="Kopiraj link"
      >
        {copied ? (
          <Check size={iconSizes[size]} />
        ) : (
          <LinkIcon size={iconSizes[size]} />
        )}
      </motion.button>
    </div>
  );
};

// ============================================
// SHARE POPOVER (Full Menu)
// ============================================
export const SharePopover = ({ item, trigger, align = "end" }) => {
  const { shareToplatform, copyLink, isSharing, platforms } = useSocialSharing();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    const success = await copyLink(item);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async (platform) => {
    await shareToplatform(platform, item);
    // Don't close popover for Instagram (shows copy message)
    if (platform !== "instagram") {
      setTimeout(() => setOpen(false), 300);
    }
  };

  const platformList = [
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "viber", label: "Viber" },
    { key: "telegram", label: "Telegram" },
    { key: "twitter", label: "Twitter / X" },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1.5" />
            Podijeli
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        align={align} 
        className="w-64 p-2"
        sideOffset={8}
      >
        <div className="space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Podijeli na
          </p>
          
          {platformList.map(({ key, label }) => (
            <ShareButton
              key={key}
              platform={key}
              label={label}
              onClick={() => handleShare(key)}
              isLoading={isSharing}
              color={platforms[key]?.color}
            />
          ))}
          
          <div className="h-px bg-slate-100 my-2" />
          
          <CopyLinkButton onClick={handleCopy} copied={copied} />
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ============================================
// SHARE MODAL (Full Screen on Mobile)
// ============================================
export const ShareModal = ({ item, isOpen, onClose }) => {
  const { shareToplatform, copyLink, isSharing, platforms } = useSocialSharing();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyLink(item);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const platformList = [
    { key: "whatsapp", label: "WhatsApp" },
    { key: "viber", label: "Viber" },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "telegram", label: "Telegram" },
    { key: "twitter", label: "Twitter / X" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-lg font-semibold text-slate-900">Podijeli oglas</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Item Preview */}
            {item && (
              <div className="mx-5 mb-4 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                  {item.price && (
                    <p className="text-sm text-primary font-semibold">
                      {item.price} {item.currency_symbol || "KM"}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Share Options */}
            <div className="px-5 pb-8 space-y-1">
              {platformList.map(({ key, label }) => (
                <ShareButton
                  key={key}
                  platform={key}
                  label={label}
                  onClick={() => shareToplatform(key, item)}
                  isLoading={isSharing}
                  color={platforms[key]?.color}
                />
              ))}
              
              <div className="h-px bg-slate-100 my-3" />
              
              <CopyLinkButton onClick={handleCopy} copied={copied} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================
// DEFAULT EXPORT: SHARE BUTTON WITH AUTO POPOVER/MODAL
// ============================================
const SocialShareButtons = ({ item, variant = "button", className, ...props }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === "inline") {
    return <InlineShareButtons item={item} className={className} {...props} />;
  }

  // Use modal on mobile, popover on desktop
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={className}
        >
          <Share2 className="w-4 h-4 mr-1.5" />
          Podijeli
        </Button>
        <ShareModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }

  return <SharePopover item={item} className={className} {...props} />;
};

export default SocialShareButtons;