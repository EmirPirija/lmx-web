import { useMemo } from "react";
import { IoCopyOutline, IoLocationOutline } from "react-icons/io5";
import { MdDirections, MdMap, MdOpenInNew } from "react-icons/md";
import dynamic from "next/dynamic";
import { toast } from "sonner";

const Map = dynamic(() => import("@/components/Location/Map"), {
  ssr: false,
});

// Helper za dobijanje vrijednosti iz extra_details
const getExtraDetailValue = (extraDetails, keys) => {
  if (!extraDetails) return null;
  const details = typeof extraDetails === "string" ? JSON.parse(extraDetails) : extraDetails;
  for (const key of keys) {
    if (details?.[key]) return details[key];
  }
  return null;
};

const ProductLocation = ({ productDetails, onMapOpen }) => {
  const address =
    productDetails?.translated_address ||
    productDetails?.translated_item?.address ||
    productDetails?.address ||
    "";
  const hasCoordinates =
    Number.isFinite(Number(productDetails?.latitude)) &&
    Number.isFinite(Number(productDetails?.longitude));

  const addressParts = useMemo(() => {
    if (!address) return [];
    return address.split(",").map((part) => part.trim()).filter(Boolean);
  }, [address]);

  const cityLabel = addressParts[addressParts.length - 1] || "Nije dostupno";
  const areaLabel = addressParts.slice(0, 2).join(", ") || "Nije dostupno";

  const handleShowMapClick = () => {
    const locationQuery = address || "Bosna i Hercegovina";
    const googleMapsUrl = `https://www.google.com/maps?q=${locationQuery}&ll=${productDetails?.latitude},${productDetails?.longitude}&z=12&t=m`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleDirectionsClick = () => {
    const locationQuery = address || "Bosna i Hercegovina";
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      locationQuery
    )}&destination_place_id=&travelmode=driving`;
    window.open(googleMapsUrl, "_blank");
    if (onMapOpen) onMapOpen();
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Adresa je kopirana.");
    } catch (error) {
      console.error("Greška pri kopiranju adrese:", error);
      toast.error("Ne mogu kopirati adresu. Pokušaj ponovo.");
    }
  };

  // Prepare product data for the map marker popup
  const mapProductData = useMemo(() => {
    if (!productDetails) return null;

    // Get area from various sources
    const area = productDetails?.area ||
                 productDetails?.total_area ||
                 getExtraDetailValue(productDetails?.extra_details, ["povrsina", "quadrature", "m2", "area"]);

    // Get rooms from various sources
    const rooms = productDetails?.bedrooms ||
                  productDetails?.rooms ||
                  getExtraDetailValue(productDetails?.extra_details, ["broj_soba", "sobe", "rooms", "bedrooms"]);

    // Get room type from extra_details
    const roomType = getExtraDetailValue(productDetails?.extra_details, ["tip_stana", "room_type", "tip_nekretnine", "property_type"]);

    // Get image
    const image = productDetails?.image ||
                  productDetails?.gallery_images?.[0]?.image ||
                  productDetails?.gallery?.[0];

    return {
      title: productDetails?.translated_item?.name || productDetails?.name || productDetails?.title,
      price: parseFloat(productDetails?.price) || 0,
      image: image,
      area: area,
      rooms: rooms,
      roomType: roomType,
      createdAt: productDetails?.created_at,
    };
  }, [productDetails]);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <MdMap className="text-slate-600 dark:text-slate-300 text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Lokacija oglasa</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Provjeri adresu i isplaniraj dolazak</p>
            </div>
          </div>
          {hasCoordinates && (
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 border border-emerald-100 dark:border-emerald-800">
              Precizna lokacija
            </span>
          )}
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
              {address || "Lokacija nije specificirana"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                Grad: <span className="font-semibold">{cityLabel}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                Zona: <span className="font-semibold">{areaLabel}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mapa */}
        <div className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-100 dark:bg-slate-800 h-64 relative">
          <Map
            latitude={productDetails?.latitude}
            longitude={productDetails?.longitude}
            productData={mapProductData}
          />
          {hasCoordinates && (
            <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 rounded-lg px-3 py-2 shadow-sm">
              <p className="font-semibold text-slate-800 dark:text-slate-100">Koordinate</p>
              <p>
                {Number(productDetails?.latitude).toFixed(5)}, {Number(productDetails?.longitude).toFixed(5)}
              </p>
            </div>
          )}
        </div>

        {/* Dugme */}
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm"
            onClick={handleShowMapClick}
          >
            <MdOpenInNew className="text-lg" />
            Otvori mapu
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary-200 dark:hover:bg-primary/30 font-bold rounded-xl transition-all active:scale-[0.98] border border-primary/20"
            onClick={handleDirectionsClick}
          >
            <MdDirections className="text-lg" />
            Prikaži rutu
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200"
            onClick={handleCopyAddress}
          >
            <IoCopyOutline className="text-lg" />
            Kopiraj adresu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductLocation;
