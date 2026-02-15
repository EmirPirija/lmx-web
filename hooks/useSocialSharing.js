"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { instagramApi, socialMediaApi } from "@/utils/api";
import { runSocialOAuthPopup } from "@/utils/socialOAuth";
import {
  SOCIAL_POSTING_TEMP_UNAVAILABLE,
  SOCIAL_POSTING_UNAVAILABLE_MESSAGE,
} from "@/utils/socialAvailability";

/**
 * Social Media Integration Hook
 * Provides functionality for sharing listings to social platforms
 * and future auto-posting capabilities
 */

// ============================================
// SOCIAL PLATFORM CONFIGURATIONS
// ============================================
const SOCIAL_PLATFORMS = {
  facebook: {
    name: "Facebook",
    shareUrl: "https://www.facebook.com/sharer/sharer.php?u=",
    color: "#1877F2",
    icon: "facebook",
  },
  instagram: {
    name: "Instagram",
    // Instagram doesn't have direct web sharing, handled differently
    shareUrl: null,
    color: "#E4405F",
    icon: "instagram",
  },
  twitter: {
    name: "Twitter/X",
    shareUrl: "https://twitter.com/intent/tweet?url=",
    textParam: "&text=",
    color: "#1DA1F2",
    icon: "twitter",
  },
  whatsapp: {
    name: "WhatsApp",
    shareUrl: "https://wa.me/?text=",
    color: "#25D366",
    icon: "whatsapp",
  },
  viber: {
    name: "Viber",
    shareUrl: "viber://forward?text=",
    color: "#7360F2",
    icon: "viber",
  },
  telegram: {
    name: "Telegram",
    shareUrl: "https://t.me/share/url?url=",
    textParam: "&text=",
    color: "#0088CC",
    icon: "telegram",
  },
};

// ============================================
// SHARE MESSAGE GENERATORS
// ============================================
const generateShareMessage = (item, platform) => {
  const { name, price, currency_symbol = "KM" } = item || {};
  const priceText = price ? `${price} ${currency_symbol}` : "";
  
  const messages = {
    facebook: `${name}${priceText ? ` - ${priceText}` : ""}`,
    instagram: `🛍️ ${name}${priceText ? `\n💰 ${priceText}` : ""}\n\n#prodaja #oglasi #lmx`,
    twitter: `${name}${priceText ? ` - ${priceText}` : ""} #prodaja`,
    whatsapp: `Pogledaj ovaj oglas: ${name}${priceText ? ` - ${priceText}` : ""}`,
    viber: `Pogledaj ovaj oglas: ${name}${priceText ? ` - ${priceText}` : ""}`,
    telegram: `${name}${priceText ? ` - ${priceText}` : ""}`,
  };
  
  return messages[platform] || name;
};

