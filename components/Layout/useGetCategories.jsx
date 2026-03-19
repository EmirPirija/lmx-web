import { useDispatch, useSelector } from "react-redux";
import {
  CategoryData,
  getCatCurrentPage,
  getCatLastPage,
  getIsCatLoading,
  getIsCatLoadMore,
  setCatCurrentPage,
  setCateData,
  setCatLastPage,
  setIsCatLoading,
  setIsCatLoadMore,
} from "@/redux/reducer/categorySlice";
import { categoryApi } from "@/utils/api"; // assume you have this
import { useCallback, useEffect } from "react";
import {
  getHasFetchedCategories,
  setHasFetchedCategories,
} from "@/utils/getFetcherStatus";

const useGetCategories = () => {
  const dispatch = useDispatch();
  const cateData = useSelector(CategoryData);
  const isCatLoading = useSelector(getIsCatLoading);
  const isCatLoadMore = useSelector(getIsCatLoadMore);
  const catLastPage = useSelector(getCatLastPage);
  const catCurrentPage = useSelector(getCatCurrentPage);
  const hasCategorySeed = Array.isArray(cateData) && cateData.length > 0;

  useEffect(() => {
    if (hasCategorySeed && !getHasFetchedCategories()) {
      setHasFetchedCategories(true);
    }
  }, [hasCategorySeed]);

  const getCategories = useCallback(
    async (page = 1, options = {}) => {
      const {
        per_page = 18,
        include_counts = true,
        tree_depth = 0,
        force = false,
      } = options || {};

      if (page === 1 && !force && (getHasFetchedCategories() || hasCategorySeed)) {
        return;
      }

      if (page === 1) {
        dispatch(setIsCatLoading(true));
      } else {
        dispatch(setIsCatLoadMore(true));
      }
      try {
        const res = await categoryApi.getCategory({
          page,
          per_page,
          include_counts,
          tree_depth,
        });
        if (res?.data?.error === false) {
          const data = Array.isArray(res?.data?.data?.data)
            ? res.data.data.data
            : [];
          if (page === 1) {
            dispatch(setCateData(data));
          } else {
            dispatch(setCateData([...cateData, ...data]));
          }
          dispatch(setCatCurrentPage(res?.data?.data?.current_page));
          dispatch(setCatLastPage(res?.data?.data?.last_page));
          setHasFetchedCategories(true);
        }
      } catch (error) {

      } finally {
        dispatch(setIsCatLoading(false));
        dispatch(setIsCatLoadMore(false));
      }
    },
    [cateData, dispatch, hasCategorySeed]
  );

  return {
    getCategories,
    isCatLoading,
    cateData,
    isCatLoadMore,
    catLastPage,
    catCurrentPage,
  };
};

export default useGetCategories;
