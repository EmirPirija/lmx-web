import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { getMaxRange, getMinRange } from "@/redux/reducer/settingSlice";
import { getIsRtl } from "@/redux/reducer/languageSlice";
import { MapPin } from "@/components/Common/UnifiedIconPack";
import { cn } from "@/lib/utils";

const RangeFilter = () => {
  const searchParams = useSearchParams();
  const isRTL = useSelector(getIsRtl);
  const kmRange = searchParams.get("km_range");
  const areaId = searchParams.get("areaId");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const min = useSelector(getMinRange);
  const max = useSelector(getMaxRange);
  const [value, setValue] = useState(kmRange || min);

  useEffect(() => {
    setValue(kmRange || min);
  }, [kmRange, min]);

  const handleRangeApply = () => {
    if (!areaId || !lat || !lng) return;
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("km_range", value);
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  const hasValidLocation = areaId && lat && lng;

  return (
    <div className="space-y-2">
      {!hasValidLocation && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">Odaberite područje</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Udaljenost</span>
        <span className="text-lg font-bold text-blue-600">{value} km</span>
      </div>
      <input
        type="range"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onMouseUp={handleRangeApply}
        onTouchEnd={handleRangeApply}
        max={max}
        min={min}
        step={1}
        dir={isRTL ? "rtl" : "ltr"}
        disabled={!hasValidLocation}
        className={cn("w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb", !hasValidLocation && "opacity-50")}
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{min} km</span>
        <span>{max} km</span>
      </div>
    </div>
  );
};

export default RangeFilter;