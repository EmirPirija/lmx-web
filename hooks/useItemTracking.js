"use client";

import { useEffect, useRef, useCallback } from "react";
import { store } from "@/redux/store";

// ============================================
// API BASE URL
// ============================================
const getApiBase = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const endPoint = process.env.NEXT_PUBLIC_END_POINT || '/api/';
  return `${apiUrl.replace(/\/$/, '')}${endPoint.replace(/\/$/, '')}`;
};

// ============================================
// HELPER FUNKCIJE
// ============================================
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    try {
      const state = store.getState();
      return state?.UserSignup?.data?.token || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getVisitorId = () => {
  if (typeof window === 'undefined') return null;
  
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

const getDeviceType = () => {
  if (typeof window === 'undefined') return 'unknown';
  
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
};

const getUTMParams = () => {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
  };
};

const getReferrer = () => {
  if (typeof window === 'undefined') return null;
  return document.referrer || null;
};

const trackingRequest = async (endpoint, data) => {
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const form = new FormData();

    const base = {
      ...data,
      visitor_id: getVisitorId(),
      device_type: getDeviceType(),
      ...getUTMParams(),
      referrer_url: getReferrer(),
      timestamp: new Date().toISOString(),
    };

    Object.entries(base).forEach(([k, v]) => {
      if (v === undefined || v === null) return;

      // === FIX POČINJE OVDJE ===
      // Ako je polje 'extra_data', moramo ga ručno raspakovati da ga PHP prepozna kao niz
      if (k === 'extra_data' && Array.isArray(v)) {
        v.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.entries(item).forEach(([subKey, subVal]) => {
              form.append(`extra_data[${index}][${subKey}]`, String(subVal));
            });
          } else {
             // Ako je slučajno obična vrijednost unutar niza
             form.append(`extra_data[${index}]`, String(item));
          }
        });
        return; // Preskačemo standardno dodavanje za extra_data
      }
      // === FIX ZAVRŠAVA OVDJE ===

      // Za sve ostale objekte (npr. filters) i dalje koristi JSON.stringify ako je potrebno
      if (typeof v === "object") {
         form.append(k, JSON.stringify(v));
      } else {
         form.append(k, String(v));
      }
    });

    const apiBase = getApiBase();
    const res = await fetch(`${apiBase}/${endpoint}`, {
      method: "POST",
      headers,
      body: form,
    });

    const text = await res.text();
    let payload = null;
    try { payload = JSON.parse(text); } catch {}

    // console.log("TRACK RES:", endpoint, res.status, payload ?? text);

    return res.ok;
  } catch (e) {
    console.error("Tracking error:", endpoint, e);
    return false;
  }
};


// ============================================
// MAIN TRACKING HOOK
// ============================================
export const useItemTracking = (itemId, options = {}) => {
  const startTimeRef = useRef(null);
  const hasTrackedView = useRef(false);
  const engagementTracked = useRef(new Set());
  const itemIdRef = useRef(itemId);

  // Update ref when itemId changes
  useEffect(() => {
    itemIdRef.current = itemId;
    // Reset tracking state when item changes
    if (itemId) {
      hasTrackedView.current = false;
      engagementTracked.current = new Set();
    }
  }, [itemId]);

  // Track View
  const trackView = useCallback(async (source = null, sourceDetail = null) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId || hasTrackedView.current) return;
    
    hasTrackedView.current = true;
    startTimeRef.current = Date.now();

    console.log('📊 Tracking view:', { item_id: currentItemId, source, sourceDetail });

    await trackingRequest('item-statistics/track-view', {
      item_id: currentItemId,
      source,
      source_detail: sourceDetail,
    });
  }, []);

  // Track Contact
  const trackContact = useCallback(async (contactType) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    console.log('📊 Tracking contact:', { item_id: currentItemId, contact_type: contactType });

    await trackingRequest('item-statistics/track-contact', {
      item_id: currentItemId,
      contact_type: contactType,
    });
  }, []);

  // Track Share
  const trackShare = useCallback(async (platform) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    console.log('📊 Tracking share:', { item_id: currentItemId, platform });

    const result = await trackingRequest('item-statistics/track-share', {
      item_id: currentItemId,
      platform,
    });

    return result;
  }, []);

  // Track Engagement
  const trackEngagement = useCallback(async (engagementType, extraData = {}) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    // Prevent duplicate tracking for certain engagement types
    const onceTypes = ['gallery_open', 'description_expand', 'map_open', 'seller_profile_click', 'price_history_view'];
    if (onceTypes.includes(engagementType)) {
      if (engagementTracked.current.has(engagementType)) return;
      engagementTracked.current.add(engagementType);
    }

    console.log('📊 Tracking engagement:', { item_id: currentItemId, engagement_type: engagementType, extraData });

    await trackingRequest('item-statistics/track-engagement', {
      item_id: currentItemId,
      engagement_type: engagementType,
      extra_data: Array.isArray(extraData) ? extraData : [extraData],
    });
    
  }, []);

  // Track Favorite
  const trackFavorite = useCallback(async (added) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    console.log('📊 Tracking favorite:', { item_id: currentItemId, added });

    await trackingRequest('item-statistics/track-favorite', {
      item_id: currentItemId,
      added,
    });
  }, []);

  // Track Time on Page (cleanup)
  const trackTimeOnPage = useCallback(async () => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId || !startTimeRef.current) return;
    
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    if (duration > 2) { // Minimum 2 seconds
      console.log('📊 Tracking time on page:', { item_id: currentItemId, duration });

      await trackingRequest('item-statistics/track-time', {
        item_id: currentItemId,
        duration,
      });
    }
  }, []);

  // Auto-track view on mount (if enabled)
  useEffect(() => {
    if (options.autoTrackView && itemId) {
      trackView(options.source, options.sourceDetail);
    }

    // Track time on unmount
    return () => {
      trackTimeOnPage();
    };
  }, [itemId, trackView, trackTimeOnPage, options.autoTrackView, options.source, options.sourceDetail]);

  // Handle page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackTimeOnPage]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackTimeOnPage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [trackTimeOnPage]);

  return {
    trackView,
    trackContact,
    trackShare,
    trackEngagement,
    trackFavorite,
    trackTimeOnPage,
  };
};

