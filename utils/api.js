"use client";
import Api from "@/api/AxiosInterceptors";
export const GET_SETTINGS = "get-system-settings";
export const GET_SEO_SETTINGS = "seo-settings";
export const GET_SLIDER = "get-slider";
export const GET_CATEGORIES = "get-categories";
export const GET_PARENT_CATEGORIES = "get-parent-categories";
export const GET_ITEM = "get-item";
export const GET_PACKAGE = "get-package";
export const GET_BLOGS = "blogs";
export const GET_BLOG_TAGS = "blog-tags";
export const GET_FEATURED_SECTION = "get-featured-section";
export const GET_FAQ = "faq";
export const GET_COUNTRIES = "countries";
export const GET_STATES = "states";
export const GET_CITIES = "cities";
export const GET_AREA = "areas";
export const GET_LANGUAGE = "get-languages";
export const GET_CUSTOM_FIELDS = "get-customfields";
export const MANAGE_FAVOURITE = "manage-favourite";
export const GET_FAVOURITE_ITEMS = "get-favourite-item";
export const GET_MY_ITEMS = "my-items";
export const GET_LIMITS = "get-limits";
export const DELETE_ITEM = "delete-item";
export const UPDATE_ITEM_STATUS = "update-item-status";
export const CREATE_FEATURED_ITEM = "make-item-featured";
export const CONTACT_US = "contact-us";
export const UPDATE_LISTING = "update-item";
export const USER_SIGNUP = "user-signup";
export const UPDATE_PROFILE = "update-profile";
export const DELETE_USER = "delete-user";
export const GET_REPORT_REASONS = "get-report-reasons";
export const ADD_REPORT = "add-reports";
export const GET_NOTIFICATION_LIST = "get-notification-list";
export const CHAT_LIST = "chat-list";
export const CHAT_MESSAGES = "chat-messages";
export const SEND_MESSAGE = "send-message";
export const BLOCK_USER = "block-user";
export const UNBLOCK_USER = "unblock-user";
export const BLOCKED_USERS = "blocked-users";
export const ASSIGN_FREE_PACKAGE = "assign-free-package";
export const GET_PAYMENT_SETTINGS = "get-payment-settings";
export const PAYMENT_INTENT = "payment-intent";
export const PAYMENT_TRANSACTIONS = "payment-transactions";
export const TIPS = "tips";
export const ITEM_OFFER = "item-offer";
export const ADD_ITEM = "add-item";
export const GET_SELLER = "get-seller";
export const ITEM_BUYER_LIST = "item-buyer-list";
export const AD_ITEM_REVIEW = "add-item-review";
export const GET_VERIFICATION_FIELDS = "verification-fields";
export const SEND_VERIFICATION_REQUEST = "send-verification-request";
export const GET_VERIFICATION_STATUS = "verification-request";
export const MY_REVIEWS = "my-review";
export const RENEW_ITEM = "renew-item";
export const ADD_REPORT_REVIEW = "add-review-report";
export const BANK_TRANSFER_UPDATE = "bank-transfer-update";
export const JOB_APPLY = "job-apply";
export const MY_JOB_APPLICATIONS = "my-job-applications";
export const GET_JOB_APPLICATIONS = "get-job-applications";
export const UPDATE_JOB_STATUS = "update-job-applications-status";
export const GET_OTP = "get-otp";
export const VERIFY_OTP = "verify-otp";
export const GET_LOCATION = "get-location";
export const GET_USER_INFO = "get-user-info";
export const LOGOUT = "logout";
export const SET_ITEM_TOTAL_CLICK = "set-item-total-click";

// ============================================
// GAMIFICATION API
// ============================================
export const GET_USER_BADGES = "gamification/user-badges";
export const GET_USER_POINTS = "gamification/user-points";
export const GET_LEADERBOARD = "gamification/leaderboard";
export const GET_ALL_BADGES = "gamification/badges";
export const GET_POINTS_HISTORY = "gamification/points-history";

export const GET_USER_MEMBERSHIP = "membership/user-membership";
export const GET_MEMBERSHIP_TIERS = "membership/tiers";
export const UPGRADE_MEMBERSHIP = "membership/upgrade";
export const CANCEL_MEMBERSHIP = "membership/cancel";

export const GET_SELLER_SETTINGS = "get-seller-settings";
export const UPDATE_SELLER_SETTINGS = "update-seller-settings";

// 1. SETTINGS API
export const settingsApi = {
  getSettings: ({ type } = {}) => {
    return Api.get(GET_SETTINGS, {
      params: { type },
    });
  },
};

// 2. SLIDER API
export const sliderApi = {
  getSlider: () => {
    return Api.get(GET_SLIDER, { params: {} });
  },
};

// 3. CATEGORY API
export const categoryApi = {
  getCategory: ({ category_id, page = 1, per_page = 50, signal } = {}) => {
    const params = { page, per_page };
    if (category_id) params.category_id = category_id;

    return Api.get(GET_CATEGORIES, {
      params,
      signal, // axios v1+ podržava AbortController signal
    });
  },
};

// 3. MY ITEMS API
export const getMyItemsApi = {
  getMyItems: ({ sort_by, page, status, id, category_id, slug } = {}) => {
    return Api.get(GET_MY_ITEMS, {
      params: { page, sort_by, status, id, category_id, slug },
    });
  },
};
export const getLimitsApi = {
  getLimits: ({ package_type } = {}) => {
    return Api.get(GET_LIMITS, {
      params: { package_type },
    });
  },
};
export const getSellerApi = {
  getSeller: ({ id, page } = {}) => {
    return Api.get(GET_SELLER, {
      params: { id, page },
    });
  },
};
export const getVerificationStatusApi = {
  getVerificationStatus: () => {
    return Api.get(GET_VERIFICATION_STATUS, {});
  },
};
export const getItemBuyerListApi = {
  getItemBuyerList: ({ item_id } = {}) => {
    return Api.get(ITEM_BUYER_LIST, {
      params: { item_id },
    });
  },
};
export const getVerificationFiledsApi = {
  getVerificationFileds: () => {
    return Api.get(GET_VERIFICATION_FIELDS, {});
  },
};

