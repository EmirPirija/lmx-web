"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ProductCard from "@/components/Common/ProductCard";
import AllItemsSkeleton from "@/components/PagesComponent/Home/AllItemsSkeleton";
import { CurrentLanguageData } from "@/redux/reducer/languageSlice";
import { allItemApi } from "@/utils/api";
import { getScarcityCopy, getScarcityState } from "@/utils/scarcity";
import { AlertCircle } from "@/components/Common/UnifiedIconPack";

const buildLocationParams = ({ cityData, KmRange }) => {
  const params = {};

  if (Number(KmRange) > 0 && (cityData?.areaId || cityData?.city)) {
    params.radius = KmRange;
    params.latitude = cityData.lat;
    params.longitude = cityData.long;
    return params;
  }

  if (cityData?.areaId) {
    params.area_id = cityData.areaId;
  } else if (cityData?.city) {
    params.city = cityData.city;
  } else if (cityData?.state) {
    params.state = cityData.state;
  } else if (cityData?.country) {
    params.country = cityData.country;
  }

  return params;
};

const extractItems = (response) => {
  const payload = response?.data?.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const sortScarcityItems = (items = []) => {
  return [...items].sort((left, right) => {
    const a = getScarcityState(left);
    const b = getScarcityState(right);

    if (a.isLastUnits !== b.isLastUnits) {
      return a.isLastUnits ? -1 : 1;
    }

    if (a.inventoryCount !== b.inventoryCount) {
      return Number(a.inventoryCount || 0) - Number(b.inventoryCount || 0);
    }

    return Number(b.popularity?.views || 0) - Number(a.popularity?.views || 0);
  });
};

const LowInventoryItems = ({ cityData, KmRange }) => {
  const currentLanguage = useSelector(CurrentLanguageData);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchLowInventoryItems = async () => {
      setLoading(true);
      try {
        const locationParams = buildLocationParams({ cityData, KmRange });

        const response = await allItemApi.getItems({
          ...locationParams,
          current_page: "home",
          page: 1,
          limit: 120,
          sort_by: "new-to-old",
          scarcity_enabled: 1,
          low_inventory_only: 1,
          no_cache: true,
        });

        if (cancelled) return;

        const rows = extractItems(response);
        const eligible = rows.filter((entry) => {
          const state = getScarcityState(entry);
          return state.isEligible && !state.isOutOfStock;
        });

        const sorted = sortScarcityItems(eligible).slice(0, 10);
        setItems(sorted);
      } catch (error) {
        console.error("Greška pri učitavanju sekcije do isteka zaliha:", error);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLowInventoryItems();

    return () => {
      cancelled = true;
    };
  }, [cityData?.areaId, cityData?.city, cityData?.country, cityData?.lat, cityData?.long, cityData?.state, KmRange, currentLanguage?.id]);

  const hasItems = items.length > 0;
  const sectionSubtitle = useMemo(() => {
    if (!hasItems) {
      return "Prikazat ćemo oglase kada prodavači označe nisku zalihu i stvarno imaju malo komada na stanju.";
    }

    const lastUnitsCount = items.filter((entry) => getScarcityState(entry).isLastUnits).length;
    if (lastUnitsCount > 0) {
      return `${lastUnitsCount} oglasa je u režimu posljednjih komada.`;
    }

    return "Oglasi sa potvrđenom niskom zalihom i aktivnom ponudom do isteka.";
  }, [hasItems, items]);

  return (
    <section className="container mt-12">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h5 className="text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">Do isteka zaliha</h5>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sectionSubtitle}</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle className="h-3.5 w-3.5" />
          Automatski prikaz prema stvarnoj zalihi
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 xl:grid-cols-4">
        {loading ? (
          <AllItemsSkeleton />
        ) : hasItems ? (
          items.map((item) => {
            const scarcityState = getScarcityState(item);
            const scarcityCopy = getScarcityCopy(scarcityState);
            return (
              <ProductCard
                key={item?.id}
                item={item}
                showScarcityMeta
                scarcityCopy={scarcityCopy}
                trackingParams={{ ref: "scarcity", source_detail: "home_low_stock" }}
              />
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
            Trenutno nema oglasa koji ispunjavaju uslove za sekciju "Do isteka zaliha".
          </div>
        )}
      </div>
    </section>
  );
};

export default LowInventoryItems;
