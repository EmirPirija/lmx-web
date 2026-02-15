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
 
const getAnonymousId = () => {
  if (typeof window === 'undefined') return null;
  
  let anonId = localStorage.getItem('anonymous_id');
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
    localStorage.setItem('anonymous_id', anonId);
  }
  return anonId;
};

const getSessionId = () => {
  if (typeof window === 'undefined') return null;

  const now = Date.now();
  const lastSeen = Number(localStorage.getItem('session_last_seen') || 0);
  let sessionId = localStorage.getItem('session_id');

  if (!sessionId || now - lastSeen > 30 * 60 * 1000) {
    sessionId = 'sess_' + Math.random().toString(36).slice(2, 10) + '_' + now;
    localStorage.setItem('session_id', sessionId);
  }

  localStorage.setItem('session_last_seen', String(now));
  return sessionId;
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

const getUserId = () => {
  try {
    const state = store.getState();
    return state?.UserSignup?.data?.user_id || state?.UserSignup?.data?.id || null;
  } catch (e) {
    return null;
  }
};

const getLandingUrl = () => {
  if (typeof window === 'undefined') return null;
  return window.location.href;
};

const getAttributionSource = ({ searchId, explicitSource, explicitDetail } = {}) => {
  if (explicitSource) {
    return { source: explicitSource, source_detail: explicitDetail || null };
  }

  if (typeof window === 'undefined') return { source: 'direct', source_detail: null };

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const referrer = getReferrer();
  const currentHost = window.location.host;

  if (searchId) {
    return { source: 'search', source_detail: `search:${searchId}`.slice(0, 100) };
  }

  if (utmSource || utmMedium || utmCampaign) {
    const detail = [`utm:${utmSource || ''}`, utmMedium, utmCampaign].filter(Boolean).join('|');
    const normalizedSource = (utmSource || '').toLowerCase();
    const sourceMap = ['google', 'facebook', 'instagram', 'tiktok', 'twitter', 'youtube', 'linkedin'];
    const matched = sourceMap.find((src) => normalizedSource.includes(src));
    return { source: matched || 'other', source_detail: detail.slice(0, 100) };
  }

  if (referrer) {
    try {
      const refHost = new URL(referrer).host;
      if (refHost && refHost !== currentHost) {
        return { source: 'other', source_detail: refHost.slice(0, 100) };
      }
    } catch (e) {
      return { source: 'other', source_detail: referrer.slice(0, 100) };
    }
  }

  if (window.location.pathname.startsWith('/ads') && params.get('category')) {
    return { source: 'category', source_detail: params.get('category')?.slice(0, 100) || null };
  }

  if (window.location.pathname.startsWith('/ads')) {
    return { source: 'search', source_detail: params.get('query')?.slice(0, 100) || null };
  }

  return { source: 'direct', source_detail: null };
};

const trackingRequest = async (endpoint, data, options = {}) => {
  const { returnPayload = false } = options;
  try {
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
 
    const form = new FormData();

    const base = {
      ...data,
      visitor_id: getAnonymousId(),
      anonymous_id: getAnonymousId(),
      session_id: getSessionId(),
      user_id: getUserId(),
      device_type: getDeviceType(),
      ...getUTMParams(),
      referrer_url: getReferrer(),
      landing_url: getLandingUrl(),
      timestamp: new Date().toISOString(),
    };
 
    Object.entries(base).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
 
      // Ako je polje 'extra_data', moramo ga ručno raspakovati da ga PHP prepozna kao niz
      if (k === 'extra_data' && Array.isArray(v)) {
        v.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            Object.entries(item).forEach(([subKey, subVal]) => {
              form.append(`extra_data[${index}][${subKey}]`, String(subVal));
            });
          } else {
             form.append(`extra_data[${index}]`, String(item));
          }
        });
        return;
      }
 
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

    const isSuccess = res.ok && payload?.error !== true;
    if (!isSuccess) {
      console.warn("Tracking API rejected request:", endpoint, {
        status: res.status,
        message: payload?.message || null,
      });
    }

    if (returnPayload) {
      return {
        ok: isSuccess,
        status: res.status,
        payload,
      };
    }

    return isSuccess;
  } catch (e) {
    console.error("Tracking error:", endpoint, e);
    if (returnPayload) {
      return {
        ok: false,
        status: 0,
        payload: null,
      };
    }
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
    
    const sessionId = getSessionId();
    if (sessionId && typeof window !== 'undefined') {
      const dedupeKey = `viewed_${sessionId}_${currentItemId}`;
      if (sessionStorage.getItem(dedupeKey)) return;
      sessionStorage.setItem(dedupeKey, '1');
    }

    hasTrackedView.current = true;
    startTimeRef.current = Date.now();

    const explicitSource = typeof source === 'object' ? source?.source : source;
    const explicitDetail = typeof source === 'object' ? source?.source_detail || source?.sourceDetail : sourceDetail;
    const searchId = typeof source === 'object' ? source?.searchId : null;
    const attribution = getAttributionSource({ searchId, explicitSource, explicitDetail });

    console.log('📊 Tracking view:', { item_id: currentItemId, ...attribution });

    await trackingRequest('item-statistics/track-view', {
      item_id: currentItemId,
      source: attribution.source,
      source_detail: attribution.source_detail,
    });
  }, []);

  // Track Contact
  const trackContact = useCallback(async (contactType, context = {}) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    const attribution = getAttributionSource({ explicitSource: context?.source, explicitDetail: context?.source_detail });
    console.log('📊 Tracking contact:', { item_id: currentItemId, contact_type: contactType, ...attribution });

    await trackingRequest('item-statistics/track-contact', {
      item_id: currentItemId,
      contact_type: contactType,
      source: attribution.source,
    });
  }, []);

  // Track Share
  const trackShare = useCallback(async (platform, context = {}) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    const attribution = getAttributionSource({ explicitSource: context?.source, explicitDetail: context?.source_detail });
    console.log('📊 Tracking share:', { item_id: currentItemId, platform, ...attribution });

    const result = await trackingRequest('item-statistics/track-share', {
      item_id: currentItemId,
      platform,
      source: attribution.source,
    });

    return result;
  }, []);

  // Track Engagement
  const trackEngagement = useCallback(async (engagementType, extraData = {}, context = {}) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    // Prevent duplicate tracking for certain engagement types
    const onceTypes = ['gallery_open', 'description_expand', 'map_open', 'seller_profile_click', 'price_history_view'];
    if (onceTypes.includes(engagementType)) {
      if (engagementTracked.current.has(engagementType)) return;
      engagementTracked.current.add(engagementType);
    }

    const attribution = getAttributionSource({ explicitSource: context?.source, explicitDetail: context?.source_detail });
    console.log('📊 Tracking engagement:', { item_id: currentItemId, engagement_type: engagementType, extraData, ...attribution });

    await trackingRequest('item-statistics/track-engagement', {
      item_id: currentItemId,
      engagement_type: engagementType,
      extra_data: Array.isArray(extraData) ? extraData : [extraData],
    });
    
  }, []);

  // Track Favorite
  const trackFavorite = useCallback(async (added, context = {}) => {
    const currentItemId = itemIdRef.current;
    if (!currentItemId) return;
    
    const attribution = getAttributionSource({ explicitSource: context?.source, explicitDetail: context?.source_detail });
    console.log('📊 Tracking favorite:', { item_id: currentItemId, added, ...attribution });

    await trackingRequest('item-statistics/track-favorite', {
      item_id: currentItemId,
      added,
      source: attribution.source,
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
  const searchIdRef = useRef(null);
  const lastSearchContextRef = useRef(null);

  const hashString = (value = "") => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const getSearchId = useCallback((context = {}) => {
    if (typeof window === 'undefined') return null;
    const key = JSON.stringify({
      query: context.search_query || null,
      category: context.category_slug || null,
      sort: context.sort_by || null,
      filters: context.filters || null,
      featured: context.featured_section || null,
    });
    const hash = hashString(key);
    const storageKey = `search_id_${hash}`;
    let searchId = sessionStorage.getItem(storageKey);
    if (!searchId) {
      searchId = `search_${hash}_${Date.now()}`;
      sessionStorage.setItem(storageKey, searchId);
    }
    searchIdRef.current = searchId;
    return searchId;
  }, []);

  const trackSearchImpressions = useCallback(async (itemIds, searchData) => {
    if (!itemIds?.length) return null;

    const searchId = getSearchId(searchData || {});
    const sessionId = getSessionId();
    const page = searchData?.page || 1;
    const impressionKey = `imp_${sessionId}_${searchId}_${page}`;
    lastSearchContextRef.current = {
      search_id: searchId,
      search_query: searchData?.search_query || null,
      page,
    };

    if (typeof window !== 'undefined' && sessionStorage.getItem(impressionKey)) {
      return searchId;
    }

    console.log('📊 Tracking search impressions:', {
      search_id: searchId,
      item_count: itemIds.length,
      search_query: searchData?.search_query || null,
      page,
    });

    const response = await trackingRequest('track/search-impressions', {
      item_ids: Array.isArray(itemIds) ? itemIds : [],
      search_query: searchData?.search_query || null,
      search_type: searchData?.search_type || null,
      page,
      results_total: searchData?.results_total ?? searchData?.results_count ?? null,
      filters: searchData?.filters || null,
      search_id: searchId,
    }, { returnPayload: true });

    if (!response?.ok) {
      impressionIdRef.current = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(impressionKey);
      }
      return null;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(impressionKey, '1');
    }

    const trackedImpressionId = response?.payload?.data?.impression_id
      || response?.payload?.data?.impression_ids?.[0]
      || null;
    impressionIdRef.current = trackedImpressionId || null;

    return searchId;
  }, []);

  const trackSearchClick = useCallback(async (itemId, position, impressionId = null, searchContext = null) => {
    const impId = impressionId || impressionIdRef.current;
    const context = searchContext || lastSearchContextRef.current || {};

    const payload = impId
      ? { impression_id: impId }
      : {
          item_id: itemId,
          position: Number.isFinite(position) ? position : null,
          page: context?.page || 1,
          search_id: context?.search_id || searchIdRef.current || null,
          search_query: context?.search_query || null,
        };

    console.log('📊 Tracking search click:', { 
      item_id: itemId, 
      position, 
      impression_id: impId,
      fallback: !impId,
    });

    const response = await trackingRequest('track/search-click', payload, { returnPayload: true });
    if (!response?.ok) {
      console.warn('Search click tracking failed', {
        item_id: itemId,
        search_id: context?.search_id || null,
        message: response?.payload?.message || null,
      });
    }
  }, []);

  return {
    trackSearchImpressions,
    trackSearchClick,
    getLastImpressionId: () => impressionIdRef.current,
    getSearchId,
    getLastSearchId: () => searchIdRef.current,
    getLastSearchContext: () => lastSearchContextRef.current,
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
