"use client";

import React from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeftRight, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import CustomImage from "@/components/Common/CustomImage";

import { cn } from "@/lib/utils";
import { clearCompare, removeFromCompare, selectCompareList } from "@/redux/reducer/compareSlice";

// ============================================
// COMPARE FLOATING BAR
// ============================================

const CompareFloatingBar = () => {
  const list = useSelector(selectCompareList);
  const dispatch = useDispatch();

  const hasItems = Array.isArray(list) && list.length > 0;
  if (!hasItems) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 28, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-0 bottom-4 z-[999] px-4"
      >
        <div
          className={cn(
            "mx-auto w-full max-w-3xl",
            "bg-white rounded-xl border border-slate-200 shadow-sm",
            "px-3 py-3 sm:px-4",
            "flex items-center justify-between gap-3"
          )}
        >
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                {list.length}
              </span>
              <span className="text-sm font-semibold text-slate-900 hidden sm:block">Usporedba</span>
            </div>

            <div className="flex items-center -space-x-2 overflow-hidden">
              {list.map((item) => (
                <div
                  key={item?.id}
                  className={cn(
                    "relative group",
                    "w-9 h-9 rounded-lg overflow-hidden",
                    "bg-slate-50 border border-slate-200"
                  )}
                  title={item?.title || ""}
                >
                  <CustomImage
                    src={item?.image}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                    alt={item?.title || "compare item"}
                  />

                  <button
                    type="button"
                    onClick={() => dispatch(removeFromCompare(item?.id))}
                    className={cn(
                      "absolute inset-0",
                      "bg-slate-900/60 backdrop-blur-[1px]",
                      "flex items-center justify-center",
                      "opacity-0 group-hover:opacity-100 transition-opacity"
                    )}
                    aria-label="Ukloni iz usporedbe"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => dispatch(clearCompare())}
              className={cn(
                "h-9 px-3 rounded-lg text-xs font-semibold",
                "text-slate-600 hover:text-red-600",
                "hover:bg-red-50"
              )}
            >
              Očisti
            </Button>

            <Button asChild size="sm" className="h-9 rounded-lg text-xs font-semibold gap-2">
              <Link href="/compare">
                <ArrowLeftRight className="w-4 h-4" />
                Usporedi
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareFloatingBar;
