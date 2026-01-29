import { IoLocationOutline } from "react-icons/io5";
import { MdOpenInNew, MdMap } from "react-icons/md";
import dynamic from "next/dynamic";
 
const Map = dynamic(() => import("@/components/Location/Map"), {
  ssr: false,
});
 
const ProductLocation = ({ productDetails, onMapOpen }) => {
  const handleShowMapClick = () => {
    const locationQuery = `${productDetails?.translated_item?.address || productDetails?.address}`;
    const googleMapsUrl = `https://www.google.com/maps?q=${locationQuery}&ll=${productDetails?.latitude},${productDetails?.longitude}&z=12&t=m`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };
 
  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      {/* Header */}
      <div className="bg-slate-50/50 dark:bg-slate-800/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <MdMap className="text-slate-600 dark:text-slate-300 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Lokacija oglasa</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gdje se nalazi artikal</p>
          </div>
        </div>
      </div>
 
      {/* Sadržaj */}
      <div className="flex flex-col p-4 lg:p-5 gap-4">
        {/* Adresa */}
        <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg mt-0.5 text-primary dark:text-primary-400">
            <IoLocationOutline size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Adresa</p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words leading-relaxed">
              {productDetails?.translated_address || productDetails?.address || "Lokacija nije specificirana"}
            </p>
          </div>
        </div>
 
        {/* Mapa */}
        <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-800 h-64 relative">
          <Map latitude={productDetails?.latitude} longitude={productDetails?.longitude} />
        </div>
 
        {/* Dugme */}
        <button
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm"
          onClick={handleShowMapClick}
        >
          <MdOpenInNew className="text-lg" />
          Prikaži na Google Maps
        </button>
      </div>
    </div>
  );
};
 
export default ProductLocation;