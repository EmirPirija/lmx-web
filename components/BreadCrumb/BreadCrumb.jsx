"use client";

import { Fragment } from "react";
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
          const shouldBeLink = !isLast || !crumb.isCurrent;

          return {
            title: crumb.name,
            key: `crumb-${index}`,
            href: crumb?.slug,
            isLink: shouldBeLink,
            isAllCategories: crumb.isAllCategories,
            onClick: shouldBeLink
              ? (e) => {
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
                }
              : undefined,
          };
        })
      : []),
  ];

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="container py-2 sm:py-3">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <Breadcrumb>
            <BreadcrumbList className="flex min-w-max flex-nowrap items-center gap-1.5">
              {items?.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                  <Fragment key={item.key ?? index}>
                    <BreadcrumbItem>
                      {item.isLink && item.onClick ? (
                        <BreadcrumbLink
                          href="#"
                          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                          onClick={(e) => {
                            e.preventDefault();
                            item.onClick(e);
                          }}
                        >
                          {item.isHome ? (
                            <Home className="h-3.5 w-3.5 shrink-0" />
                          ) : null}
                          <span className={item.isHome ? "hidden sm:inline" : ""}>
                            {item.title}
                          </span>
                        </BreadcrumbLink>
                      ) : item.isLink ? (
                        <CustomLink
                          href={item?.href || "/"}
                          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                        >
                          {item.isHome ? (
                            <Home className="h-3.5 w-3.5 shrink-0" />
                          ) : null}
                          <span className={item.isHome ? "hidden sm:inline" : ""}>
                            {item.title}
                          </span>
                        </CustomLink>
                      ) : (
                        <span className="inline-flex items-center rounded-md px-1.5 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </span>
                      )}
                    </BreadcrumbItem>

                    {!isLast ? (
                      <BreadcrumbSeparator className="shrink-0">
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                      </BreadcrumbSeparator>
                    ) : null}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </>
  );
};

export default BreadCrumb;
