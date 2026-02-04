"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import Api from "@/api/AxiosInterceptors";

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
// AUTO-POST SERVICE
// ============================================

/**
 * Auto-post Service
 * Handles social media auto-posting functionality
 * Requires backend endpoints:
 * - GET /api/social/connected-accounts
 * - POST /api/social/connect/{platform}
 * - POST /api/social/disconnect/{platform}
 * - POST /api/social/schedule-post
 * - GET /api/social/scheduled-posts
 */
export const AutoPostService = {
  /**
   * Check if auto-post is configured for a platform
   */
  isConfigured: async (platform) => {
    try {
      const response = await Api.get("/social/connected-accounts");
      if (response?.data?.error === false) {
        const accounts = response.data.data || [];
        return accounts.some(acc => acc.platform === platform && acc.is_active);
      }
      return false;
    } catch (error) {
      console.error("Error checking social config:", error);
      return false;
    }
  },

  /**
   * Schedule auto-post for a new listing
   */
  schedulePost: async ({ itemId, platforms, scheduledTime, caption, hashtags }) => {
    try {
      const response = await Api.post("/social/schedule-post", {
        item_id: itemId,
        platforms: platforms,
        scheduled_at: scheduledTime,
        caption: caption,
        hashtags: hashtags,
      });
      
      if (response?.data?.error === false) {
        return { 
          success: true, 
          data: response.data.data,
          message: "Post zakazan uspješno!" 
        };
      }
      return { 
        success: false, 
        message: response?.data?.message || "Greška pri zakazivanju posta" 
      };
    } catch (error) {
      console.error("Error scheduling post:", error);
      return { success: false, message: "Greška pri zakazivanju posta" };
    }
  },

  /**
   * Get connected social accounts for user
   */
  getConnectedAccounts: async () => {
    try {
      const response = await Api.get("/social/connected-accounts");
      if (response?.data?.error === false) {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
      return [];
    }
  },

  /**
   * Get scheduled posts
   */
  getScheduledPosts: async ({ page = 1, status = "pending" } = {}) => {
    try {
      const response = await Api.get("/social/scheduled-posts", {
        params: { page, status }
      });
      if (response?.data?.error === false) {
        return response.data.data || { posts: [], total: 0 };
      }
      return { posts: [], total: 0 };
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      return { posts: [], total: 0 };
    }
  },

  /**
   * Cancel a scheduled post
   */
  cancelScheduledPost: async (postId) => {
    try {
      const response = await Api.post(`/social/scheduled-posts/${postId}/cancel`);
      return response?.data?.error === false;
    } catch (error) {
      console.error("Error canceling post:", error);
      return false;
    }
  },

  /**
   * Connect a social account (initiates OAuth flow)
   */
  connectAccount: async (platform) => {
    try {
      const response = await Api.get(`/social/connect/${platform}`);
      if (response?.data?.error === false && response?.data?.data?.oauth_url) {
        // Redirect to OAuth URL
        window.location.href = response.data.data.oauth_url;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error connecting account:", error);
      return false;
    }
  },

  /**
   * Disconnect a social account
   */
  disconnectAccount: async (platform) => {
    try {
      const response = await Api.post(`/social/disconnect/${platform}`);
      return response?.data?.error === false;
    } catch (error) {
      console.error("Error disconnecting account:", error);
      return false;
    }
  },
};

// ============================================
// INSTAGRAM SHOP IMPORT SERVICE
// ============================================

/**
 * Instagram Shop Import Service
 * Handles importing products from Instagram Shop
 * Requires backend endpoints:
 * - GET /api/instagram/products
 * - POST /api/instagram/import
 * - GET /api/instagram/sync-status
 */
export const InstagramShopService = {
  /**
   * Check if Instagram Shop is connected
   */
  isConnected: async () => {
    try {
      const accounts = await AutoPostService.getConnectedAccounts();
      const instagram = accounts.find(acc => acc.platform === "instagram");
      return instagram?.has_shop_access === true;
    } catch (error) {
      console.error("Error checking Instagram connection:", error);
      return false;
    }
  },

  /**
   * Get products from Instagram Shop
   */
  getProducts: async ({ page = 1, limit = 20 } = {}) => {
    try {
      const response = await Api.get("/instagram/products", {
        params: { page, limit }
      });
      
      if (response?.data?.error === false) {
        const data = response.data.data || {};
        return {
          products: data.products || [],
          total: data.total || 0,
          hasMore: data.has_more || false,
          currentPage: data.current_page || page,
        };
      }
      return { products: [], total: 0, hasMore: false };
    } catch (error) {
      console.error("Error fetching Instagram products:", error);
      return { products: [], total: 0, hasMore: false };
    }
  },

  /**
   * Import selected products as listings
   */
  importProducts: async (productIds, { categoryId, autoPublish = false } = {}) => {
    try {
      const response = await Api.post("/instagram/import", {
        product_ids: productIds,
        category_id: categoryId,
        auto_publish: autoPublish,
      });
      
      if (response?.data?.error === false) {
        return {
          success: true,
          imported: response.data.data?.imported_count || 0,
          failed: response.data.data?.failed_count || 0,
          items: response.data.data?.items || [],
          message: response.data.message || "Proizvodi uspješno importovani!",
        };
      }
      return {
        success: false,
        imported: 0,
        message: response?.data?.message || "Greška pri importu",
      };
    } catch (error) {
      console.error("Error importing products:", error);
      return { success: false, imported: 0, message: "Greška pri importu proizvoda" };
    }
  },

  /**
   * Get import history
   */
  getImportHistory: async ({ page = 1 } = {}) => {
    try {
      const response = await Api.get("/instagram/import-history", {
        params: { page }
      });
      
      if (response?.data?.error === false) {
        return response.data.data || { imports: [], total: 0 };
      }
      return { imports: [], total: 0 };
    } catch (error) {
      console.error("Error fetching import history:", error);
      return { imports: [], total: 0 };
    }
  },

  /**
   * Sync existing listing with Instagram product
   */
  syncProduct: async (listingId, instagramProductId) => {
    try {
      const response = await Api.post("/instagram/sync", {
        item_id: listingId,
        instagram_product_id: instagramProductId,
      });
      return response?.data?.error === false;
    } catch (error) {
      console.error("Error syncing product:", error);
      return false;
    }
  },

  /**
   * Get sync status for a listing
   */
  getSyncStatus: async (listingId) => {
    try {
      const response = await Api.get(`/instagram/sync-status/${listingId}`);
      if (response?.data?.error === false) {
        return response.data.data || null;
      }
      return null;
    } catch (error) {
      console.error("Error getting sync status:", error);
      return null;
    }
  },
};

export default useSocialSharing;