// 4. ITEM API
export const allItemApi = {
  getItems: ({
    id,
    custom_fields,
    category_id,
    min_price,
    max_price,
    sort_by,
    posted_since,
    featured_section_id,
    status,
    page,
    search,
    country,
    state,
    city,
    slug,
    category_slug,
    featured_section_slug,
    area_id,
    latitude,
    longitude,
    radius,
    user_id,
    popular_items,
    limit,
    current_page,
    has_video,
  } = {}) => {
    return Api.get(GET_ITEM, {
      params: {
        id,
        custom_fields,
        category_id,
        min_price,
        max_price,
        sort_by,
        posted_since,
        featured_section_id,
        status,
        page,
        search,
        country,
        state,
        city,
        slug,
        category_slug,
        featured_section_slug,
        area_id,
        latitude,
        longitude,
        radius,
        user_id,
        popular_items,
        limit,
        current_page,
        has_video,
      },
    });
  },
};

// PACKAGE API

export const getPackageApi = {
  getPackage: ({ type } = {}) => {
    return Api.get(GET_PACKAGE, {
      params: {
        type,
      },
    });
  },
};

// BLOGS API
export const getBlogsApi = {
  getBlogs: ({ slug, category_id, sort_by, tag, page, views } = {}) => {
    return Api.get(GET_BLOGS, {
      params: {
        slug,
        category_id,
        sort_by,
        tag,
        page,
        views,
      },
    });
  },
};
// BLOGS API
export const getBlogTagsApi = {
  getBlogs: ({} = {}) => {
    return Api.get(GET_BLOG_TAGS, {
      params: {},
    });
  },
};
export const getMyReviewsApi = {
  getMyReviews: ({ page } = {}) => {
    return Api.get(MY_REVIEWS, {
      params: {
        page,
      },
    });
  },
};

// 5. GET_FEATURED_SECTION
export const FeaturedSectionApi = {
  getFeaturedSections: ({
    city,
    state,
    country,
    slug,
    latitude,
    longitude,
    radius,
    area_id,
  } = {}) => {
    return Api.get(GET_FEATURED_SECTION, {
      params: {
        city,
        state,
        country,
        slug,
        latitude,
        longitude,
        radius,
        area_id,
      },
    });
  },
};
// FAQ API

export const getFaqApi = {
  getFaq: () => {
    return Api.get(GET_FAQ, {
      params: {},
    });
  },
};

// COUNTRY API

export const getCoutriesApi = {
  getCoutries: ({ search, page } = {}) => {
    return Api.get(GET_COUNTRIES, {
      params: {
        search,
        page,
      },
    });
  },
};

// STATES API

export const getStatesApi = {
  getStates: ({ country_id, search, page } = {}) => {
    return Api.get(GET_STATES, {
      params: {
        country_id,
        search,
        page,
      },
    });
  },
};

// CITIES API

export const getCitiesApi = {
  getCities: ({ state_id, search, page } = {}) => {
    return Api.get(GET_CITIES, {
      params: {
        state_id,
        search,
        page,
      },
    });
  },
};
export const getAreasApi = {
  getAreas: ({ city_id, search, page } = {}) => {
    return Api.get(GET_AREA, {
      params: {
        city_id,
        search,
        page,
      },
    });
  },
};

// language api

export const getLanguageApi = {
  getLanguage: ({ language_code, type } = {}) => {
    return Api.get(GET_LANGUAGE, {
      params: {
        language_code,
        type,
      },
    });
  },
};

