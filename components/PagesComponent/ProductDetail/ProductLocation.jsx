import { IoLocationOutline } from "react-icons/io5";
import { MdOpenInNew, MdMap } from "react-icons/md";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Location/Map"), {
  ssr: false,
});

const ProductLocation = ({ productDetails }) => {
  const handleShowMapClick = () => {
    const locationQuery = `${
      productDetails?.translated_item?.address || productDetails?.address
    }`;
    const googleMapsUrl = `https://www.google.com/maps?q=${locationQuery}&ll=${productDetails?.latitude},${productDetails?.longitude}&z=12&t=m`;
    window.open(googleMapsUrl, "_blank");
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <MdMap className="text-slate-600 text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Lokacija oglasa</h3>
            <p className="text-xs text-slate-500">Gdje se nalazi artikal</p>
          </div>
        </div>
      </div>

      {/* Sadržaj */}
      <div className="flex flex-col p-4 lg:p-5 gap-4">
        {/* Adresa */}
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
            <IoLocationOutline size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Adresa</p>
            <p className="text-sm font-medium text-slate-700 break-words leading-relaxed">
              {productDetails?.translated_address || productDetails?.address || "Lokacija nije specificirana"}
            </p>
          </div>
        </div>

        {/* Mapa */}
        <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm">
          <Map
            latitude={productDetails?.latitude}
            longitude={productDetails?.longitude}
          />
        </div>

        {/* Dugme za Google Maps */}
        <button
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm"
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
