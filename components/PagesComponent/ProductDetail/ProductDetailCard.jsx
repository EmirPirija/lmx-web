import {
  formatDateMonthYear,
  formatPriceAbbreviated,
  formatSalaryRange,
} from "@/utils/index";
import { 
  MdFavorite, 
  MdFavoriteBorder, 
  MdCalendarToday,
  MdVisibility,
  MdStar
} from "react-icons/md";
import { manageFavouriteApi } from "@/utils/api";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { getIsLoggedIn } from "@/redux/reducer/authSlice";
import { useSelector, useDispatch } from "react-redux";
import { getCompanyName } from "@/redux/reducer/settingSlice";
import ShareDropdown from "@/components/Common/ShareDropdown";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { cn } from "@/lib/utils";
 
// Formatiranje cijene na bosanski način
const formatBosnianPrice = (price) => {
  if (!price || price === 0) return "Besplatno";
  return new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' KM';
};
 
// Formatiranje plate za poslove
const formatBosnianSalary = (min, max) => {
  if (!min && !max) return "Po dogovoru";
  const formatNum = (num) => new Intl.NumberFormat('bs-BA').format(num);
  if (min && max) return `${formatNum(min)} - ${formatNum(max)} KM`;
  if (min) return `Od ${formatNum(min)} KM`;
  return `Do ${formatNum(max)} KM`;
};
 
// Formatiranje datuma na bosanski
const formatBosnianDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate();
  const months = [
    "januar", "februar", "mart", "april", "maj", "juni",
    "juli", "august", "septembar", "oktobar", "novembar", "decembar"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}. ${month} ${year}`;
};
 
const ProductDetailCard = ({ productDetails, setProductDetails }) => {
  const dispatch = useDispatch();
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
      dispatch(setIsLoginOpen(true));
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
        
        if (!productDetails?.is_liked) {
          toast.success("Dodano u omiljene");
        } else {
          toast.success("Uklonjeno iz omiljenih");
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Greška pri ažuriranju omiljenih");
    }
  };
 
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 lg:p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      
      {/* Featured badge */}
      {productDetails?.is_feature === 1 && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1.5 shadow-sm">
            <MdStar className="text-sm" />
            Istaknut
          </div>
        </div>
      )}
      
      {/* NASLOV I CIJENA */}
      <div className="flex flex-col gap-2 mb-5">
        
        {/* Kategorija Badge */}
        {productDetails?.category?.name && (
          <span className="w-fit px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            {productDetails?.category?.name}
          </span>
        )}
 
        {/* Naslov */}
        <h1
          className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight break-words"
          title={productName}
        >
          {productName}
        </h1>
 
        {/* Cijena */}
        <h2
          className="text-2xl lg:text-3xl font-black text-primary tracking-tight mt-1"
          title={
            isJobCategory
              ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
              : formatBosnianPrice(productDetails?.price)
          }
        >
          {isJobCategory
            ? formatBosnianSalary(productDetails?.min_salary, productDetails?.max_salary)
            : formatBosnianPrice(productDetails?.price)}
        </h2>
      </div>
 
      {/* STATISTIKA */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Datum objave */}
        <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
          <MdCalendarToday className="text-slate-400" />
          <span className="font-medium">{formatBosnianDate(productDetails?.created_at)}</span>
        </div>
        
        {/* Pregledi */}
        {productDetails?.clicks > 0 && (
          <div className="flex items-center gap-2 text-slate-500 text-sm bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
            <MdVisibility className="text-slate-400" />
            <span className="font-medium">{productDetails?.clicks} pregleda</span>
          </div>
        )}
      </div>
 
      {/* RAZDJELNIK */}
      <div className="h-px w-full bg-slate-100 mb-5"></div>
 
      {/* AKCIJE */}
      <div className="flex items-center justify-between">
        
        {/* ID oglasa */}
        <div className="text-xs text-slate-400 font-medium">
          ID: #{productDetails?.id}
        </div>
 
        {/* Dugmad za akcije */}
        <div className="flex items-center gap-2">
          
          {/* Dijeli */}
          <div className="relative">
            <ShareDropdown
              url={currentUrl}
              title={FbTitle}
              headline={headline}
              companyName={CompanyName}
              className="rounded-full size-11 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
            />
          </div>
 
          {/* Omiljeni */}
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