"use client";
import { useSelector, useDispatch } from "react-redux";
import { selectCompareList, clearCompare, removeFromCompare } from "@/redux/reducer/compareSlice";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IoCloseCircleOutline, IoGitCompareOutline } from "react-icons/io5";
import CustomImage from "@/components/Common/CustomImage";

const CompareFloatingBar = () => {
  const list = useSelector(selectCompareList);
  const dispatch = useDispatch();

  if (!list || list.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-white dark:bg-slate-800 p-3 px-5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-slate-700 flex items-center gap-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <span className="bg-blue-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
               {list.length}
             </span>
             <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 hidden sm:block">Usporedba</span>
          </div>

          <div className="flex -space-x-3">
            {list.map((item) => (
              <div key={item.id} className="relative group w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden bg-gray-100">
                <CustomImage 
                  src={item.image} 
                  width={32} 
                  height={32} 
                  className="object-cover w-full h-full" 
                  alt="compare item"
                />
                <button 
                  onClick={() => dispatch(removeFromCompare(item.id))}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <IoCloseCircleOutline className="text-white" size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700" />

        <div className="flex items-center gap-3">
          <button 
            onClick={() => dispatch(clearCompare())}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors font-medium"
          >
            Očisti
          </button>
          
          <Link href="/compare">
            <button className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95">
              <IoGitCompareOutline size={14} />
              Usporedi
            </button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CompareFloatingBar;