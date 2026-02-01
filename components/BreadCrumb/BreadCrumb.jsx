"use client";

import { Fragment, useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSelector } from "react-redux";
import { t } from "@/utils";
import { useSearchParams } from "next/navigation";
import CustomLink from "@/components/Common/CustomLink";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { ChevronRight, Home } from "lucide-react";

const BreadCrumb = ({ title2 }) => {
  const langCode = useSelector(getCurrentLangCode);
  const searchParams = useSearchParams();
  const BreadcrumbPath = useSelector(
    (state) => state.BreadcrumbPath.BreadcrumbPath
  );

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    {
      title: t("home"),
      key: "home",
      href: "/",
      isLink: true,
      isHome: true,
    },
    ...(title2
      ? [
          {
            title: title2,
            key: "custom",
            isLink: false,
          },
        ]
      : BreadcrumbPath && BreadcrumbPath.length > 0
      ? BreadcrumbPath.map((crumb, index) => {
          const isLast = index === BreadcrumbPath.length - 1;
          // Stavka je link ako NIJE zadnja ili ako eksplicitno nije current
          const shouldBeLink = !isLast || !crumb.isCurrent;
          
          return {
            title: crumb.name,
            key: `crumb-${index}`,
            href: crumb?.slug,
            isLink: shouldBeLink,
            isAllCategories: crumb.isAllCategories,
            onClick: shouldBeLink ? (e) => {
              e.preventDefault();

              const newSearchParams = new URLSearchParams(searchParams);

              if (crumb.isAllCategories) {
                newSearchParams.delete("category");
              }

              newSearchParams.set("lang", langCode);

              let targetUrl = crumb.slug || "/";

              if (targetUrl.includes("?")) {
                if (!targetUrl.includes("lang=")) {
                  targetUrl += `&lang=${langCode}`;
                }
              } else if (crumb.isAllCategories) {
                targetUrl = `/ads?${newSearchParams.toString()}`;
              } else {
                targetUrl = `${targetUrl}?lang=${langCode}`;
              }

              window.history.pushState(null, "", targetUrl);
            } : undefined,
          };
        })
      : []),
  ];

  return (
    <>
      {/* Custom scrollbar hiding styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div
        className={`
          relative overflow-hidden
          bg-gradient-to-r from-slate-50 via-white to-slate-50
          border-b border-slate-200/70
          shadow-sm
          transition-all duration-500 ease-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}
        `}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="container relative py-3 sm:py-4">
          {/* Wrapper za horizontal scroll na mobilnom */}
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <Breadcrumb>
              <BreadcrumbList className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 sm:gap-2 min-w-max sm:min-w-0">
                {items?.map((item, index) => {
                  const delay = `${index * 50}ms`;
                  const isLast = index === items.length - 1;

                  return (
                    <Fragment key={item.key ?? index}>
                      <BreadcrumbItem
                        style={{ transitionDelay: delay }}
                        className={`
                          transition-all duration-400 ease-out
                          ${isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}
                        `}
                      >
                        {item.isLink && item.onClick ? (
                          <BreadcrumbLink
                            href="#"
                            className={`
                              group inline-flex items-center gap-1.5
                              px-2 py-1 rounded-md
                              text-xs sm:text-sm font-medium
                              transition-all duration-200
                              whitespace-nowrap
                              ${item.isHome 
                                ? "text-slate-700 hover:text-primary hover:bg-primary/5" 
                                : "text-slate-600 hover:text-primary hover:bg-primary/5"
                              }
                            `}
                            onClick={(e) => {
                              e.preventDefault();
                              item.onClick(e);
                            }}
                          >
                            {item.isHome && <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                            <span className={item.isHome ? "hidden sm:inline" : ""}>
                              {item.title}
                            </span>
                          </BreadcrumbLink>
                        ) : item.isLink ? (
                          <CustomLink href={item?.href || "/"} passHref>
                            <BreadcrumbLink
                              asChild
                              className={`
                                group inline-flex items-center gap-1.5
                                px-2 py-1 rounded-md
                                text-xs sm:text-sm font-medium
                                transition-all duration-200
                                whitespace-nowrap
                                ${item.isHome 
                                  ? "text-slate-700 hover:text-primary hover:bg-primary/5" 
                                  : "text-slate-600 hover:text-primary hover:bg-primary/5"
                                }
                              `}
                            >
                              <span>
                                {item.isHome && <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />}
                                <span className={item.isHome ? "hidden sm:inline" : ""}>
                                  {item.title}
                                </span>
                              </span>
                            </BreadcrumbLink>
                          </CustomLink>
                        ) : (
                          <div className="px-2 py-1">
                            <p className="text-slate-900 font-semibold text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[200px] md:max-w-[300px]">
                              {item.title}
                            </p>
                          </div>
                        )}
                      </BreadcrumbItem>

                      {!isLast && (
                        <BreadcrumbSeparator 
                          className={`
                            flex-shrink-0
                            transition-all duration-400
                            ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-0"}
                          `}
                          style={{ transitionDelay: delay }}
                        >
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                        </BreadcrumbSeparator>
                      )}
                    </Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Mobile scroll hint - gradient fade effect */}
          {items.length > 2 && (
            <div className="sm:hidden absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none" />
          )}
        </div>
      </div>
    </>
  );
};

export default BreadCrumb;