// ============================================
// MAIN HOOK
// ============================================
export function useSocialSharing() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  /**
   * Generate item URL for sharing
   */
  const getItemUrl = useCallback((item, baseUrl = null) => {
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const slug = item?.slug || item?.id;
    return `${base}/product-details/${slug}`;
  }, []);

  /**
   * Share to a specific platform
   */
  const shareToplatform = useCallback(async (platform, item) => {
    if (!item) {
      toast.error("Nema podataka za dijeljenje");
      return false;
    }

    setIsSharing(true);
    setShareError(null);

    try {
      const config = SOCIAL_PLATFORMS[platform];
      if (!config) {
        throw new Error(`Nepoznata platforma: ${platform}`);
      }

      const itemUrl = getItemUrl(item);
      const message = generateShareMessage(item, platform);

      // Handle Instagram differently (copy to clipboard)
      if (platform === "instagram") {
        const fullText = `${message}\n\n${itemUrl}`;
        await navigator.clipboard.writeText(fullText);
        toast.success("Tekst kopiran! Zalijepite ga u Instagram post.");
        return true;
      }

      // Handle Viber (mobile only, may not work on desktop)
      if (platform === "viber") {
        const fullText = encodeURIComponent(`${message}\n${itemUrl}`);
        window.open(`${config.shareUrl}${fullText}`, "_blank");
        return true;
      }

      // Regular share URL construction
      let shareUrl = config.shareUrl + encodeURIComponent(itemUrl);
      
      if (config.textParam) {
        shareUrl += config.textParam + encodeURIComponent(message);
      }

      // Open in new window for desktop, or try native share on mobile
      if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: item.name,
            text: message,
            url: itemUrl,
          });
          toast.success("Uspješno podijeljeno!");
          return true;
        } catch (err) {
          if (err.name !== "AbortError") {
            // Fall back to window.open if native share fails
            window.open(shareUrl, "_blank", "width=600,height=400");
          }
        }
      } else {
        window.open(shareUrl, "_blank", "width=600,height=400");
      }

      toast.success(`Otvoreno za dijeljenje na ${config.name}`);
      return true;
    } catch (error) {
      console.error("Share error:", error);
      setShareError(error.message);
      toast.error("Greška pri dijeljenju");
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [getItemUrl]);

  /**
   * Copy item link to clipboard
   */
  const copyLink = useCallback(async (item) => {
    if (!item) return false;

    try {
      const url = getItemUrl(item);
      await navigator.clipboard.writeText(url);
      toast.success("Link kopiran u clipboard");
      return true;
    } catch (error) {
      console.error("Copy error:", error);
      toast.error("Greška pri kopiranju linka");
      return false;
    }
  }, [getItemUrl]);

  /**
   * Generate all share links for an item
   */
  const getShareLinks = useCallback((item) => {
    if (!item) return {};

    const itemUrl = getItemUrl(item);
    const links = {};

    Object.entries(SOCIAL_PLATFORMS).forEach(([key, config]) => {
      if (config.shareUrl) {
        const message = generateShareMessage(item, key);
        let url = config.shareUrl + encodeURIComponent(itemUrl);
        if (config.textParam) {
          url += config.textParam + encodeURIComponent(message);
        }
        links[key] = url;
      }
    });

    return links;
  }, [getItemUrl]);

  /**
   * Available platforms configuration
   */
  const platforms = useMemo(() => SOCIAL_PLATFORMS, []);

  return {
    isSharing,
    shareError,
    shareToplatform,
    copyLink,
    getShareLinks,
    getItemUrl,
    platforms,
  };
}

// ============================================
// AUTO-POST SERVICE (Foundation for Backend Integration)
// ============================================

/**
 * Auto-post configuration
 * This is the foundation for backend integration with Facebook/Instagram APIs
 * Full implementation requires:
 * 1. Facebook App setup with marketing permissions
 * 2. Instagram Business Account linked to Facebook Page
 * 3. Backend endpoints for OAuth flow and post scheduling
 */
