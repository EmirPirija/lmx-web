"use client";
import { useState } from "react";
import { MdTrendingDown, MdTrendingUp, MdHistory, MdExpandMore, MdExpandLess } from "react-icons/md";
 
// Formatiranje cijene
const formatPrice = (price) => {
  if (!price || price === 0) return "Besplatno";
  return new Intl.NumberFormat('bs-BA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' KM';
};
 
// Formatiranje datuma
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate();
  const months = [
    "jan", "feb", "mar", "apr", "maj", "jun",
    "jul", "aug", "sep", "okt", "nov", "dec"
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}. ${month} ${year}`;
};
 
const PriceHistory = ({ priceHistory = [], currentPrice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
 
  if (!priceHistory || priceHistory.length === 0) {
    return null;
  }
 
  // Sortiraj po datumu (najnoviji prvi)
  const sortedHistory = [...priceHistory].sort((a, b) => 
    new Date(b.created_at || b.date) - new Date(a.created_at || a.date)
  );
 
  // Izračunaj ukupnu promjenu cijene
  const oldestPrice = sortedHistory[sortedHistory.length - 1]?.price || currentPrice;
  const priceChange = currentPrice - oldestPrice;
  const percentChange = oldestPrice > 0 ? ((priceChange / oldestPrice) * 100).toFixed(1) : 0;
  const isPriceDown = priceChange < 0;
  const isPriceUp = priceChange > 0;
 
  // Prikaži samo prve 3 ako nije prošireno
  const displayedHistory = isExpanded ? sortedHistory : sortedHistory.slice(0, 3);
  const hasMore = sortedHistory.length > 3;
 
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <MdHistory className="text-slate-600 text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Historija cijena</h3>
              <p className="text-xs text-slate-500">{sortedHistory.length} promjena</p>
            </div>
          </div>
          
          {/* Badge za ukupnu promjenu */}
          {(isPriceDown || isPriceUp) && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              isPriceDown 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isPriceDown ? (
                <MdTrendingDown className="text-lg" />
              ) : (
                <MdTrendingUp className="text-lg" />
              )}
              <span>{Math.abs(percentChange)}%</span>
            </div>
          )}
        </div>
      </div>
 
      {/* Lista promjena */}
      <div className="p-4">
        <div className="space-y-3">
          {/* Trenutna cijena */}
          <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-600">Trenutna cijena</span>
            </div>
            <span className="font-bold text-primary text-lg">{formatPrice(currentPrice)}</span>
          </div>
 
          {/* Historija */}
          {displayedHistory.map((item, index) => {
            const itemPrice = item.price || item.old_price;
            const itemDate = item.created_at || item.date;
            const prevPrice = index < displayedHistory.length - 1 
              ? (displayedHistory[index + 1]?.price || displayedHistory[index + 1]?.old_price)
              : itemPrice;
            
            const itemChange = index === 0 ? currentPrice - itemPrice : itemPrice - prevPrice;
            const isDown = itemChange < 0;
            const isUp = itemChange > 0;
 
            return (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDown ? 'bg-green-100' : isUp ? 'bg-red-100' : 'bg-slate-200'
                  }`}>
                    {isDown ? (
                      <MdTrendingDown className="text-green-600" />
                    ) : isUp ? (
                      <MdTrendingUp className="text-red-600" />
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-700">{formatPrice(itemPrice)}</span>
                    <p className="text-xs text-slate-400">{formatDate(itemDate)}</p>
                  </div>
                </div>
                
                {(isDown || isUp) && (
                  <span className={`text-xs font-bold ${isDown ? 'text-green-600' : 'text-red-600'}`}>
                    {isDown ? '' : '+'}{formatPrice(Math.abs(itemChange))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
 
        {/* Dugme za proširenje */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600 transition-all"
          >
            {isExpanded ? (
              <>
                <MdExpandLess className="text-lg" />
                Prikaži manje
              </>
            ) : (
              <>
                <MdExpandMore className="text-lg" />
                Prikaži sve ({sortedHistory.length - 3} više)
              </>
            )}
          </button>
        )}
      </div>
 
      {/* Footer info */}
      {isPriceDown && (
        <div className="px-5 py-3 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-700 text-center font-medium">
            Cijena je snižena za {formatPrice(Math.abs(priceChange))} od prvog oglašavanja
          </p>
        </div>
      )}
    </div>
  );
};
 
export default PriceHistory;