import {
  formatDateMonthYear,
  formatPriceAbbreviated,
  formatSalaryRange,
  t,
} from "@/utils/index";
import { 
  MdFavorite, 
  MdFavoriteBorder, 
  MdCalendarToday,
  MdShare 
} from "react-icons/md";
import { manageFavouriteApi } from "@/utils/api";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { useSelector } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { cn } from "@/lib/utils";

const ProductDetailCard = ({ productDetails, setProductDetails }) => {
  const path = usePathname();
  const currentUrl = `${process.env.NEXT_PUBLIC_WEB_URL}${path}`;
  const translated_item = productDetails?.translated_item;
  const isLoggedIn = useSelector(getIsLoggedIn);
  const CompanyName = useSelector(getCompanyName);
  
  const productName = translated_item?.name || productDetails?.name;
  const FbTitle = productName + " | " + CompanyName;
  const headline = `🚀 Pogledaj ovu odličnu ponudu! "${productName}" na ${CompanyName}.`;

  const isJobCategory = Number(productDetails?.category?.is_job_category) === 1;

  const handleLikeItem = async () => {
    if (!isLoggedIn) {
      setIsLoginOpen(true);
      return;
    }
    try {
      const response = await manageFavouriteApi.manageFavouriteApi({
        item_id: productDetails?.id,
      });
      if (response?.data?.error === false) {
        setProductDetails((prev) => ({
          ...prev,
          is_liked: !productDetails?.is_liked,
        }));
        
        // Prikazujemo različitu poruku ovisno o akciji
        if (!productDetails?.is_liked) {
            toast.success("Dodano u omiljene");
        } else {
            toast.success("Uklonjeno iz omiljenih");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      
      {/* --- TITLE & PRICE SECTION --- */}
      <div className="flex flex-col gap-3 mb-6">
        
        {/* Category Badge (Optional - ako želiš prikazati kategoriju) */}
        {productDetails?.category?.name && (
            <span className="w-fit px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                {productDetails?.category?.name}
            </span>
        )}

        <h1
          className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight break-words"
          title={productName}
        >
          {productName}
        </h1>

        <h2
          className="text-3xl sm:text-4xl font-black text-primary tracking-tight mt-1"
          title={
            isJobCategory
              ? formatSalaryRange(productDetails?.min_salary, productDetails?.max_salary)
              : formatPriceAbbreviated(productDetails?.price)
          }
        >
          {isJobCategory
            ? formatSalaryRange(productDetails?.min_salary, productDetails?.max_salary)
            : formatPriceAbbreviated(productDetails?.price)}
        </h2>
      </div>

      {/* --- DIVIDER --- */}
      <div className="h-px w-full bg-slate-100 mb-5"></div>

      {/* --- FOOTER ACTIONS --- */}
      <div className="flex items-center justify-between">
        
        {/* Date Posted */}
        <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <MdCalendarToday className="text-slate-400" />
          <span className="font-medium">
             Objavljeno: {formatDateMonthYear(productDetails?.created_at)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          
          {/* Share Button Wrapper */}
          <div className="relative">
             <ShareDropdown
                url={currentUrl}
                title={FbTitle}
                headline={headline}
                companyName={CompanyName}
                className="rounded-full size-11 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
            />
          </div>

          {/* Like Button */}
          <button
            className={cn(
                "rounded-full size-11 flex items-center justify-center border transition-all shadow-sm active:scale-90",
                productDetails?.is_liked 
                    ? "bg-red-50 border-red-200 text-red-500" 
                    : "bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
            )}
            onClick={handleLikeItem}
            title={productDetails?.is_liked ? "Ukloni iz omiljenih" : "Dodaj u omiljene"}
          >
            {productDetails?.is_liked === true ? (
              <MdFavorite size={22} className="animate-in zoom-in duration-200" />
            ) : (
              <MdFavoriteBorder size={22} />
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default ProductDetailCard;