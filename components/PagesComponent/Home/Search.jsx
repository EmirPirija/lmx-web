// "use client";
// import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { useEffect, useState } from "react";
// import { useInView } from "react-intersection-observer";
// import { t } from "@/utils";
// import { BiPlanet } from "react-icons/bi";
// import { FaSearch } from "react-icons/fa";
// import { usePathname } from "next/navigation";
// import { useNavigate } from "@/components/Common/useNavigate";
// import useGetCategories from "@/components/Layout/useGetCategories";

// const Search = () => {
//   const {
//     cateData,
//     getCategories,
//     isCatLoadMore,
//     catLastPage,
//     catCurrentPage,
//   } = useGetCategories();

//   const pathname = usePathname();
//   const { navigate } = useNavigate();
//   const categoryList = [
//     { slug: "all-categories", translated_name: t("allCategories") },
//     ...cateData,
//   ];
//   const [open, setOpen] = useState(false);
//   const [value, setValue] = useState("all-categories");
//   const selectedItem = categoryList.find((item) => item.slug === value);
//   const hasMore = catCurrentPage < catLastPage;
//   const { ref, inView } = useInView();
//   const [searchQuery, setSearchQuery] = useState("");

//   useEffect(() => {
//     if (open && inView && hasMore && !isCatLoadMore) {
//       getCategories(catCurrentPage + 1);
//     }
//   }, [hasMore, inView, isCatLoadMore, open]);

//   const handleSearchNav = (e) => {
//     e.preventDefault();

//     const query = encodeURIComponent(searchQuery);

//     // Build the base URL with query and language
//     const baseUrl = `/ads?query=${query}`;

//     // Add category parameter if not "all-categories"
//     const url =
//       selectedItem?.slug === "all-categories"
//         ? baseUrl
//         : `/ads?category=${selectedItem?.slug}&query=${query}`;

//     // Use consistent navigation method
//     if (pathname === "/ads") {
//       // If already on ads page, use history API to avoid full page reload
//       window.history.pushState(null, "", url);
//     } else {
//       // If on different page, use router for navigation
//       navigate(url);
//     }
//   };

//   return (
//     <>
//       <Popover open={open} onOpenChange={setOpen}>
//         <PopoverTrigger asChild>
//           <Button
//             variant="outline"
//             role="combobox"
//             aria-expanded={open}
//             className="min-w-[125px] max-w-[125px] sm:min-w-[156px] sm:max-w-[156px] py-1 px-1.5 sm:py-2 sm:px-3 justify-between border-none hover:bg-transparent font-normal"
//           >
//             <span className="truncate">
//               {selectedItem?.translated_name || t("selectCat")}
//             </span>
//             <ChevronsUpDown className="opacity-50" />
//           </Button>
//         </PopoverTrigger>
//         <PopoverContent align="start" className="w-[200px] p-0">
//           <Command>
//             <CommandInput placeholder={t("searchACategory")} />
//             <CommandList>
//               <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
//               <CommandGroup>
//                 {categoryList.map((category, index) => {
//                   const isLast = open && index === categoryList.length - 1;
//                   return (
//                     <CommandItem
//                       key={category?.slug}
//                       value={category?.slug}
//                       onSelect={(currentValue) => {
//                         setValue(currentValue);
//                         setOpen(false);
//                       }}
//                       ref={isLast ? ref : null}
//                     >
//                       {category.translated_name || category?.name}
//                       <Check
//                         className={cn(
//                           "ml-auto",
//                           value === category.slug ? "opacity-100" : "opacity-0"
//                         )}
//                       />
//                     </CommandItem>
//                   );
//                 })}
//               </CommandGroup>
//               {isCatLoadMore && (
//                 <div className="flex justify-center items-center pb-2 text-muted-foreground">
//                   <Loader2 className="animate-spin" />
//                 </div>
//               )}
//             </CommandList>
//           </Command>
//         </PopoverContent>
//       </Popover>
//       <form
//         onSubmit={handleSearchNav}
//         className="w-full flex items-center gap-2 ltr:border-l rtl:border-r py-1 px-1.5 sm:py-2 sm:px-3"
//       >
//         <BiPlanet color="#595B6C" className="min-w-4 min-h-4" />
//         <input
//           type="text"
//           placeholder={t("searchAd")}
//           className="text-sm outline-none w-full"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//         />
//         <button
//           className="flex items-center gap-2 bg-primary text-white p-2 rounded"
//           type="submit"
//         >
//           <FaSearch size={14} />
//         </button>
//       </form>
//     </>
//   );
// };

// export default Search;


"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useInView } from "react-intersection-observer";
import { t } from "@/utils";
import { BiPlanet } from "react-icons/bi";
import { FaSearch } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { useNavigate } from "@/components/Common/useNavigate";
import useGetCategories from "@/components/Layout/useGetCategories";

