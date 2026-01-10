import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const BudgetFilter = () => {
  const searchParams = useSearchParams();
  const [budget, setBudget] = useState({
    minPrice: searchParams.get("min_price") || "",
    maxPrice: searchParams.get("max_price") || "",
  });

  const { minPrice, maxPrice } = budget;

  useEffect(() => {
    setBudget({
      minPrice: searchParams.get("min_price") || "",
      maxPrice: searchParams.get("max_price") || "",
    });
  }, [searchParams]);

  const handleMinMaxPrice = () => {
    if (!minPrice && !maxPrice) return;
    const newSearchParams = new URLSearchParams(searchParams);
    if (minPrice) newSearchParams.set("min_price", minPrice);
    else newSearchParams.delete("min_price");
    if (maxPrice) newSearchParams.set("max_price", maxPrice);
    else newSearchParams.delete("max_price");
    window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          placeholder="Od"
          min={0}
          value={minPrice}
          onChange={(e) => setBudget((prev) => ({ ...prev, minPrice: e.target.value }))}
          onBlur={handleMinMaxPrice}
          onKeyDown={(e) => e.key === "Enter" && handleMinMaxPrice()}
          className="w-full px-2 py-1.5 text-sm rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
        />
        <input
          type="number"
          placeholder="Do"
          min={0}
          value={maxPrice}
          onChange={(e) => setBudget((prev) => ({ ...prev, maxPrice: e.target.value }))}
          onBlur={handleMinMaxPrice}
          onKeyDown={(e) => e.key === "Enter" && handleMinMaxPrice()}
          className="w-full px-2 py-1.5 text-sm rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
        />
      </div>
    </div>
  );
};

export default BudgetFilter;