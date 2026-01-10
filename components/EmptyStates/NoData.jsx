"use client";

import CustomImage from "../Common/CustomImage";

// --- ODABERI LJEPŠU SLIKU (Odkomentariši samo jednu liniju) ---

// OPCIJA 1: Moderna "Search" ilustracija (Plavi tonovi, profesionalno, čisto) - MOJA PREPORUKA
const ILLUSTRATION_URL = "https://cdni.iconscout.com/illustration/premium/thumb/search-result-not-found-2130361-1800925.png?f=webp";

// OPCIJA 2: "Empty Box" 3D stil (Vrlo moderno, koristi se u mnogim novim aplikacijama)
// const ILLUSTRATION_URL = "https://cdni.iconscout.com/illustration/premium/thumb/empty-box-3390195-2841932.png?f=webp";

// OPCIJA 3: Apstraktno / Minimalistički (Manje detalja, čistije)
// const ILLUSTRATION_URL = "https://cdni.iconscout.com/illustration/free/thumb/free-no-data-not-found-4085817-3385486.png?f=webp";


const NoData = ({ name }) => {
  // Pomoćna logika za tekst ako 'name' nije proslijeđen
  const displayName = name ? name : "rezultata";

  return (
    // Povećao sam min-h da ima više prostora da "diše"
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in-95 duration-500 min-h-[50vh]">
      
      {/* Slika sa suptilnom pozadinom */}
      <div className="relative mb-8 group">
        {/* Pojačao sam glow efekat jer su ove nove slike veće i ljepše */}
        <div className="absolute inset-0 bg-blue-100/50 rounded-full blur-3xl transform scale-125 opacity-40 group-hover:opacity-80 transition-opacity duration-700"></div>
        
        <div className="relative z-10">
            {/* Povećao sam dimenzije slike (280x280) jer su ove ilustracije detaljnije */}
            <CustomImage 
                src={ILLUSTRATION_URL} 
                alt="Nema rezultata" 
                width={280} 
                height={280}
                // 'object-contain' osigurava da se cijela ilustracija vidi bez rezanja
                className="drop-shadow-sm object-contain mx-auto" 
            />
        </div>
      </div>

      {/* Tekstualni dio - malo veći razmak */}
      <div className="max-w-md mx-auto space-y-4">
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
          Nema pronađenih oglasa!
        </h3>
        
        <p className="text-gray-500 text-base leading-relaxed">
          Žao nam je, ali nismo pronašli ono što tražite. <br className="hidden sm:block" />
          Pokušajte promijeniti filtere ili ključne riječi pretrage.
        </p>
      </div>
      
    </div>
  );
};

export default NoData;