const Search = () => {
  const {
    cateData,
    getCategories,
    isCatLoadMore,
    catLastPage,
    catCurrentPage,
  } = useGetCategories();

  const pathname = usePathname();
  const { navigate } = useNavigate();

  const categoryList = [
    { slug: "all-categories", translated_name: t("allCategories") },
    ...cateData,
  ];

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("all-categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const selectedItem = categoryList.find((item) => item.slug === value);
  const hasMore = catCurrentPage < catLastPage;

  const { ref, inView } = useInView();

  /* -------------------------------------------------------
     LOAD MORE CATEGORIES (DROPDOWN)
  ------------------------------------------------------- */
  useEffect(() => {
    if (open && inView && hasMore && !isCatLoadMore) {
      getCategories(catCurrentPage + 1);
    }
  }, [open, inView, hasMore, isCatLoadMore]);

  /* -------------------------------------------------------
     SEMANTIC AUTOCOMPLETE SEARCH
  ------------------------------------------------------- */
  const searchSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      const res = await fetch(
        `https://admin.lmx.ba/api/get-item?search=${encodeURIComponent(
          query
        )}&per_page=10`,
        { signal: abortControllerRef.current.signal }
      );

      if (!res.ok) return;

      const data = await res.json();
      const ads = data?.data?.data || [];

      // Extract direct categories only
      const map = new Map();
      ads.forEach((ad) => {
        if (ad.category) {
          map.set(ad.category.id, ad.category);
        }
      });

      setSuggestions(Array.from(map.values()).slice(0, 6));
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error("Autocomplete error", e);
      }
    } finally {
      setIsSearching(false);
    }
  };

  /* -------------------------------------------------------
     INPUT CHANGE (DEBOUNCED)
  ------------------------------------------------------- */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchSuggestions(value);
    }, 400);
  };

  /* -------------------------------------------------------
     FORM SUBMIT NAVIGATION
  ------------------------------------------------------- */
  const handleSearchNav = (e) => {
    e.preventDefault();

    const query = encodeURIComponent(searchQuery);

    const baseUrl = `/ads?query=${query}`;
    const url =
      selectedItem?.slug === "all-categories"
        ? baseUrl
        : `/ads?category=${selectedItem.slug}&query=${query}`;

    setSuggestions([]);

    if (pathname === "/ads") {
      window.history.pushState(null, "", url);
    } else {
      navigate(url);
    }
  };

  /* -------------------------------------------------------
     CLEANUP
  ------------------------------------------------------- */
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <>
      {/* CATEGORY SELECT */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="min-w-[125px] max-w-[125px] sm:min-w-[156px] sm:max-w-[156px] py-1 px-1.5 sm:py-2 sm:px-3 justify-between border-none hover:bg-transparent font-normal"
          >
            <span className="truncate">
              {selectedItem?.translated_name || t("selectCat")}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={t("searchACategory")} />
            <CommandList>
              <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
              <CommandGroup>
                {categoryList.map((category, index) => {
                  const isLast = open && index === categoryList.length - 1;
                  return (
                    <CommandItem
                      key={category.slug}
                      value={category.slug}
                      onSelect={(val) => {
                        setValue(val);
                        setOpen(false);
                      }}
                      ref={isLast ? ref : null}
                    >
                      {category.translated_name || category.name}
                      <Check
                        className={cn(
                          "ml-auto",
                          value === category.slug
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {isCatLoadMore && (
                <div className="flex justify-center items-center pb-2 text-muted-foreground">
                  <Loader2 className="animate-spin" />
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* SEARCH INPUT */}
      <form
        onSubmit={handleSearchNav}
        className="relative w-full flex items-center gap-2 ltr:border-l rtl:border-r py-1 px-1.5 sm:py-2 sm:px-3"
      >
        <BiPlanet color="#595B6C" className="min-w-4 min-h-4" />

        <input
          type="text"
          placeholder={t("searchAd")}
          className="text-sm outline-none w-full"
          value={searchQuery}
          onChange={handleInputChange}
        />

        <button
          className="flex items-center gap-2 bg-primary text-white p-2 rounded"
          type="submit"
        >
          <FaSearch size={14} />
        </button>

        {/* AUTOCOMPLETE */}
        {searchQuery.length >= 2 && (
          <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-50 mt-1">
            {isSearching ? (
              <div className="p-3 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 className="animate-spin w-4 h-4" />
                {t("loading")}
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((cat) => (
                <div
                  key={cat.id}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm"
                  onClick={() => {
                    navigate(
                      `/ads?category=${cat.slug}&query=${searchQuery}`
                    );
                    setSuggestions([]);
                  }}
                >
                  {cat.translated_name || cat.name}
                </div>
              ))
            ) : (
              <div className="p-3 text-sm text-gray-400">
                {t("noResults")}
              </div>
            )}
          </div>
        )}
      </form>
    </>
  );
};

export default Search;