// ============================================
// CONVENIENCE HOOKS
// ============================================

// Hook za praćenje kontakata
export const useContactTracking = (itemId) => {
  const { trackContact } = useItemTracking(itemId, { autoTrackView: false });

  return {
    trackPhoneReveal: () => trackContact('phone_reveal'),
    trackPhoneClick: () => trackContact('phone_click'),
    trackWhatsApp: () => trackContact('whatsapp'),
    trackViber: () => trackContact('viber'),
    trackMessage: () => trackContact('message'),
    trackEmail: () => trackContact('email'),
    trackOffer: () => trackContact('offer'),
  };
};

// Hook za praćenje engagementa
export const useEngagementTracking = (itemId) => {
  const { trackEngagement } = useItemTracking(itemId, { autoTrackView: false });

  return {
    trackGalleryOpen: () => trackEngagement('gallery_open'),
    trackImageView: (imageIndex) => trackEngagement('image_view', { index: imageIndex }),
    trackImageZoom: () => trackEngagement('image_zoom'),
    trackVideoPlay: () => trackEngagement('video_play'),
    trackVideoProgress: (percent) => {
      if (percent >= 25 && percent < 50) trackEngagement('video_25');
      else if (percent >= 50 && percent < 75) trackEngagement('video_50');
      else if (percent >= 75 && percent < 100) trackEngagement('video_75');
      else if (percent >= 100) trackEngagement('video_complete');
    },
    trackDescriptionExpand: () => trackEngagement('description_expand'),
    trackMapOpen: () => trackEngagement('map_open'),
    trackMapDirections: () => trackEngagement('map_directions'),
    trackSellerProfileClick: () => trackEngagement('seller_profile_click'),
    trackSellerOtherItemsClick: () => trackEngagement('seller_other_items_click'),
    trackSimilarItemsClick: () => trackEngagement('similar_items_click'),
    trackPriceHistoryView: () => trackEngagement('price_history_view'),
  };
};

// Hook za praćenje search impressions
export const useSearchTracking = () => {
  const impressionIdRef = useRef(null);

  const trackSearchImpressions = useCallback(async (itemIds, searchData) => {
    if (!itemIds?.length) return null;
    
    // Generate unique impression ID for this search
    const impressionId = 'imp_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    impressionIdRef.current = impressionId;

    console.log('📊 Tracking search impressions:', { 
      impression_id: impressionId,
      item_count: itemIds.length, 
      search_query: searchData.search_query 
    });
    
    await trackingRequest('item-statistics/track-search-impressions', {
      impression_id: impressionId,
      item_ids: JSON.stringify(Array.isArray(itemIds) ? itemIds : []),
      search_query: searchData?.search_query || null,
    });
    

    return impressionId;
  }, []);

  const trackSearchClick = useCallback(async (itemId, position, impressionId = null) => {
    const impId = impressionId || impressionIdRef.current;
    
    console.log('📊 Tracking search click:', { 
      item_id: itemId, 
      position, 
      impression_id: impId 
    });
    
    await trackingRequest('item-statistics/track-search-click', {
      item_id: itemId,
      position,
      impression_id: impId,
    });
  }, []);

  return {
    trackSearchImpressions,
    trackSearchClick,
    getLastImpressionId: () => impressionIdRef.current,
  };
};

// ============================================
// SHARE UTILS
// ============================================
export const createShareUrl = (itemSlug, shareToken) => {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || window.location.origin;
  return `${baseUrl}/ad-details/${itemSlug}?ref=share&token=${shareToken}`;
};

export const shareToSocialMedia = async (platform, itemId, itemName, itemUrl, trackShare) => {
  // Track the share
  const result = await trackShare(platform);
  
  const shareData = {
    title: itemName,
    url: itemUrl,
  };

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(itemUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(itemName)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(itemName + ' ' + itemUrl)}`,
    viber: `viber://forward?text=${encodeURIComponent(itemName + ' ' + itemUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(itemUrl)}&text=${encodeURIComponent(itemName)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(itemUrl)}&title=${encodeURIComponent(itemName)}`,
    messenger: `fb-messenger://share/?link=${encodeURIComponent(itemUrl)}`,
  };

  if (platform === 'copy_link') {
    await navigator.clipboard.writeText(itemUrl);
    return { success: true, action: 'copied' };
  }

  if (platform === 'native' && navigator.share) {
    try {
      await navigator.share(shareData);
      return { success: true, action: 'shared' };
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return { success: false };
    }
  }

  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    return { success: true, action: 'opened' };
  }

  return { success: false };
};

export default useItemTracking;