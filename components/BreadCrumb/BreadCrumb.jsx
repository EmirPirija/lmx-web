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

// ako koristiš clsx/cn negdje, možeš importati i to, ali nije obavezno

const BreadCrumb = ({ title2 }) => {
  const langCode = useSelector(getCurrentLangCode);
  const searchParams = useSearchParams();
  const BreadcrumbPath = useSelector(
    (state) => state.BreadcrumbPath.BreadcrumbPath
  );

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // mala odgoda da animacija bude “smooth”
    const timer = setTimeout(() => setIsVisible(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    {
      title: t("home"),
      key: "home",
      href: "/",
      isLink: true,
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
          return {
            title: crumb.name,
            key: index + 1,
            href: crumb?.slug,
            isLink: !isLast && !crumb.isCurrent,
            isAllCategories: crumb.isAllCategories,
            onClick: (e) => {
              e.preventDefault();

              // bazirano na tvom originalnom kodu
              const newSearchParams = new URLSearchParams(searchParams);

              if (crumb.isAllCategories) {
                // “Sve kategorije” → ukloni samo category, ostalo zadrži
                newSearchParams.delete("category");
              }

              // uvijek osiguraj lang param
              newSearchParams.set("lang", langCode);

              let targetUrl = crumb.slug || "/";

              // ako slug već ima query parametre, nemoj duplirati ?
              if (targetUrl.includes("?")) {
                // samo dodaj/override lang u postojeći query dio
                // najjednostavnije: dodaj &lang=...
                if (!targetUrl.includes("lang=")) {
                  targetUrl += `&lang=${langCode}`;
                }
              } else if (crumb.isAllCategories) {
                // ako je “Sve kategorije” i ideš na /ads, koristi konstruisane parametre
                targetUrl = `/ads?${newSearchParams.toString()}`;
              } else {
                // običan slučaj: samo dodaj lang
                targetUrl = `${targetUrl}?lang=${langCode}`;
              }

              window.history.pushState(null, "", targetUrl);
            },
          };
        })
      : []),
  ];

  return (
    <div
      className={[
        "bg-muted/80 border-b border-slate-100/60",
        "backdrop-blur-sm",
        "transition-all duration-300",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2",
      ].join(" ")}
    >
      <div className="container py-4">
        <Breadcrumb>
          <BreadcrumbList className="flex flex-wrap gap-1 text-sm">
            {items?.map((item, index) => {
              const delay = `${index * 60}ms`;
              const isLast = index === items.length - 1;

              return (
                <Fragment key={item.key ?? index}>
                  <BreadcrumbItem
                    style={{ transitionDelay: delay }}
                    className={[
                      "transition-all duration-300",
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-1",
                    ].join(" ")}
                  >
                    {item.isLink && item.onClick ? (
                      <BreadcrumbLink
                        href="#"
                        className="text-slate-600 hover:text-black font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          item.onClick(e);
                        }}
                      >
                        {item.title}
                      </BreadcrumbLink>
                    ) : item.isLink ? (
                      <CustomLink href={item?.href || "/"} passHref>
                        <BreadcrumbLink
                          asChild
                          className="text-slate-600 hover:text-black font-medium"
                        >
                          <span>{item.title}</span>
                        </BreadcrumbLink>
                      </CustomLink>
                    ) : (
                      <p className="text-slate-900 font-semibold truncate max-w-[180px]">
                        {item.title}
                      </p>
                    )}
                  </BreadcrumbItem>

                  {!isLast && (
                    <BreadcrumbSeparator className="text-slate-300">
                      /
                    </BreadcrumbSeparator>
                  )}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default BreadCrumb;
