import { cn } from "@/lib/utils";
import { t } from "@/utils";
import { categoryApi } from "@/utils/api";
import { Loader2, ChevronRight, ChevronDown, Tag } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { BreadcrumbPathData } from "@/redux/reducer/breadCrumbSlice";
import { useNavigate } from "../Common/useNavigate";

const CategoryNode = ({ category, extraDetails }) => {
  const { navigate } = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const breadcrumbPath = useSelector(BreadcrumbPathData);

  const selectedSlug = searchParams.get("category") || "";
  const isSelected = category.slug === selectedSlug;

  const shouldExpand = useMemo(() => {
    if (!Array.isArray(breadcrumbPath) || breadcrumbPath.length <= 2)
      return false;
    const keysToCheck = breadcrumbPath.slice(1, -1).map((crumb) => crumb.key);
    return keysToCheck.includes(category.slug);
  }, [breadcrumbPath, category.slug]);

  useEffect(() => {
    if (shouldExpand && !expanded) {
      setExpanded(true);
      fetchSubcategories();
    }
  }, [shouldExpand]);

  const fetchSubcategories = async (page = 1, append = false) => {
    setIsLoading(true);
    try {
      const response = await categoryApi.getCategory({
        category_id: category.id,
        page,
      });
      const data = response.data.data.data;
      const hasMore =
        response.data.data.last_page > response.data.data.current_page;
      setSubcategories((prev) => (append ? [...prev, ...data] : data));
      setHasMore(hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExpand = async () => {
    if (!expanded && subcategories.length === 0) {
      await fetchSubcategories();
    }
    setExpanded((prev) => !prev);
  };

  const handleClick = () => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("category", category.slug);
    Object.keys(extraDetails || {}).forEach((key) => {
      newSearchParams.delete(key);
    });
    if (pathname.startsWith("/ads")) {
      window.history.pushState(null, "", `/ads?${newSearchParams.toString()}`);
    } else {
      navigate(`/ads?${newSearchParams.toString()}`);
    }
  };

  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchSubcategories(nextPage, true);
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg transition-all group",
          isSelected
            ? "bg-primary/10 border-2 border-primary"
            : "hover:bg-gray-50 border-2 border-transparent"
        )}
      >
        {category.subcategories_count > 0 && (
          <button
            onClick={handleToggleExpand}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
            ) : expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>
        )}

        <Tag
          className={cn(
            "w-3.5 h-3.5 flex-shrink-0",
            isSelected ? "text-primary" : "text-gray-400"
          )}
        />

        <button
          onClick={handleClick}
          className={cn(
            "flex-1 text-left text-sm font-medium transition-colors flex items-center justify-between gap-2",
            isSelected ? "text-primary" : "text-gray-700 group-hover:text-gray-900"
          )}
        >
          <span className="break-all">{category.translated_name}</span>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              isSelected
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
            )}
          >
            {category.all_items_count}
          </span>
        </button>
      </div>

      {expanded && subcategories.length > 0 && (
        <div className="ml-6 space-y-1 border-l-2 border-gray-200 pl-4">
          {subcategories.map((sub) => (
            <CategoryNode
              key={sub.id + "filter-tree"}
              category={sub}
              extraDetails={extraDetails}
            />
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-2 px-3 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {t("loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryNode;