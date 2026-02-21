import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, ChevronDown, Grid3x3 } from "@/components/Common/UnifiedIconPack";
import { usePathname, useSearchParams } from "next/navigation";
import { t } from "@/utils";
import { useState } from "react";
import { useNavigate } from "../Common/useNavigate";
import useGetCategories from "../Layout/useGetCategories";
import CategoryNode from "./CategoryNode";

const FilterTree = ({ extraDetails }) => {
  const { navigate } = useNavigate();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const {
    getCategories,
    cateData,
    isCatLoading,
    isCatLoadMore,
    catCurrentPage,
    catLastPage,
  } = useGetCategories();
  const hasMore = catCurrentPage < catLastPage;

  const selectedSlug = searchParams.get("category") || "";
  const isSelected = !selectedSlug;

  const [expanded, setExpanded] = useState(true);

  const handleToggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  const handleClick = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    Object.keys(extraDetails || {})?.forEach((key) => {
      params.delete(key);
    });

    if (pathname.startsWith("/ads")) {
      window.history.pushState(null, "", `/ads?${params.toString()}`);
    } else {
      navigate(`/ads?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all group",
          isSelected
            ? "border-primary bg-primary/5 shadow-sm"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        )}
      >
        <button
          onClick={handleToggleExpand}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          {isCatLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <Grid3x3 className={cn("w-4 h-4", isSelected ? "text-primary" : "text-gray-400")} />

        <button
          onClick={handleClick}
          className={cn(
            "flex-1 text-left text-sm font-medium transition-colors",
            isSelected ? "text-primary" : "text-gray-700"
          )}
        >
          {"Sve kategorije"}
        </button>
      </div>

      {expanded && cateData.length > 0 && (
        <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-4">
          {cateData.map((category) => (
            <CategoryNode
              key={category.id + "filter-tree"}
              category={category}
              extraDetails={extraDetails}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => getCategories(catCurrentPage + 1)}
              disabled={isCatLoadMore}
              className="w-full py-2 px-3 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isCatLoadMore ? "Učitavanje..." : "Učitaj još"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterTree;