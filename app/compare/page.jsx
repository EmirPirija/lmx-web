"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCompareList, removeFromCompare, clearCompare } from "@/redux/reducer/compareSlice";
import { allItemApi } from "@/utils/api";
import { 
  IoTrashOutline, 
  IoCheckmarkCircle, 
  IoCloseCircle,
  IoPrintOutline,
  IoShareSocialOutline,
  IoOptionsOutline,
  IoSwapHorizontalOutline,
  IoChevronBack,
  IoTrophyOutline,
  IoTrendingDownOutline,
  IoTrendingUpOutline,
  IoChevronDown,
  IoChevronUp
} from "react-icons/io5";
import { IconRocket, IconRosetteDiscount, IconCrown } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CustomImage from "@/components/Common/CustomImage";
import Loader from "@/components/Common/Loader";
import Layout from "@/components/Layout/Layout";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ==========================================
// HELPERS
// ==========================================
const formatPrice = (item) => {
  if (item.price === 0 || item.price === null || item.price === undefined) return "Na upit";
  return item.price_formatted || `${Number(item.price).toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${item.currency || 'KM'}`;
};

const getAttributeRawValue = (item, keys) => {
    const fields = item.translated_custom_fields || item.custom_fields || [];
    const field = fields.find(f => {
      const name = (f.translated_name || f.name || "").toLowerCase();
      return keys.some(k => name.includes(k.toLowerCase()));
    });

    if (!field) return null;
    return field.translated_selected_values?.[0] || field.value?.[0] || field.value;
};

const parseNumber = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/[^0-9,.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
};

const renderAttributeValue = (rawValue) => {
    if (rawValue === null || rawValue === undefined || rawValue === "") return <span className="text-slate-300">-</span>;
    if (Array.isArray(rawValue)) return rawValue.join(", ");
    if (typeof rawValue === 'boolean' || rawValue === '1' || rawValue === '0') {
        const isTrue = rawValue === true || rawValue === '1';
        return isTrue ? 
            <div className="flex justify-center md:justify-center items-center h-6 w-6 rounded-full bg-emerald-100 mx-auto md:mx-0"><IoCheckmarkCircle className="text-emerald-600" size={16}/></div> : 
            <div className="flex justify-center md:justify-center items-center h-6 w-6 rounded-full bg-rose-50 mx-auto md:mx-0"><IoCloseCircle className="text-rose-400" size={16}/></div>;
    }
    return <span className="font-semibold text-slate-700">{rawValue}</span>;
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ComparePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const reduxList = useSelector(selectCompareList);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [highlightDiffs, setHighlightDiffs] = useState(false);
  const [showBest, setShowBest] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({}); // Za mobile accordion

  useEffect(() => {
    const fetchItems = async () => {
      if (!reduxList || reduxList.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const promises = reduxList.map(item => 
          allItemApi.getItems({ id: item.id })
            .then(res => {
                const data = res?.data?.data;
                return Array.isArray(data) ? data[0] : data;
            })
            .catch(err => null)
        );

        const results = await Promise.all(promises);
        setItems(results.filter(item => item && item.id));
        
      } catch (error) {
        console.error("Error fetching comparison items:", error);
        toast.error("Greška pri učitavanju podataka.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [reduxList]);

  // Handlers
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link kopiran!");
  };
  
  const handleClearAll = () => {
      if(confirm("Ukloniti sve oglase iz usporedbe?")) {
          dispatch(clearCompare());
      }
  };

  const toggleGroup = (group) => {
      setCollapsedGroups(prev => ({...prev, [group]: !prev[group]}));
  };

  // Konfiguracija redova s grupama
  const comparisonGroups = useMemo(() => [
      {
          id: 'basic',
          label: 'Osnovne informacije',
          rows: [
            { id: 'location', label: "Lokacija", getValue: (i) => i.city?.name || i.city },
            { id: 'category', label: "Kategorija", getValue: (i) => i.category?.translated_name || i.category?.name },
            { id: 'published', label: "Objavljeno", getValue: (i) => i.created_at ? new Date(i.created_at).toLocaleDateString("hr-BA") : null },
            { id: 'condition', label: "Stanje", keys: ['stanje', 'condition'] },
          ]
      },
      {
          id: 'performance',
          label: 'Performanse i Motor',
          rows: [
            { id: 'year', label: "Godište", keys: ['godište', 'godina', 'year'], type: 'number', better: 'higher' },
            { id: 'mileage', label: "Kilometraža", keys: ['kilometraža', 'mileage', 'km'], type: 'number', better: 'lower', suffix: 'km' },
            { id: 'power', label: "Snaga", keys: ['snaga', 'power', 'kw'], type: 'number', better: 'higher', suffix: 'KS/kW' },
            { id: 'fuel', label: "Gorivo", keys: ['gorivo', 'fuel'] },
            { id: 'transmission', label: "Mjenjač", keys: ['mjenjač', 'transmission'] },
            { id: 'drive', label: "Pogon", keys: ['pogon', 'drive'] },
          ]
      },
      {
          id: 'details',
          label: 'Detalji i Oprema',
          rows: [
            { id: 'color', label: "Boja", keys: ['boja', 'color'] },
            { id: 'registered', label: "Registriran", keys: ['registriran', 'registered'], type: 'boolean' },
            { id: 'service_book', label: "Servisna knjiga", keys: ['servisna', 'service history'], type: 'boolean' },
            { id: 'first_owner', label: "Prvi vlasnik", keys: ['prvi vlasnik', 'first owner'], type: 'boolean' },
          ]
      }
  ], []);

  // Flattened rows for calculations
  const allRows = useMemo(() => comparisonGroups.flatMap(g => g.rows), [comparisonGroups]);

  const doesRowHaveDifferences = useCallback((rowConfig) => {
      if (items.length < 2) return false;
      const firstVal = JSON.stringify(rowConfig.getValue ? rowConfig.getValue(items[0]) : getAttributeRawValue(items[0], rowConfig.keys));
      
      for (let i = 1; i < items.length; i++) {
          const currentVal = JSON.stringify(rowConfig.getValue ? rowConfig.getValue(items[i]) : getAttributeRawValue(items[i], rowConfig.keys));
          if (firstVal !== currentVal) return true;
      }
      return false;
  }, [items]);

  const getRowStats = useCallback((rowConfig) => {
      if (!rowConfig.type || !['number', 'price'].includes(rowConfig.type) || items.length < 2) return null;
      const values = items.map(item => {
          let val = rowConfig.getValue ? rowConfig.getValue(item) : getAttributeRawValue(item, rowConfig.keys);
          return { id: item.id, val: parseNumber(val) };
      }).filter(v => v.val > 0);

      if (values.length === 0) return null;
      const maxVal = Math.max(...values.map(v => v.val));
      const minVal = Math.min(...values.map(v => v.val));
      const bestVal = rowConfig.better === 'higher' ? maxVal : minVal;
      return { max: maxVal, min: minVal, best: bestVal };
  }, [items]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex justify-center items-center">
          <Loader />
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 text-slate-400 shadow-inner">
              <IoSwapHorizontalOutline size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Usporedba je prazna</h1>
          <p className="text-slate-500 max-w-sm mb-8 text-lg">Odaberite oglase koje želite usporediti klikom na ikonu vage na kartici oglasa.</p>
          <Link href="/ads">
              <Button className="rounded-full px-8 py-6 bg-slate-900 hover:bg-slate-800 text-lg shadow-lg shadow-slate-200">Pretraži oglase</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50/50 pb-24 print:bg-white print:p-0">
        <div className="container mx-auto px-0 md:px-4 max-w-[1400px]">
        
        {/* HEADER - Desktop */}
        <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pt-8 px-4 md:px-0 print:hidden">
            <div>
                <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-3 transition-colors font-medium">
                    <IoChevronBack /> Nazad na pretragu
                </button>
                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Usporedba oglasa</h1>
                <p className="text-slate-500 mt-2">Uspoređujete <span className="font-bold text-slate-900">{items.length}</span> {items.length === 1 ? 'oglas' : 'oglasa'}</p>
            </div>
            
            {/* TOOLBAR */}
            <div className="w-full md:w-auto flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200/60 overflow-x-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHighlightDiffs(!highlightDiffs)}
                    className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all gap-2 border ${highlightDiffs ? 'bg-amber-50 text-amber-700 border-amber-200' : 'text-slate-600 border-transparent hover:bg-slate-50'}`}
                >
                    <IoOptionsOutline size={16} />
                    <span className="whitespace-nowrap">Istakni razlike</span>
                </Button>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBest(!showBest)}
                    className={`h-10 px-4 rounded-xl text-xs font-semibold transition-all gap-2 border ${showBest ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'text-slate-600 border-transparent hover:bg-slate-50'}`}
                >
                    <IoTrophyOutline size={16} />
                    <span className="whitespace-nowrap">Pokaži najbolje</span>
                </Button>
                
                <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />

                <Button variant="ghost" size="icon" onClick={handleShare} className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50" title="Podijeli">
                    <IoShareSocialOutline size={20} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => window.print()} className="h-10 w-10 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50" title="Print">
                    <IoPrintOutline size={20} />
                </Button>
                <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0" />
                <Button variant="ghost" size="icon" onClick={handleClearAll} className="h-10 w-10 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50" title="Očisti sve">
                    <IoTrashOutline size={20} />
                </Button>
            </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
             <h1 className="text-lg font-bold text-slate-900">Usporedba ({items.length})</h1>
             <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setHighlightDiffs(!highlightDiffs)} className={`h-8 w-8 p-0 rounded-full ${highlightDiffs ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    <IoOptionsOutline size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-8 w-8 p-0 rounded-full bg-rose-50 text-rose-500">
                    <IoTrashOutline size={16} />
                </Button>
             </div>
        </div>
        
        {/* TABLE WRAPPER */}
        <div className="bg-white md:rounded-3xl md:shadow-xl md:shadow-slate-200/50 md:border border-slate-100 overflow-hidden relative md:ring-1 md:ring-slate-900/5 mt-0 md:mt-0">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse text-left table-fixed md:table-auto">
              {/* HEADERS (STICKY) */}
              <thead className="sticky top-[53px] md:top-0 z-30 shadow-sm md:shadow-none">
                <tr>
                  {/* Desktop: Empty Corner / Mobile: Hidden */}
                  <th className="hidden md:table-cell p-6 w-56 min-w-[180px] bg-slate-50/90 backdrop-blur-md border-b border-r border-slate-100 text-left align-bottom z-40 print:static">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Specifikacije</span>
                  </th>
                  
                  {/* Product Columns */}
                  {items.map(item => {
                      const isFeatured = item.is_feature === 1 || item.is_feature === true;
                      const isSale = (item.is_on_sale === 1 || item.is_on_sale === true) && item.discount_percentage > 0;

                      return (
                        // Mobile: w-1/2 (2 items visible) or w-40. Desktop: w-80.
                        <th key={item.id} className="p-3 md:p-5 w-[160px] md:w-80 min-w-[160px] md:min-w-[280px] bg-white border-b border-r md:border-r-0 border-slate-200 align-top relative group">
                            
                            {/* Remove Button (Desktop) */}
                            <button 
                                onClick={() => dispatch(removeFromCompare(item.id))} 
                                className="hidden md:block absolute top-3 right-3 z-30 bg-white/90 backdrop-blur rounded-full p-2 shadow-sm text-slate-400 hover:text-rose-500 border border-slate-100 opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 print:hidden"
                            >
                                <IoTrashOutline size={18}/>
                            </button>
                            
                            {/* Image & Badges */}
                            <Link href={`/ad-details/${item.slug}`} className="block relative mb-2 md:mb-4">
                                <div className="aspect-[4/3] w-full relative rounded-lg md:rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shadow-sm">
                                    <CustomImage 
                                        src={item.image || item.thumbnail_image} 
                                        alt={item.name} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                                    />
                                </div>

                                {/* BADGES */}
                                <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2 z-20">
                                    {isFeatured && (
                                        <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg backdrop-blur-sm">
                                            <IconRocket size={12} stroke={2.5} className="text-white md:w-3.5 md:h-3.5" />
                                            <span className="hidden md:inline">PREMIUM</span>
                                        </div>
                                    )}
                                    {isSale && (
                                        <div className="flex items-center gap-1 bg-red-600 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-full shadow-lg backdrop-blur-sm">
                                            <IconRosetteDiscount size={12} stroke={2.5} className="text-white md:w-3.5 md:h-3.5" />
                                            <span className="hidden md:inline">AKCIJA</span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Title & Price */}
                            <div className="space-y-1 text-left px-1">
                                <Link href={`/ad-details/${item.slug}`} className="block">
                                    <h3 className="text-xs md:text-base font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors min-h-[32px] md:min-h-[44px] leading-snug">
                                        {item.translated_item?.name || item.name}
                                    </h3>
                                </Link>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1">
                                    <p className={`text-sm md:text-xl font-black ${isSale ? 'text-red-600' : 'text-blue-600'} tracking-tight`}>
                                        {formatPrice(item)}
                                    </p>
                                    <button 
                                        onClick={() => dispatch(removeFromCompare(item.id))} 
                                        className="md:hidden text-[10px] text-rose-500 font-medium underline text-left"
                                    >
                                        Ukloni
                                    </button>
                                </div>
                            </div>
                        </th>
                      );
                  })}
                </tr>
              </thead>
              
              {/* BODY - GROUPED */}
              <tbody>
                {comparisonGroups.map((group) => {
                    const isCollapsed = collapsedGroups[group.id];
                    
                    return (
                    <>
                        {/* GROUP HEADER */}
                        <tr key={group.id} className="bg-slate-50/80 md:bg-white">
                            <td colSpan={items.length + 1} className="p-0">
                                <button 
                                    onClick={() => toggleGroup(group.id)}
                                    className="w-full flex items-center justify-between px-4 md:px-6 py-3 bg-slate-100/50 hover:bg-slate-100 border-y border-slate-200 text-left transition-colors"
                                >
                                    <span className="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest">{group.label}</span>
                                    {isCollapsed ? <IoChevronDown className="text-slate-400"/> : <IoChevronUp className="text-slate-400"/>}
                                </button>
                            </td>
                        </tr>

                        {/* ROWS */}
                        {!isCollapsed && group.rows.map((row, idx) => {
                            const hasDiff = doesRowHaveDifferences(row);
                            const isDimmed = highlightDiffs && !hasDiff;
                            const stats = getRowStats(row); 

                            return (
                            <tr key={row.id || idx} className={`group transition-colors ${isDimmed ? 'opacity-30 grayscale bg-slate-50' : 'hover:bg-slate-50/60'}`}>
                                
                                {/* Desktop Label (Sticky) */}
                                <td className="hidden md:table-cell p-5 border-b border-r border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wide bg-white sticky left-0 z-10">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>{row.label}</span>
                                        {row.type === 'number' && row.better && (
                                            <div className="opacity-20 group-hover:opacity-100 transition-opacity">
                                                {row.better === 'higher' ? <IoTrendingUpOutline size={14}/> : <IoTrendingDownOutline size={14}/>}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                
                                {/* Values */}
                                {items.map(item => {
                                    const rawValue = row.getValue ? row.getValue(item) : getAttributeRawValue(item, row.keys);
                                    const numVal = parseNumber(rawValue);
                                    const isWinner = showBest && stats && stats.best === numVal && numVal > 0;
                                    const barWidth = stats && stats.max > 0 ? (numVal / stats.max) * 100 : 0;

                                    return (
                                    <td key={item.id} className={`p-3 md:p-5 text-xs md:text-sm text-center border-b border-r md:border-r-0 border-slate-100 relative align-middle ${isWinner ? 'bg-emerald-50/30' : ''}`}>
                                        
                                        {/* MOBILE INLINE LABEL (Prikazuje se samo na mobitelu iznad vrijednosti) */}
                                        <div className="md:hidden text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wide">
                                            {row.label}
                                        </div>

                                        <div className={`relative z-10 transition-all ${highlightDiffs && hasDiff ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                                            
                                            {/* Value + Crown */}
                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                {renderAttributeValue(rawValue)}
                                                {isWinner && (
                                                    <div className="bg-emerald-100 text-emerald-700 p-0.5 md:p-1 rounded-full animate-in zoom-in spin-in-12 duration-500" title="Najbolji">
                                                        <IconCrown size={12} stroke={2.5} className="md:w-3.5 md:h-3.5" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bar (Desktop only mostly, or subtle on mobile) */}
                                            {row.type === 'number' && rawValue && numVal > 0 && !highlightDiffs && (
                                                <div className="mt-1.5 h-1 w-full bg-slate-100 rounded-full overflow-hidden max-w-[80px] md:max-w-[120px] mx-auto opacity-80">
                                                    <div className={`h-full rounded-full ${isWinner ? 'bg-emerald-500' : 'bg-slate-300'}`} style={{ width: `${barWidth}%` }} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    )})}
                            </tr>
                            )})}
                    </>
                    )
                })}

                {/* Footer Buttons (Desktop only) */}
                <tr className="hidden md:table-row print:hidden">
                    <td className="p-5 border-r border-slate-100 bg-white sticky left-0 z-10"></td>
                    {items.map(item => (
                        <td key={item.id} className="p-5 text-center border-t border-slate-100">
                            <Link href={`/ad-details/${item.slug}`}>
                                <Button className="w-full rounded-xl font-bold bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all h-12 text-base">
                                    Detaljnije
                                </Button>
                            </Link>
                        </td>
                    ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Mobile Action Fab / Hint */}
        <div className="mt-8 text-center text-xs font-medium text-slate-400 md:hidden pb-8">
            <IoSwapHorizontalOutline className="inline mr-1"/> Prikaži više detalja klikom na oglas
        </div>
        </div>

        <style jsx global>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
          .custom-scrollbar { overflow: visible !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
            background: #cbd5e1; 
            border-radius: 10px; 
        }
        `}</style>
      </div>
    </Layout>
  );
}