export const AutoPostService = {
  /**
   * Check if auto-post is configured for a platform
   */
  isConfigured: async (platform) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) return false;
    try {
      const res = await socialMediaApi.getConnectedAccounts();
      const accounts = res?.data?.data?.accounts || [];
      return accounts.some(
        (row) => row?.platform === platform && Boolean(row?.connected)
      );
    } catch {
      return false;
    }
  },

  /**
   * Schedule auto-post for a new listing
   */
  schedulePost: async ({ item, platforms, scheduledTime }) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      return { success: false, message: SOCIAL_POSTING_UNAVAILABLE_MESSAGE };
    }

    try {
      if (!item?.id) {
        return { success: false, message: "Nedostaje ID oglasa." };
      }

      const payload = {
        item_id: item.id,
        platforms: platforms || [],
        scheduled_at: scheduledTime || undefined,
        caption: `${item?.name || "Lmx oglas"}${item?.description ? `\n\n${item.description}` : ""}`.trim(),
      };

      const res = await socialMediaApi.schedulePost(payload);
      return {
        success: res?.data?.error === false,
        message: res?.data?.message || "Objava je zakazana.",
        data: res?.data?.data,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          "Auto-post nije uspio. Pokušajte ponovo.",
      };
    }
  },

  /**
   * Get connected social accounts for user
   */
  getConnectedAccounts: async () => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) return [];
    try {
      const res = await socialMediaApi.getConnectedAccounts();
      return res?.data?.data?.accounts || [];
    } catch {
      return [];
    }
  },

  /**
   * Connect a social account (initiates OAuth flow)
   */
  connectAccount: async (platform) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return false;
    }

    try {
      const res = await socialMediaApi.connectAccount({ platform, mode: "oauth" });
      const authUrl = res?.data?.data?.auth_url;
      if (!authUrl) {
        toast.error(res?.data?.message || "OAuth link nije dostupan.");
        return false;
      }

      await runSocialOAuthPopup({ platform, authUrl });
      if (res?.data?.error === false) {
        toast.success(`Uspješno povezano: ${platform}`);
        return true;
      }
      toast.error(res?.data?.message || "Povezivanje nije uspjelo.");
      return false;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Povezivanje nije uspjelo.");
      return false;
    }
  },

  /**
   * Disconnect a social account
   */
  disconnectAccount: async (platform) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      toast.info(SOCIAL_POSTING_UNAVAILABLE_MESSAGE);
      return false;
    }

    try {
      const res = await socialMediaApi.disconnectAccount({ platform });
      return res?.data?.error === false;
    } catch {
      return false;
    }
  },
};

// ============================================
// INSTAGRAM SHOP IMPORT SERVICE (Foundation)
// ============================================

/**
 * Instagram Shop Import Service
 * Foundation for importing products from Instagram Shop
 * Full implementation requires Instagram Graph API access
 */
export const InstagramShopService = {
  /**
   * Check if Instagram Shop is connected
   */
  isConnected: async () => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) return false;
    try {
      const accounts = await AutoPostService.getConnectedAccounts();
      return accounts.some(
        (row) => row?.platform === "instagram" && Boolean(row?.connected)
      );
    } catch {
      return false;
    }
  },

  /**
   * Get products from Instagram Shop
   */
  getProducts: async ({ page = 1, limit = 20, search } = {}) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      return { products: [], total: 0, hasMore: false };
    }

    try {
      const res = await instagramApi.getProducts({
        page,
        per_page: limit,
        search,
      });
      const payload = res?.data?.data;
      const products = payload?.data || [];
      const total = payload?.total || products.length;
      const hasMore =
        Number(payload?.current_page || 1) < Number(payload?.last_page || 1);
      return { products, total, hasMore };
    } catch {
      return { products: [], total: 0, hasMore: false };
    }
  },

  /**
   * Import selected products as listings
   */
  importProducts: async (sourceUrls = []) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        message: SOCIAL_POSTING_UNAVAILABLE_MESSAGE,
      };
    }

    try {
      const res = await instagramApi.importProducts({
        source_urls: sourceUrls,
      });
      const data = res?.data?.data || {};
      return {
        success: res?.data?.error === false,
        imported: Number(data?.products_imported || 0),
        failed: Number(data?.products_failed || 0),
        message: res?.data?.message || "Instagram import završen.",
        data,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        message:
          error?.response?.data?.message || "Instagram import nije uspio.",
      };
    }
  },

  /**
   * Sync existing listing with Instagram product
   */
  syncProduct: async (listingId, instagramProductId) => {
    if (SOCIAL_POSTING_TEMP_UNAVAILABLE) return false;
    try {
      const res = await instagramApi.syncProduct({
        item_id: listingId,
        instagram_product_id: instagramProductId,
      });
      return res?.data?.error === false;
    } catch {
      return false;
    }
  },
};

export default useSocialSharing;