export const userSignUpApi = {
  userSignup: ({
    name,
    email,
    mobile,
    fcm_id,
    firebase_id,
    type,
    profile,
    country_code,
    registration,
    region_code,
  } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (mobile) formData.append("mobile", mobile);
    if (fcm_id) formData.append("fcm_id", fcm_id);
    if (firebase_id) formData.append("firebase_id", firebase_id);
    if (type) formData.append("type", type);
    if (region_code) formData.append("region_code", region_code);

    // Assuming `profile` is a file object. If it's a URL or other type, handle accordingly.
    if (profile) {
      formData.append("profile", profile);
    }
    if (country_code) formData.append("country_code", country_code);
    if (registration) formData.append("registration", registration);

    return Api.post(USER_SIGNUP, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
export const logoutApi = {
  logoutApi: ({ fcm_token } = {}) => {
    const formData = new FormData();
    if (fcm_token) formData.append("fcm_token", fcm_token);
    return Api.post(LOGOUT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const sendVerificationReqApi = {
  sendVerificationReq: ({
    verification_field_translations,
    verification_field_files,
  } = {}) => {
    const formData = new FormData();

    if (verification_field_translations)
      formData.append(
        "verification_field_translations",
        verification_field_translations
      );

    verification_field_files.forEach(({ key, files }) => {
      const file = Array.isArray(files) ? files[0] : files;
      if (file) {
        formData.append(`verification_field_files[${key}]`, file);
      }
    });

    return Api.post(SEND_VERIFICATION_REQUEST, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
export const updateProfileApi = {
  updateProfile: ({
    name,
    email,
    mobile,
    fcm_id,
    address,
    profile,
    notification,
    show_personal_details,
    country_code,
    region_code,
  } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined
    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    
    // Dodana provjera za mobile
    if (mobile) formData.append("mobile", mobile);
    
    if (fcm_id) formData.append("fcm_id", fcm_id);
    if (address) formData.append("address", address);
    if (country_code) formData.append("country_code", country_code);

    if (profile) {
      formData.append("profile", profile);
    }

    // --- FIX: Provjera da li su vrijednosti definirane prije slanja ---
    // Koristimo !== undefined jer vrijednost može biti 0 (što je falsy)
    
    if (notification !== undefined && notification !== null) {
        formData.append("notification", notification);
    }
    
    if (show_personal_details !== undefined && show_personal_details !== null) {
        formData.append("show_personal_details", show_personal_details);
    }
    
    if (region_code) {
        formData.append("region_code", region_code);
    }
    // -------------------------------------------------------------

    return Api.post(UPDATE_PROFILE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// GET NOTIFICATION API

export const getNotificationList = {
  getNotification: ({ page } = {}) => {
    return Api.get(GET_NOTIFICATION_LIST, {
      params: {
        page: page,
      },
    });
  },
};

// ASSIGN FREE PACKAGE
export const assigFreePackageApi = {
  assignFreePackage: ({ package_id } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (package_id) formData.append("package_id", package_id);

    return Api.post(ASSIGN_FREE_PACKAGE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const addItemReviewApi = {
  addItemReview: ({ review, ratings, item_id, images } = {}) => {
    const formData = new FormData();
 
    // Append only if the value is defined and not an empty string
    if (review) formData.append("review", review);
    if (ratings) formData.append("ratings", ratings);
    if (item_id) formData.append("item_id", item_id);
    
    // Dodaj slike ako postoje
    if (images && Array.isArray(images) && images.length > 0) {
      images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });
    }
 
    return Api.post(AD_ITEM_REVIEW, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
export const renewItemApi = {
  renewItem: ({ item_ids, package_id } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_ids) formData.append("item_ids", item_ids);
    if (package_id) formData.append("package_id", package_id);

    return Api.post(RENEW_ITEM, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// DELETE ITEM API

export const deleteItemApi = {
  deleteItem: ({ item_id, item_ids } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);
    if (item_ids) formData.append("item_ids", item_ids);
    return Api.post(DELETE_ITEM, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const chanegItemStatusApi = {
  changeItemStatus: ({ item_id, status, sold_to } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);
    if (status) formData.append("status", status);
    if (sold_to) formData.append("sold_to", sold_to);

    return Api.post(UPDATE_ITEM_STATUS, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
export const createFeaturedItemApi = {
  createFeaturedItem: ({ item_id, positions } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);
    if (positions) formData.append("positions", positions);

    return Api.post(CREATE_FEATURED_ITEM, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
// getPackageSettingsApi
export const getPaymentSettingsApi = {
  getPaymentSettings: () => {
    return Api.get(GET_PAYMENT_SETTINGS, {
      params: {},
    });
  },
};
// createPaymentIntentApi
export const createPaymentIntentApi = {
  createIntent: ({ package_id, payment_method, platform_type } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (package_id) formData.append("package_id", package_id);
    if (payment_method) formData.append("payment_method", payment_method);
    if (platform_type) formData.append("platform_type", platform_type);

    return Api.post(PAYMENT_INTENT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
// deleteUserApi
export const deleteUserApi = {
  deleteUser: () => {
    return Api.delete(DELETE_USER, {
      params: {},
    });
  },
};
// paymentTransactionApi
export const paymentTransactionApi = {
  transaction: ({ page }) => {
    return Api.get(PAYMENT_TRANSACTIONS, {
      params: {
        page: page,
      },
    });
  },
};

// custom field api

export const getCustomFieldsApi = {
  getCustomFields: ({ category_ids, filter } = {}) => {
    return Api.get(GET_CUSTOM_FIELDS, {
      params: {
        category_ids,
        ...(filter !== undefined ? { filter } : {}),
      },
    });
  },
};

export const tipsApi = {
  tips: ({} = {}) => {
    return Api.get(TIPS, {
      params: {},
    });
  },
};

export const itemOfferApi = {
  offer: ({ item_id, amount } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);
    if (amount) formData.append("amount", amount);

    return Api.post(ITEM_OFFER, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const chatListApi = {
  chatList: ({ type, page } = {}) => {
    return Api.get(CHAT_LIST, {
      params: { type, page },
    });
  },
  
  markSeen: (data) => {
    const id = typeof data === 'object' ? data.chat_id : data;
    return Api.post(`chat/seen/${id}`);
  },
  
  sendTyping: ({ chat_id, is_typing } = {}) => {
    const formData = new FormData();
    if (chat_id) formData.append("chat_id", chat_id);
    formData.append("is_typing", is_typing ? 1 : 0);
    
    return Api.post("chat/typing", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  archiveChat: (chatId) => Api.post(`chat/archive/${chatId}`),
  unarchiveChat: (chatId) => Api.post(`chat/unarchive/${chatId}`),
  deleteChat: (chatId) => Api.delete(`chat/${chatId}`),
  markAsUnread: (chatId) => Api.post(`chat/mark-unread/${chatId}`),
  pinChat: (chatId, pin = true) => Api.post(`chat/pin/${chatId}`, { pin }),
  

  muteChat: (chatId) => Api.post(`chat/mute/${chatId}`),
  unmuteChat: (chatId) => Api.post(`chat/unmute/${chatId}`),
};

export const getMessagesApi = {
  chatMessages: ({ item_offer_id, page } = {}) => {
    return Api.get(CHAT_MESSAGES, {
      params: {
        item_offer_id,
        page,
      },
    });
  },
};

const normalizeBoolean = (val) => {
  if (val === true || val === 1 || val === "1" || val === "true") return 1;
  return 0;
};

const extractAvailableNow = (data = {}) => {
  if (data.available_now !== undefined) return normalizeBoolean(data.available_now);
  if (data.is_available !== undefined) return normalizeBoolean(data.is_available);
  if (data.is_avaible !== undefined) return normalizeBoolean(data.is_avaible);
  if (data.isAvailable !== undefined) return normalizeBoolean(data.isAvailable);
  return undefined;
};

const cleanCustomFields = (custom_fields = {}) => {
  if (!custom_fields || typeof custom_fields !== "object") return custom_fields;

  const cleaned = { ...custom_fields };
  delete cleaned.available_now;
  delete cleaned.is_available;
  delete cleaned.is_avaible;
  delete cleaned.isAvailable;

  return cleaned;
};

const to01 = (v) => (v === true || v === 1 || v === "1" || v === "true" ? 1 : 0);

const tryParseJson = (v) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v; // ostavi kako je ako nije validan JSON string
  }
};

const pickAvailableNow = (explicit, custom_fields) => {
  // explicit može doći kao available_now, isAvailable, is_available, is_avaible...
  let value = explicit;

  const cf = tryParseJson(custom_fields);

  const KEYS = ["available_now", "is_available", "is_avaible", "isAvailable"];

  const readFromObj = (obj) => {
    if (!obj || typeof obj !== "object") return undefined;
    for (const k of KEYS) {
      if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
  };

  // 1) ako nije proslijeđeno top-level, probaj naći u custom_fields
  if (value === undefined) {
    value = readFromObj(cf);

    // 2) fallback: ako je custom_fields slučajno u formi { langId: {...} }
    if (value === undefined && cf && typeof cf === "object") {
      for (const v of Object.values(cf)) {
        const found = readFromObj(v);
        if (found !== undefined) {
          value = found;
          break;
        }
      }
    }
  }

  // očisti custom_fields da backend ne dobije "available_now" kao custom field key
  let cleaned = cf;
  if (cf && typeof cf === "object") {
    cleaned = Array.isArray(cf) ? [...cf] : { ...cf };

    // briši top-level
    for (const k of KEYS) delete cleaned[k];

    // briši i u nested objektima (ako postoje)
    for (const [kLang, v] of Object.entries(cleaned)) {
      if (v && typeof v === "object") {
        const vv = Array.isArray(v) ? [...v] : { ...v };
        for (const kk of KEYS) delete vv[kk];
        cleaned[kLang] = vv;
      }
    }
  }

  return {
    availableNow01: value === undefined ? undefined : to01(value),
    cleanedCustomFields: cleaned,
  };
};



// helpers (stavi iznad addItemApi / editItemApi u istom fajlu)
const isFileLike = (v) =>
  typeof File !== "undefined" &&
  (v instanceof File || v instanceof Blob);

const toCsv = (v) => {
  if (!v) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(",");
  // ako već dođe "1,2,3"
  return String(v).trim();
};

// =========================
// add item api (FULL FIXED)
// =========================
export const addItemApi = {
  addItem: ({
    name,
    slug,
    description,
    category_id,
    all_category_ids,
    price,
    contact,
    video_link,
    custom_fields,

    image,
    gallery_images = [],
    video,

    address,
    latitude,
    longitude,
    custom_field_files = [],
    area_id,
    country,
    state,
    city,
    min_salary,
    max_salary,
    translations,
    custom_field_translations,
    region_code,
    scheduled_at,

    // ✅ TEMP IDS (native upload)
    temp_main_image_id,
    temp_gallery_image_ids,
    temp_video_id,

    // podrži sve varijante imena koje se mogu desiti u kodu
    available_now,
    isAvailable,
    is_available,
    is_avaible,
    inventory_count,
    show_only_to_premium,
  } = {}) => {
    const formData = new FormData();

    if (name) formData.append("name", name);
    if (slug) formData.append("slug", slug);
    if (description) formData.append("description", description);
    if (category_id) formData.append("category_id", category_id);
    if (all_category_ids) formData.append("all_category_ids", all_category_ids);
    if (price) formData.append("price", price);
    if (contact) formData.append("contact", contact);
    if (video_link) formData.append("video_link", video_link);

    // ✅ schedule
    if (scheduled_at) {
      formData.append("scheduled_at", scheduled_at);
      console.log("FORMDATA: scheduled_at", scheduled_at);
    }

    // ✅ izvuci available_now iz bilo čega (top-level ili iz custom_fields)
    const { availableNow01, cleanedCustomFields } = pickAvailableNow(
      available_now ?? isAvailable ?? is_available ?? is_avaible,
      custom_fields
    );

    // ✅ šalji custom_fields bez available_now unutra
    if (cleanedCustomFields !== undefined && cleanedCustomFields !== null) {
      const cfToSend =
        typeof cleanedCustomFields === "string"
          ? cleanedCustomFields
          : JSON.stringify(cleanedCustomFields);
      formData.append("custom_fields", cfToSend);
    }

    // ✅ REAL FILES ONLY (da ne šalješ object/string/empty)
    if (isFileLike(image)) formData.append("image", image);

    const fileGallery = (gallery_images || []).filter(isFileLike);
    if (fileGallery.length > 0) {
      fileGallery.forEach((g, index) => {
        formData.append(`gallery_images[${index}]`, g);
      });
    }

    if (isFileLike(video)) {
      formData.append("video", video);
    }

    // ✅ TEMP IDS (OVO JE BIO GLAVNI BUG)
    if (temp_main_image_id) {
      formData.append("temp_main_image_id", String(temp_main_image_id));
    }

    const galleryCsv = toCsv(temp_gallery_image_ids);
    if (galleryCsv) {
      formData.append("temp_gallery_image_ids", galleryCsv);
    }

    if (temp_video_id) {
      formData.append("temp_video_id", String(temp_video_id));
    }

    // ostala polja
    if (address) formData.append("address", address);
    if (latitude) formData.append("latitude", latitude);
    if (longitude) formData.append("longitude", longitude);

    custom_field_files.forEach(({ key, files }) => {
      if (Array.isArray(files)) {
        files.forEach((file) =>
          formData.append(`custom_field_files[${key}]`, file)
        );
      } else if (files) {
        formData.append(`custom_field_files[${key}]`, files);
      }
    });

    if (country) formData.append("country", country);
    if (state) formData.append("state", state);
    if (city) formData.append("city", city);
    if (area_id) formData.append("area_id", area_id);
    if (min_salary) formData.append("min_salary", min_salary);
    if (max_salary) formData.append("max_salary", max_salary);
    if (region_code) formData.append("region_code", region_code);
    if (inventory_count !== undefined && inventory_count !== null) {
      formData.append("inventory_count", inventory_count);
    }

    if (custom_field_translations)
      formData.append("custom_field_translations", custom_field_translations);

    if (translations) formData.append("translations", translations);

    // ✅ always send 0/1
    formData.append("show_only_to_premium", show_only_to_premium ? 1 : 0);
    formData.append("available_now", availableNow01 ?? 0);

    // debug (ako želiš)
    // for (const [k, v] of formData.entries()) console.log("FORMDATA:", k, v);

    return Api.post(ADD_ITEM, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// =========================
// edit item api (FULL FIXED)
// =========================
export const editItemApi = {
  editItem: ({
    id,
    name,
    slug,
    description,
    category_id,
    all_category_ids,
    price,
    contact,
    video_link,
    custom_fields,

    image,
    gallery_images = [],
    video,

    address,
    latitude,
    longitude,
    custom_field_files = [],
    area_id,
    country,
    state,
    city,
    delete_item_image_id,
    min_salary,
    max_salary,
    translations,
    custom_field_translations,
    region_code,
    is_on_sale,
    old_price,

    inventory_count,
    available_now,
    isAvailable,
    is_available,
    is_avaible,
    show_only_to_premium,

    // ✅ TEMP IDS (dodaj i u edit!)
    temp_main_image_id,
    temp_gallery_image_ids,
    temp_video_id,
  } = {}) => {
    const formData = new FormData();

    if (id) formData.append("id", id);
    if (name) formData.append("name", name);
    if (slug) formData.append("slug", slug);
    if (description) formData.append("description", description);
    if (category_id) formData.append("category_id", category_id);
    if (all_category_ids) formData.append("all_category_ids", all_category_ids);
    if (price) formData.append("price", price);
    if (contact) formData.append("contact", contact);
    if (video_link) formData.append("video_link", video_link);
    if (latitude) formData.append("latitude", latitude);
    if (longitude) formData.append("longitude", longitude);

    if (delete_item_image_id) {
      formData.append("delete_item_image_id", delete_item_image_id);
    }

    const { availableNow01, cleanedCustomFields } = pickAvailableNow(
      available_now ?? isAvailable ?? is_available ?? is_avaible,
      custom_fields
    );

    if (cleanedCustomFields !== undefined && cleanedCustomFields !== null) {
      const cfToSend =
        typeof cleanedCustomFields === "string"
          ? cleanedCustomFields
          : JSON.stringify(cleanedCustomFields);
      formData.append("custom_fields", cfToSend);
    }

    if (address) formData.append("address", address);
    if (country) formData.append("country", country);
    if (state) formData.append("state", state);
    if (area_id) formData.append("area_id", area_id);
    if (city) formData.append("city", city);

    // ✅ BITNO: ne šalji image ako je "" / string / object
    // (tvoj stari `if (image != null)` je znao poslati "" i obrisati main image)
    if (isFileLike(image)) {
      formData.append("image", image);
    }

    // ✅ append gallery samo za real files
    const fileGallery = (gallery_images || []).filter(isFileLike);
    if (fileGallery.length > 0) {
      fileGallery.forEach((g, index) => {
        formData.append(`gallery_images[${index}]`, g);
      });
    }

    if (region_code) formData.append("region_code", region_code);

    if (is_on_sale !== undefined) {
      formData.append("is_on_sale", is_on_sale ? 1 : 0);
    }
    if (old_price) {
      formData.append("old_price", old_price);
    }

    if (min_salary !== undefined && min_salary !== null) {
      formData.append("min_salary", min_salary);
    }
    if (max_salary !== undefined && max_salary !== null) {
      formData.append("max_salary", max_salary);
    }

    if (inventory_count !== undefined && inventory_count !== null) {
      formData.append("inventory_count", inventory_count);
    }

    if (isFileLike(video)) {
      formData.append("video", video);
    }

    // ✅ TEMP IDS (OVO je potrebno da edit “native upload” upadne u item)
    if (temp_main_image_id) {
      formData.append("temp_main_image_id", String(temp_main_image_id));
    }

    const galleryCsv = toCsv(temp_gallery_image_ids);
    if (galleryCsv) {
      formData.append("temp_gallery_image_ids", galleryCsv);
    }

    if (temp_video_id) {
      formData.append("temp_video_id", String(temp_video_id));
    }

    // ✅ samo ako imamo vrijednost
    if (availableNow01 !== undefined) {
      formData.append("available_now", availableNow01);
    }

    if (show_only_to_premium !== undefined) {
      formData.append("show_only_to_premium", show_only_to_premium ? 1 : 0);
    }

    custom_field_files.forEach(({ key, files }) => {
      if (Array.isArray(files)) {
        files.forEach((file) =>
          formData.append(`custom_field_files[${key}]`, file)
        );
      } else if (files) {
        formData.append(`custom_field_files[${key}]`, files);
      }
    });

    if (custom_field_translations)
      formData.append("custom_field_translations", custom_field_translations);

    if (translations) formData.append("translations", translations);

    return Api.post(UPDATE_LISTING, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};




export const sendMessageApi = {
  sendMessage: ({ item_offer_id, message, file, audio } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_offer_id) formData.append("item_offer_id", item_offer_id);
    if (message) formData.append("message", message);
    if (file) formData.append("file", file);
    if (audio) formData.append("audio", audio);

    return Api.post(SEND_MESSAGE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// favorite API
export const manageFavouriteApi = {
  manageFavouriteApi: ({ item_id } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);

    return Api.post(MANAGE_FAVOURITE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const getFavouriteApi = {
  getFavouriteApi: ({ page } = {}) => {
    return Api.get(GET_FAVOURITE_ITEMS, {
      params: {
        page,
      },
    });
  },
};

export const getReportReasonsApi = {
  reportReasons: ({} = {}) => {
    return Api.get(GET_REPORT_REASONS, {
      params: {},
    });
  },
};

export const addReportReasonApi = {
  addReport: ({ item_id, report_reason_id, other_message } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);
    if (report_reason_id) formData.append("report_reason_id", report_reason_id);
    if (other_message) formData.append("other_message", other_message);

    return Api.post(ADD_REPORT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
export const addReportReviewApi = {
  addReportReview: ({ seller_review_id, report_reason } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (seller_review_id) formData.append("seller_review_id", seller_review_id);
    if (report_reason) formData.append("report_reason", report_reason);

    return Api.post(ADD_REPORT_REVIEW, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const blockUserApi = {
  blockUser: ({ blocked_user_id } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (blocked_user_id) formData.append("blocked_user_id", blocked_user_id);

    return Api.post(BLOCK_USER, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
export const unBlockUserApi = {
  unBlockUser: ({ blocked_user_id } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (blocked_user_id) formData.append("blocked_user_id", blocked_user_id);

    return Api.post(UNBLOCK_USER, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const getBlockedUsers = {
  blockedUsers: ({} = {}) => {
    return Api.get(BLOCKED_USERS, {
      params: {},
    });
  },
};

export const contactUsApi = {
  contactUs: ({ name, email, subject, message } = {}) => {
    const formData = new FormData();
    // Append only if the value is defined and not an empty string
    if (name) formData.append("name", name);
    if (email) formData.append("email", email);
    if (subject) formData.append("subject", subject);
    if (message) formData.append("message", message);
    return Api.post(CONTACT_US, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
// get parent cate api
export const getParentCategoriesApi = {
  getPaymentCategories: ({ child_category_id, tree, slug } = {}) => {
    return Api.get(GET_PARENT_CATEGORIES, {
      params: {
        child_category_id,
        tree,
        slug,
      },
    });
  },
};

export const updateBankTransferApi = {
  updateBankTransfer: ({ payment_transection_id, payment_receipt } = {}) => {
    const formData = new FormData();
    if (payment_transection_id)
      formData.append("payment_transection_id", payment_transection_id);
    if (payment_receipt) formData.append("payment_receipt", payment_receipt);

    return Api.post(BANK_TRANSFER_UPDATE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const jobApplyApi = {
  jobApply: ({ item_id, full_name, email, mobile, resume } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);
    if (full_name) formData.append("full_name", full_name);
    if (email) formData.append("email", email);
    if (mobile) formData.append("mobile", mobile);
    if (resume) formData.append("resume", resume);

    return Api.post(JOB_APPLY, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const getMyJobApplicationsList = {
  getMyJobApplications: ({ page } = {}) => {
    return Api.get(MY_JOB_APPLICATIONS, {
      params: {
        page: page,
      },
    });
  },
};

export const getAdJobApplicationsApi = {
  getAdJobApplications: ({ page, item_id } = {}) => {
    return Api.get(GET_JOB_APPLICATIONS, {
      params: {
        page: page,
        item_id: item_id,
      },
    });
  },
};

export const updateJobStatusApi = {
  updateJobStatus: ({ job_id, status } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (job_id) formData.append("job_id", job_id);
    if (status) formData.append("status", status);

    return Api.post(UPDATE_JOB_STATUS, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

export const verifyOtpApi = {
  verifyOtp: ({ number, otp } = {}) => {
    return Api.get(VERIFY_OTP, {
      params: {
        number: number,
        otp: otp,
      },
    });
  },
};
export const getOtpApi = {
  getOtp: ({ number } = {}) => {
    return Api.get(GET_OTP, {
      params: {
        number: number,
      },
    });
  },
};

export const getLocationApi = {
  getLocation: ({ lat, lng, lang, search, place_id, session_id } = {}) => {
    return Api.get(GET_LOCATION, {
      params: { lat, lng, lang, search, place_id, session_id },
    });
  },
};

export const getUserInfoApi = {
  getUserInfo: () => {
    return Api.get(GET_USER_INFO);
  },
};

export const setItemTotalClickApi = {
  setItemTotalClick: ({ item_id } = {}) => {
    const formData = new FormData();

    // Append only if the value is defined and not an empty string
    if (item_id) formData.append("item_id", item_id);

    return Api.post(SET_ITEM_TOTAL_CLICK, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

// ============================================
// ITEM STATISTICS API
// ============================================
export const GET_ITEM_STATISTICS = "item-statistics";

export const itemStatisticsApi = {
  // Dohvati kompletnu statistiku za oglas
  getStatistics: ({ itemId, period = 30 } = {}) => {
    return Api.get(`${GET_ITEM_STATISTICS}/${itemId}`, {
      params: { period },
    });
  },

  // Dohvati quick stats
  getQuickStats: ({ itemId } = {}) => {
    return Api.get(`${GET_ITEM_STATISTICS}/${itemId}/quick`);
  },

  // Track view
  trackView: ({ item_id, source, source_detail, referrer_url, utm_source, utm_medium, utm_campaign, country_code, city, is_app, app_platform } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (source) formData.append("source", source);
    if (source_detail) formData.append("source_detail", source_detail);
    if (referrer_url) formData.append("referrer_url", referrer_url);
    if (utm_source) formData.append("utm_source", utm_source);
    if (utm_medium) formData.append("utm_medium", utm_medium);
    if (utm_campaign) formData.append("utm_campaign", utm_campaign);
    if (country_code) formData.append("country_code", country_code);
    if (city) formData.append("city", city);
    if (is_app !== undefined) formData.append("is_app", is_app ? 1 : 0);
    if (app_platform) formData.append("app_platform", app_platform);

    return Api.post(`${GET_ITEM_STATISTICS}/track-view`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Track contact
  trackContact: ({ item_id, contact_type, source } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (contact_type) formData.append("contact_type", contact_type);
    if (source) formData.append("source", source);

    return Api.post(`${GET_ITEM_STATISTICS}/track-contact`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Track share
  trackShare: ({ item_id, platform, share_url, country_code } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (platform) formData.append("platform", platform);
    if (share_url) formData.append("share_url", share_url);
    if (country_code) formData.append("country_code", country_code);

    return Api.post(`${GET_ITEM_STATISTICS}/track-share`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Track engagement
 trackEngagement: ({ item_id, engagement_type, extra_data } = {}) => {
  const formData = new FormData();

  if (item_id) formData.append("item_id", String(item_id));
  if (engagement_type) formData.append("engagement_type", engagement_type);

  // 1. Priprema podataka: Osiguraj da radimo sa pravim JS objektom/nizom
  let dataToProcess = extra_data;

  // Ako je greškom proslijeđen JSON string, parsiraj ga
  if (typeof extra_data === 'string') {
      try {
          dataToProcess = JSON.parse(extra_data);
      } catch (e) {
          console.error("Greška pri parsiranju extra_data", e);
          dataToProcess = []; // Fallback
      }
  }

  // 2. Osiguraj da je niz
  const arr = Array.isArray(dataToProcess) ? dataToProcess : (dataToProcess ? [dataToProcess] : []);

  // 3. Loop kroz niz i kreiraj ispravne ključeve za Laravel (npr. extra_data[0][index])
  arr.forEach((obj, i) => {
    if (obj && typeof obj === "object") {
      Object.entries(obj).forEach(([k, v]) => {
        // Ovdje pravimo ključ koji PHP prepoznaje kao array
        formData.append(`extra_data[${i}][${k}]`, v == null ? "" : String(v));
      });
    } else {
      // Fallback za primitivne vrijednosti
      formData.append(`extra_data[${i}]`, obj == null ? "" : String(obj));
    }
  });

  return Api.post(`${GET_ITEM_STATISTICS}/track-engagement`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
},
  
  

  // Track time on page
  trackTime: ({ item_id, duration } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (duration) formData.append("duration", duration);

    return Api.post(`${GET_ITEM_STATISTICS}/track-time`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Track favorite
  trackFavorite: ({ item_id, added } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    formData.append("added", added ? 1 : 0);

    return Api.post(`${GET_ITEM_STATISTICS}/track-favorite`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Public tracking (bez auth)
export const publicTrackingApi = {
  trackView: ({ item_id, visitor_id, device_type, referrer_url, utm_source, utm_medium, utm_campaign, source } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (visitor_id) formData.append("visitor_id", visitor_id);
    if (device_type) formData.append("device_type", device_type);
    if (referrer_url) formData.append("referrer_url", referrer_url);
    if (utm_source) formData.append("utm_source", utm_source);
    if (utm_medium) formData.append("utm_medium", utm_medium);
    if (utm_campaign) formData.append("utm_campaign", utm_campaign);
    if (source) formData.append("source", source);

    return Api.post("track/view", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  trackSearchImpressions: ({ item_ids, search_query, search_type, page, results_total, filters } = {}) => {
    const formData = new FormData();
    if (item_ids) formData.append("item_ids", JSON.stringify(item_ids));
    if (search_query) formData.append("search_query", search_query);
    if (search_type) formData.append("search_type", search_type);
    if (page) formData.append("page", page);
    if (results_total) formData.append("results_total", results_total);
    if (filters) formData.append("filters", JSON.stringify(filters));

    return Api.post("track/search-impressions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  trackSearchClick: ({ impression_id } = {}) => {
    const formData = new FormData();
    if (impression_id) formData.append("impression_id", impression_id);

    return Api.post("track/search-click", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ============================================
// GAMIFICATION API
// ============================================

export const gamificationApi = {
  // Dohvati sve bedževe korisnika
  getUserBadges: ({ user_id } = {}) => {
    return Api.get(GET_USER_BADGES, {
      params: { user_id },
    });
  },

  // Dohvati points korisnika
  getUserPoints: ({ user_id } = {}) => {
    return Api.get(GET_USER_POINTS, {
      params: { user_id },
    });
  },

  // Dohvati leaderboard
  getLeaderboard: ({ period = "weekly", page = 1 } = {}) => {
    return Api.get(GET_LEADERBOARD, {
      params: { period, page },
    });
  },

  // Dohvati sve dostupne bedževe (katalog)
  getAllBadges: () => {
    return Api.get(GET_ALL_BADGES);
  },

  // Dohvati historiju points-ova
  getPointsHistory: ({ page = 1 } = {}) => {
    return Api.get(GET_POINTS_HISTORY, {
      params: { page },
    });
  },
};

// ============================================
// MEMBERSHIP API
// ============================================
export const membershipApi = {
  // Dohvati membership status korisnika
  getUserMembership: ({ user_id } = {}) => {
    return Api.get(GET_USER_MEMBERSHIP, {
      params: { user_id },
    });
  },

  // Dohvati sve dostupne membership tier-ove (Pro, Shop pakete)
  getMembershipTiers: () => {
    return Api.get(GET_MEMBERSHIP_TIERS);
  },

  // Upgrade na Pro ili Shop membership
  upgradeMembership: ({ tier_id, payment_method } = {}) => {
    const formData = new FormData();
    if (tier_id) formData.append("tier_id", tier_id);
    if (payment_method) formData.append("payment_method", payment_method);

    return Api.post(UPGRADE_MEMBERSHIP, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Cancel membership
  cancelMembership: () => {
    return Api.post(CANCEL_MEMBERSHIP);
  },
};

// ============================================
// ITEM QUESTIONS API (Javna pitanja na oglasima)
// ============================================
export const ITEM_QUESTIONS = "item-questions";
export const ADD_QUESTION = "add-question";
export const ANSWER_QUESTION = "answer-question";
export const LIKE_QUESTION = "like-question";
export const DELETE_QUESTION = "delete-question";
export const REPORT_QUESTION = "report-question";

export const itemQuestionsApi = {
  getQuestions: ({ item_id, page = 1 } = {}) => {
    return Api.get(ITEM_QUESTIONS, {
      params: { item_id, page },
    });
  },

  addQuestion: ({ item_id, question } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (question) formData.append("question", question);
    return Api.post(ADD_QUESTION, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  answerQuestion: ({ question_id, answer } = {}) => {
    const formData = new FormData();
    if (question_id) formData.append("question_id", question_id);
    if (answer) formData.append("answer", answer);
    return Api.post(ANSWER_QUESTION, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  likeQuestion: ({ question_id } = {}) => {
    const formData = new FormData();
    if (question_id) formData.append("question_id", question_id);
    return Api.post(LIKE_QUESTION, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteQuestion: ({ question_id } = {}) => {
    const formData = new FormData();
    if (question_id) formData.append("question_id", question_id);
    return Api.post(DELETE_QUESTION, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  reportQuestion: ({ question_id, reason } = {}) => {
    const formData = new FormData();
    if (question_id) formData.append("question_id", question_id);
    if (reason) formData.append("reason", reason);
    return Api.post(REPORT_QUESTION, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ============================================
// ITEM CONVERSATIONS API
// ============================================
export const CHECK_ITEM_CONVERSATION = "check-item-conversation";

export const itemConversationApi = {
  checkConversation: ({ item_id } = {}) => {
    return Api.get(CHECK_ITEM_CONVERSATION, {
      params: { item_id },
    });
  },
};

// ============================================
// SELLER SETTINGS API
// ============================================
 
export const sellerSettingsApi = {
  // Dohvati vlastite postavke (zahtjeva auth)
  getSettings: () => {
    return Api.get(GET_SELLER_SETTINGS);
  },
 
  // Dohvati javne postavke prodavača po user_id (bez auth)
  getPublicSettings: ({ user_id } = {}) => {
    return Api.get("get-public-seller-settings", {
      params: { user_id },
    });
  },
 
  updateSettings: ({
    show_phone,
    show_email,
    avatar_id,
    show_whatsapp,
    show_viber,
    whatsapp_number,
    viber_number,
    business_hours,
    response_time,
    accepts_offers,
    auto_reply_enabled,
    auto_reply_message,
    vacation_mode,
    vacation_message,
    preferred_contact_method,
    business_description,
    return_policy,
    shipping_info,
    social_facebook,
    social_instagram,
    social_tiktok,
    social_youtube,
    social_website,
  } = {}) => {
    const formData = new FormData();
 
    if (show_phone !== undefined) formData.append("show_phone", show_phone ? 1 : 0);
    if (avatar_id) formData.append("avatar_id", avatar_id);
    if (show_email !== undefined) formData.append("show_email", show_email ? 1 : 0);
    if (show_whatsapp !== undefined) formData.append("show_whatsapp", show_whatsapp ? 1 : 0);
    if (show_viber !== undefined) formData.append("show_viber", show_viber ? 1 : 0);
    if (whatsapp_number !== undefined) formData.append("whatsapp_number", whatsapp_number);
    if (viber_number !== undefined) formData.append("viber_number", viber_number);
    if (business_hours) formData.append("business_hours", JSON.stringify(business_hours));
    if (response_time) formData.append("response_time", response_time);
    if (accepts_offers !== undefined) formData.append("accepts_offers", accepts_offers ? 1 : 0);
    if (auto_reply_enabled !== undefined) formData.append("auto_reply_enabled", auto_reply_enabled ? 1 : 0);
    if (auto_reply_message !== undefined) formData.append("auto_reply_message", auto_reply_message);
    if (vacation_mode !== undefined) formData.append("vacation_mode", vacation_mode ? 1 : 0);
    if (vacation_message !== undefined) formData.append("vacation_message", vacation_message);
    if (preferred_contact_method) formData.append("preferred_contact_method", preferred_contact_method);
    if (business_description !== undefined) formData.append("business_description", business_description);
    if (return_policy !== undefined) formData.append("return_policy", return_policy);
    if (shipping_info !== undefined) formData.append("shipping_info", shipping_info);
    if (social_facebook !== undefined) formData.append("social_facebook", social_facebook);
    if (social_instagram !== undefined) formData.append("social_instagram", social_instagram);
    if (social_tiktok !== undefined) formData.append("social_tiktok", social_tiktok);
    if (social_youtube !== undefined) formData.append("social_youtube", social_youtube);
    if (social_website !== undefined) formData.append("social_website", social_website);
 
    return Api.post(UPDATE_SELLER_SETTINGS, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};


// ============================================
// INVENTORY & SALES API
// ============================================
export const ITEM_SALE = "item-sale";
export const MY_PURCHASES = "my-purchases";
export const ITEM_RESERVE = "item-reserve";
 
export const inventoryApi = {
  // Označi kao prodano s detaljima
  recordSale: ({ 
    item_id, 
    buyer_id, 
    quantity_sold, 
    sale_receipt, 
    sale_note,
    sale_price 
  } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (buyer_id) formData.append("buyer_id", buyer_id);
    if (quantity_sold) formData.append("quantity_sold", quantity_sold);
    if (sale_receipt) formData.append("sale_receipt", sale_receipt);
    if (sale_note) formData.append("sale_note", sale_note);
    if (sale_price) formData.append("sale_price", sale_price);
 
    return Api.post(ITEM_SALE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
 
  // Rezerviši artikal
  reserveItem: ({ item_id, reserved_for_user_id, reservation_note } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    if (reserved_for_user_id) formData.append("reserved_for_user_id", reserved_for_user_id);
    if (reservation_note) formData.append("reservation_note", reservation_note);
 
    return Api.post(ITEM_RESERVE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
 
  // Ukloni rezervaciju
  removeReservation: ({ item_id } = {}) => {
    const formData = new FormData();
    if (item_id) formData.append("item_id", item_id);
    formData.append("remove_reservation", 1);
 
    return Api.post(ITEM_RESERVE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
 
export const myPurchasesApi = {
  // Dohvati kupovine korisnika
  getPurchases: ({ page = 1, status } = {}) => {
    return Api.get(MY_PURCHASES, {
      params: { page, status },
    });
  },
 
  // Dohvati detalj kupovine
  getPurchaseDetail: ({ sale_id } = {}) => {
    return Api.get(`${MY_PURCHASES}/${sale_id}`);
  },
};