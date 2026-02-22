"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check, X } from "@/components/Common/UnifiedIconPack";
import { toast } from "@/utils/toastBs";

// ═══════════════════════════════════════════════════════════════════
// AVATAR OPTIONS - FLAT MINIMALIST STYLE
// ═══════════════════════════════════════════════════════════════════
const OPTIONS = {
  // Pastelne boje kože (mint/peach varijante kao na slici)
  skinColors: [
    "#7DD3C0", // mint (kao na slici)
    "#A8E6CF", // svijetli mint
    "#FFE0BD", // peach
    "#FFEAA7", // svijetlo žuta
    "#DDA0DD", // lavanda
    "#F8B4B4", // roza
    "#B8D4E3", // svijetlo plava
    "#E8D5B7", // bež
  ],
  
  // Pastelne pozadine
  bgColors: [
    "#B8E6E0", // mint pozadina (kao na slici)
    "#FFE4E1", // misty rose
    "#E8F4FD", // baby blue
    "#FFF8DC", // cornsilk
    "#E8E4F0", // lavanda
    "#F0FFF0", // honeydew
    "#FFF5EE", // seashell
    "#F5F5F5", // neutral
  ],
  
  // Boje kose
  hairColors: [
    "#2C3A4A", // tamno plava (kao na slici)
    "#1A1A2E", // crna
    "#5D4E37", // smeđa
    "#8B4513", // tamno smeđa
    "#D4A574", // plava
    "#E8E4D9", // sijeda
    "#C75B39", // riđa
    "#6B4423", // čokolada
  ],
  
  // Boje majice
  shirtColors: [
    "#5B7BB2", // plava (kao na slici)
    "#7DD3C0", // teal
    "#F7941D", // narandžasta
    "#E57373", // crvena
    "#81C784", // zelena
    "#BA68C8", // ljubičasta
    "#4DB6AC", // cyan
    "#FFB74D", // žuta
  ],
  
  // Tipovi kose
  hairTypes: [
    { id: "curly", label: "Kovrčava" },
    { id: "short", label: "Kratka" },
    { id: "wavy", label: "Talasasta" },
    { id: "long", label: "Duga" },
    { id: "buzz", label: "Kratka šišana" },
    { id: "bald", label: "Bez kose" },
  ],
  
  // Tipovi očiju
  eyeTypes: [
    { id: "default", label: "Obične" },
    { id: "happy", label: "Sretne" },
    { id: "sleepy", label: "Pospane" },
    { id: "wink", label: "Namigivanje" },
  ],
  
  // Tipovi usta
  mouthTypes: [
    { id: "smile", label: "Osmijeh" },
    { id: "happy", label: "Široki" },
    { id: "neutral", label: "Neutralna" },
    { id: "surprised", label: "Iznenađena" },
  ],
};

// ═══════════════════════════════════════════════════════════════════
// SVG KOMPONENTE - FLAT MINIMALIST STIL
// ═══════════════════════════════════════════════════════════════════

// Pozadina - jednostavan krug
const Background = ({ color }) => (
  <circle cx="100" cy="100" r="85" fill={color} />
);

// Lice - zaobljena forma
const Face = ({ color }) => {
  // Malo tamnija varijanta za sjenu
  const darkerShade = adjustColor(color, -15);
  
  return (
    <g>
      {/* Vrat */}
      <rect x="85" y="135" width="30" height="25" fill={darkerShade} rx="5" />
      
      {/* Glava */}
      <ellipse cx="100" cy="100" rx="45" ry="50" fill={color} />
      
      {/* Uši */}
      <ellipse cx="55" cy="105" rx="6" ry="10" fill={color} />
      <ellipse cx="145" cy="105" rx="6" ry="10" fill={color} />
      
      {/* Rumenilo na obrazima */}
      <ellipse cx="70" cy="115" rx="10" ry="6" fill={darkerShade} opacity="0.4" />
      <ellipse cx="130" cy="115" rx="10" ry="6" fill={darkerShade} opacity="0.4" />
    </g>
  );
};

// Obrve - jednostavne linije
const Eyebrows = ({ color }) => (
  <g stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none">
    <path d="M 72 82 Q 80 79 88 82" />
    <path d="M 112 82 Q 120 79 128 82" />
  </g>
);

// Oči - kao na referentnoj slici
const Eyes = ({ type }) => {
  const eyeWhite = "#FFFEF0";
  const pupil = "#2C3A4A";
  
  switch (type) {
    case "happy":
      return (
        <g stroke={pupil} strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M 75 95 Q 80 90 85 95" />
          <path d="M 115 95 Q 120 90 125 95" />
        </g>
      );
    
    case "sleepy":
      return (
        <g>
          <ellipse cx="80" cy="95" rx="8" ry="4" fill={eyeWhite} />
          <circle cx="80" cy="96" r="3" fill={pupil} />
          <ellipse cx="120" cy="95" rx="8" ry="4" fill={eyeWhite} />
          <circle cx="120" cy="96" r="3" fill={pupil} />
        </g>
      );
    
    case "wink":
      return (
        <g>
          {/* Otvoreno oko */}
          <ellipse cx="80" cy="95" rx="9" ry="9" fill={eyeWhite} />
          <circle cx="80" cy="95" r="4" fill={pupil} />
          {/* Zatvoreno oko */}
          <path d="M 113 95 Q 120 90 127 95" stroke={pupil} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      );
    
    default: // obične oči kao na slici
      return (
        <g>
          <ellipse cx="80" cy="95" rx="9" ry="9" fill={eyeWhite} />
          <circle cx="80" cy="95" r="4" fill={pupil} />
          <ellipse cx="120" cy="95" rx="9" ry="9" fill={eyeWhite} />
          <circle cx="120" cy="95" r="4" fill={pupil} />
        </g>
      );
  }
};

// Usta - jednostavna linija/krivulja
const Mouth = ({ type }) => {
  const color = "#2C3A4A";
  
  switch (type) {
    case "happy":
      return (
        <path 
          d="M 85 120 Q 100 135 115 120" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />
      );
    
    case "neutral":
      return (
        <line 
          x1="88" y1="122" x2="112" y2="122" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
      );
    
    case "surprised":
      return (
        <ellipse cx="100" cy="122" rx="6" ry="8" fill={color} />
      );
    
    default: // smile kao na slici
      return (
        <path 
          d="M 88 118 Q 100 128 112 118" 
          stroke={color} 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          fill="none" 
        />
      );
  }
};

// Kosa - različiti stilovi
const Hair = ({ type, color }) => {
  switch (type) {
    case "curly": // Kao na referentnoj slici - krugovi
      return (
        <g fill={color}>
          {/* Gornji red */}
          <circle cx="65" cy="60" r="12" />
          <circle cx="85" cy="50" r="14" />
          <circle cx="108" cy="48" r="15" />
          <circle cx="130" cy="55" r="13" />
          <circle cx="145" cy="70" r="11" />
          
          {/* Srednji red */}
          <circle cx="55" cy="75" r="11" />
          <circle cx="72" cy="65" r="12" />
          <circle cx="95" cy="55" r="13" />
          <circle cx="120" cy="58" r="12" />
          <circle cx="140" cy="68" r="10" />
          
          {/* Bočni */}
          <circle cx="50" cy="90" r="9" />
          <circle cx="150" cy="88" r="9" />
          <circle cx="48" cy="105" r="7" />
          <circle cx="152" cy="103" r="7" />
        </g>
      );
    
    case "short":
      return (
        <path 
          d="M 55 85 
             Q 55 45 100 40 
             Q 145 45 145 85
             Q 140 60 100 55
             Q 60 60 55 85 Z"
          fill={color}
        />
      );
    
    case "wavy":
      return (
        <g fill={color}>
          <path 
            d="M 50 90 
               Q 48 50 100 40 
               Q 152 50 150 90
               Q 145 60 100 52
               Q 55 60 50 90 Z"
          />
          {/* Talasi sa strane */}
          <path d="M 48 90 Q 40 110 45 130 Q 55 125 50 105 Q 48 95 48 90" />
          <path d="M 152 90 Q 160 110 155 130 Q 145 125 150 105 Q 152 95 152 90" />
        </g>
      );
    
    case "long":
      return (
        <g fill={color}>
          <path 
            d="M 45 85 
               Q 42 45 100 35 
               Q 158 45 155 85
               Q 160 120 150 160
               L 50 160
               Q 40 120 45 85 Z"
          />
          {/* Prednja linija kose */}
          <path 
            d="M 55 90 
               Q 52 55 100 45 
               Q 148 55 145 90
               Q 140 65 100 58
               Q 60 65 55 90 Z"
            fill={adjustColor(color, 10)}
          />
        </g>
      );
    
    case "buzz":
      return (
        <path 
          d="M 58 88 
             Q 56 55 100 48 
             Q 144 55 142 88
             Q 138 65 100 60
             Q 62 65 58 88 Z"
          fill={color}
          opacity="0.7"
        />
      );
    
    default: // bald
      return null;
  }
};

// Majica
const Shirt = ({ color }) => (
  <path 
    d="M 55 160 
       Q 60 145 80 140 
       Q 100 138 120 140 
       Q 140 145 145 160
       L 155 200
       L 45 200
       Z"
    fill={color}
  />
);

// Helper funkcija za prilagođavanje boje
function adjustColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// ═══════════════════════════════════════════════════════════════════
// COLOR PICKER - Kompaktan
// ═══════════════════════════════════════════════════════════════════
const ColorRow = ({ colors, selected, onSelect, label }) => (
  <div className="flex items-center gap-3">
    <span className="w-16 shrink-0 text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <div className="flex gap-1.5 flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelect(color)}
          className={`
            w-7 h-7 rounded-full transition-all duration-150
            ${selected === color 
              ? 'ring-2 ring-offset-1 ring-slate-800 dark:ring-slate-100 scale-110' 
              : 'hover:scale-105'
            }
          `}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// STYLE PICKER - Kompaktan
// ═══════════════════════════════════════════════════════════════════
const StyleRow = ({ options, selected, onSelect, label }) => (
  <div className="flex items-start gap-3">
    <span className="w-16 shrink-0 pt-1.5 text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <div className="flex gap-1.5 flex-wrap">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`
            px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150
            ${selected === option.id 
              ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' 
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// GLAVNI KOMPONENTA
// ═══════════════════════════════════════════════════════════════════
const LmxAvatarGenerator = ({
  onSave,
  onCancel,
  isSaving = false,
  compact = false,
}) => {
  const svgRef = useRef(null);
  
  const [config, setConfig] = useState({
    skinColor: OPTIONS.skinColors[0],
    bgColor: OPTIONS.bgColors[0],
    hairColor: OPTIONS.hairColors[0],
    shirtColor: OPTIONS.shirtColors[0],
    hairType: "curly",
    eyeType: "default",
    mouthType: "smile",
  });

  const randomize = useCallback(() => {
    setConfig({
      skinColor: OPTIONS.skinColors[Math.floor(Math.random() * OPTIONS.skinColors.length)],
      bgColor: OPTIONS.bgColors[Math.floor(Math.random() * OPTIONS.bgColors.length)],
      hairColor: OPTIONS.hairColors[Math.floor(Math.random() * OPTIONS.hairColors.length)],
      shirtColor: OPTIONS.shirtColors[Math.floor(Math.random() * OPTIONS.shirtColors.length)],
      hairType: OPTIONS.hairTypes[Math.floor(Math.random() * OPTIONS.hairTypes.length)].id,
      eyeType: OPTIONS.eyeTypes[Math.floor(Math.random() * OPTIONS.eyeTypes.length)].id,
      mouthType: OPTIONS.mouthTypes[Math.floor(Math.random() * OPTIONS.mouthTypes.length)].id,
    });
  }, []);

  const handleExport = useCallback(() => {
    if (!svgRef.current) return;
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx.drawImage(img, 0, 0, 400, 400);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onSave?.(blob);
        } else {
          toast.error("Greška pri kreiranju avatara.");
        }
        URL.revokeObjectURL(url);
      }, "image/png", 0.95);
    };
    
    img.onerror = () => {
      toast.error("Greška pri učitavanju.");
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  }, [onSave]);

  return (
    <div
      className={
        compact
          ? "w-full"
          : "w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
      }
    >
      {/* Header */}
      <div
        className={
          compact
            ? "flex items-center justify-between px-0 py-1"
            : "flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700"
        }
      >
        <h2 className="font-semibold text-slate-800 dark:text-slate-100">Kreiraj avatar</h2>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={randomize}
            disabled={isSaving}
            className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
              <Sparkles size={14} className="mr-1" />
              Nasumično
            </Button>
          {onCancel && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onCancel}
              className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-200"
            >
              <X size={18} />
            </Button>
          )}
        </div>
      </div>

      <div className={compact ? "p-0 pb-2" : "max-h-[70dvh] overflow-y-auto p-4"}>
        {/* Preview */}
        <div className="flex justify-center mb-4">
          <div
            className={
              compact
                ? "h-28 w-28 overflow-hidden rounded-full bg-slate-50 shadow-inner dark:bg-slate-800"
                : "h-36 w-36 overflow-hidden rounded-full bg-slate-50 shadow-inner dark:bg-slate-800"
            }
          >
            <svg 
              ref={svgRef} 
              viewBox="0 0 200 200" 
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Pozadina */}
              <rect width="200" height="200" fill="#F5F5F0" />
              <Background color={config.bgColor} />
              
              {/* Duga kosa iza */}
              {config.hairType === 'long' && (
                <Hair type="long" color={config.hairColor} />
              )}
              
              {/* Majica */}
              <Shirt color={config.shirtColor} />
              
              {/* Lice */}
              <Face color={config.skinColor} />
              
              {/* Obrve */}
              <Eyebrows color={config.hairColor} />
              
              {/* Oči */}
              <Eyes type={config.eyeType} />
              
              {/* Usta */}
              <Mouth type={config.mouthType} />
              
              {/* Kosa (osim duge) */}
              {config.hairType !== 'long' && config.hairType !== 'bald' && (
                <Hair type={config.hairType} color={config.hairColor} />
              )}
            </svg>
          </div>
        </div>

        {/* Controls - Kompaktno */}
        <div className="space-y-3">
          <ColorRow 
            label="Koža"
            colors={OPTIONS.skinColors}
            selected={config.skinColor}
            onSelect={(c) => setConfig({...config, skinColor: c})}
          />
          
          <ColorRow 
            label="Pozadina"
            colors={OPTIONS.bgColors}
            selected={config.bgColor}
            onSelect={(c) => setConfig({...config, bgColor: c})}
          />
          
          <ColorRow 
            label="Kosa"
            colors={OPTIONS.hairColors}
            selected={config.hairColor}
            onSelect={(c) => setConfig({...config, hairColor: c})}
          />
          
          <ColorRow 
            label="Odjeća"
            colors={OPTIONS.shirtColors}
            selected={config.shirtColor}
            onSelect={(c) => setConfig({...config, shirtColor: c})}
          />
          
          <div className={compact ? "pt-1" : "border-t border-slate-100 pt-2 dark:border-slate-700"}>
            <StyleRow 
              label="Frizura"
              options={OPTIONS.hairTypes}
              selected={config.hairType}
              onSelect={(id) => setConfig({...config, hairType: id})}
            />
          </div>
          
          <StyleRow 
            label="Oči"
            options={OPTIONS.eyeTypes}
            selected={config.eyeType}
            onSelect={(id) => setConfig({...config, eyeType: id})}
          />
          
          <StyleRow 
            label="Usta"
            options={OPTIONS.mouthTypes}
            selected={config.mouthType}
            onSelect={(id) => setConfig({...config, mouthType: id})}
          />
        </div>
      </div>

      {/* Footer */}
      <div
        className={
          compact
            ? "flex gap-2 px-0 py-2"
            : "flex gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70"
        }
      >
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSaving}
            className="flex-1"
          >
            Odustani
          </Button>
        )}
        <Button 
          onClick={handleExport} 
          disabled={isSaving}
          className="flex-1 bg-slate-800 hover:bg-slate-900"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin mr-2" size={16} />
              Spremanje...
            </>
          ) : (
            <>
              <Check size={16} className="mr-2" />
              Sačuvaj
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default LmxAvatarGenerator;

// "use client";

// import React, { useState, useRef } from "react";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { Loader2, Dice5, Save, X, Check } from "@/components/Common/UnifiedIconPack";
// import { toast } from "@/utils/toastBs";

// // --- CONFIG ---
// const OPTIONS = {
//   skinColors: ["#F3D4CF", "#E0B1A7", "#C68674", "#8D5524", "#FFDFC4", "#EDB999"],
//   bgColors: ["#B2EBF2", "#FFCCBC", "#C5CAE9", "#DCEDC8", "#F0F4C3", "#E1BEE7", "#FFFFFF", "#e2e8f0"],
//   hairColors: ["#2C3E50", "#E67E22", "#F1C40F", "#8E44AD", "#FFFFFF", "#34495E", "#5D4037", "#000000"],
//   shirtColors: ["#3498DB", "#E74C3C", "#2ECC71", "#9B59B6", "#34495E", "#1ABC9C", "#F39C12"],
// };

// // --- SVG SHAPES ---
// const FaceBase = ({ color }) => (
//   <g>
//     <rect x="35" y="70" width="30" height="30" fill={color} rx="10" />
//     <rect x="20" y="20" width="60" height="70" rx="25" ry="25" fill={color} />
//     <circle cx="18" cy="55" r="6" fill={color} />
//     <circle cx="82" cy="55" r="6" fill={color} />
//   </g>
// );

// const Eyes = ({ type }) => {
//   const stroke = "#2c3e50";
//   switch (type) {
//     case "happy":
//       return <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"><path d="M 30 50 Q 35 45 40 50" /><path d="M 60 50 Q 65 45 70 50" /></g>;
//     case "sleepy":
//       return <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"><line x1="30" y1="52" x2="40" y2="52" /><line x1="60" y1="52" x2="70" y2="52" /></g>;
//     case "glasses":
//       return <g><circle cx="35" cy="50" r="8" fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth="2"/><circle cx="65" cy="50" r="8" fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth="2"/><line x1="43" y1="50" x2="57" y2="50" stroke={stroke} strokeWidth="2"/><circle cx="35" cy="50" r="2" fill={stroke}/><circle cx="65" cy="50" r="2" fill={stroke}/></g>;
//     default:
//       return <g fill={stroke}><circle cx="35" cy="50" r="4" /><circle cx="65" cy="50" r="4" /></g>;
//   }
// };

// const Mouth = ({ type }) => {
//   const stroke = "#2c3e50";
//   switch (type) {
//     case "smile": return <path d="M 40 70 Q 50 80 60 70" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
//     case "sad": return <path d="M 40 75 Q 50 65 60 75" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
//     case "surprised": return <circle cx="50" cy="72" r="4" fill="none" stroke={stroke} strokeWidth="3" />;
//     default: return <line x1="42" y1="72" x2="58" y2="72" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
//   }
// };

// const Hair = ({ type, color }) => {
//   switch (type) {
//     case "short": return <path d="M 20 40 C 20 10, 80 10, 80 40 L 80 30 C 80 0, 20 0, 20 30 Z" fill={color} />;
//     case "long": return <rect x="15" y="20" width="70" height="80" rx="30" fill={color} />;
//     case "mohawk": return <path d="M 40 20 L 50 5 L 60 20 Z" fill={color} />;
//     case "curly": return <g fill={color}><circle cx="25" cy="25" r="10" /><circle cx="40" cy="15" r="12" /><circle cx="60" cy="15" r="12" /><circle cx="75" cy="25" r="10" /></g>;
//     default: return null;
//   }
// };

// const Shirt = ({ color }) => <path d="M 10 100 Q 50 80 90 100 L 90 100 L 10 100 Z" fill={color} />;

// // --- COMPONENT ---
// const LmxAvatarGenerator = ({ onSave, onCancel, isSaving }) => {
//   const svgRef = useRef(null);
  
//   const [config, setConfig] = useState({
//     skinColor: OPTIONS.skinColors[0],
//     bgColor: OPTIONS.bgColors[0],
//     hairColor: OPTIONS.hairColors[0],
//     shirtColor: OPTIONS.shirtColors[0],
//     hairType: "short",
//     eyeType: "default",
//     mouthType: "smile",
//   });

//   const randomize = () => {
//     setConfig({
//       skinColor: OPTIONS.skinColors[Math.floor(Math.random() * OPTIONS.skinColors.length)],
//       bgColor: OPTIONS.bgColors[Math.floor(Math.random() * OPTIONS.bgColors.length)],
//       hairColor: OPTIONS.hairColors[Math.floor(Math.random() * OPTIONS.hairColors.length)],
//       shirtColor: OPTIONS.shirtColors[Math.floor(Math.random() * OPTIONS.shirtColors.length)],
//       hairType: ["short", "long", "curly", "none"][Math.floor(Math.random() * 4)],
//       eyeType: ["default", "happy", "sleepy", "glasses"][Math.floor(Math.random() * 4)],
//       mouthType: ["smile", "sad", "neutral", "surprised"][Math.floor(Math.random() * 4)],
//     });
//   };

//   const handleExport = () => {
//     if (!svgRef.current) return;
    
//     // 1. Serialize SVG
//     const svgData = new XMLSerializer().serializeToString(svgRef.current);
//     const canvas = document.createElement("canvas");
//     const ctx = canvas.getContext("2d");
//     const img = new Image();
    
//     // Add size attributes if missing to ensure crisp render
//     const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
//     const url = URL.createObjectURL(svgBlob);

//     img.onload = () => {
//       // High resolution export
//       canvas.width = 500;
//       canvas.height = 500;
//       ctx.drawImage(img, 0, 0, 500, 500);
      
//       canvas.toBlob((blob) => {
//         if (blob) {
//           onSave(blob); // Pass the PNG blob back to parent
//         } else {
//           toast.error("Greška pri generisanju slike.");
//         }
//         URL.revokeObjectURL(url);
//       }, "image/png");
//     };
//     img.src = url;
//   };

//   return (
//     <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
//       {/* PREVIEW */}
//       <div className="p-6 bg-slate-50 flex flex-col items-center justify-center gap-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200">
//         <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md">
//           <svg ref={svgRef} viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
//             <rect width="100" height="100" fill={config.bgColor} />
//             {config.hairType === 'long' && <Hair type="long" color={config.hairColor} />}
//             <Shirt color={config.shirtColor} />
//             <FaceBase color={config.skinColor} />
//             <Mouth type={config.mouthType} />
//             <Eyes type={config.eyeType} />
//             {config.hairType !== 'long' && <Hair type={config.hairType} color={config.hairColor} />}
//             {config.hairType === 'long' && <path d="M 20 25 Q 50 35 80 25" fill="none" stroke={config.hairColor} strokeWidth="0" />}
//           </svg>
//         </div>
        
//         <div className="flex gap-2 w-full">
//            <Button variant="outline" onClick={randomize} className="flex-1 gap-2" disabled={isSaving}>
//              <Dice5 size={16} /> Random
//            </Button>
//         </div>
//       </div>

//       {/* CONTROLS */}
//       <div className="flex-1 p-4 md:p-6">
//         <div className="flex justify-between items-center mb-4">
//             <h3 className="font-bold text-lg text-slate-800">Dizajniraj Avatar</h3>
//             {onCancel && <Button variant="ghost" size="icon" onClick={onCancel}><X size={20}/></Button>}
//         </div>

//         <Tabs defaultValue="colors" className="w-full">
//           <TabsList className="w-full grid grid-cols-3 mb-4">
//              <TabsTrigger value="colors">Boje</TabsTrigger>
//              <TabsTrigger value="hair">Kosa</TabsTrigger>
//              <TabsTrigger value="face">Lice</TabsTrigger>
//           </TabsList>

//           <TabsContent value="colors" className="space-y-4">
//             <div className="space-y-2">
//                 <label className="text-xs font-semibold text-slate-500 uppercase">Koža</label>
//                 <div className="flex flex-wrap gap-2">
//                     {OPTIONS.skinColors.map(c => (
//                         <button key={c} onClick={() => setConfig({...config, skinColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.skinColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{background: c}} />
//                     ))}
//                 </div>
//             </div>
//             <div className="space-y-2">
//                 <label className="text-xs font-semibold text-slate-500 uppercase">Pozadina</label>
//                 <div className="flex flex-wrap gap-2">
//                     {OPTIONS.bgColors.map(c => (
//                         <button key={c} onClick={() => setConfig({...config, bgColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.bgColor === c ? 'border-primary scale-110' : 'border-gray-200'}`} style={{background: c}} />
//                     ))}
//                 </div>
//             </div>
//             <div className="space-y-2">
//                 <label className="text-xs font-semibold text-slate-500 uppercase">Majica</label>
//                 <div className="flex flex-wrap gap-2">
//                     {OPTIONS.shirtColors.map(c => (
//                         <button key={c} onClick={() => setConfig({...config, shirtColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.shirtColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{background: c}} />
//                     ))}
//                 </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="hair" className="space-y-4">
//             <div className="grid grid-cols-3 gap-2">
//                 {['short', 'long', 'curly', 'mohawk', 'none'].map(s => (
//                     <Button key={s} size="sm" variant={config.hairType === s ? "default" : "outline"} onClick={() => setConfig({...config, hairType: s})} className="capitalize">{s === 'none' ? 'Ćelav' : s}</Button>
//                 ))}
//             </div>
//             <div className="space-y-2 pt-2">
//                 <label className="text-xs font-semibold text-slate-500 uppercase">Boja Kose</label>
//                 <div className="flex flex-wrap gap-2">
//                     {OPTIONS.hairColors.map(c => (
//                         <button key={c} onClick={() => setConfig({...config, hairColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.hairColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{background: c}} />
//                     ))}
//                 </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="face" className="space-y-4">
//              <div className="space-y-2">
//                 <label className="text-xs font-semibold text-slate-500 uppercase">Oči</label>
//                 <div className="grid grid-cols-2 gap-2">
//                     {['default', 'happy', 'sleepy', 'glasses'].map(t => (
//                         <Button key={t} size="sm" variant={config.eyeType === t ? "default" : "outline"} onClick={() => setConfig({...config, eyeType: t})} className="capitalize">{t}</Button>
//                     ))}
//                 </div>
//              </div>
//              <div className="space-y-2">
//                 <label className="text-xs font-semibold text-slate-500 uppercase">Usta</label>
//                 <div className="grid grid-cols-2 gap-2">
//                     {['smile', 'sad', 'neutral', 'surprised'].map(t => (
//                         <Button key={t} size="sm" variant={config.mouthType === t ? "default" : "outline"} onClick={() => setConfig({...config, mouthType: t})} className="capitalize">{t}</Button>
//                     ))}
//                 </div>
//              </div>
//           </TabsContent>
//         </Tabs>

//         <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
//              <Button variant="outline" onClick={onCancel} disabled={isSaving}>Odustani</Button>
//              <Button onClick={handleExport} disabled={isSaving} className="gap-2">
//                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Check size={16}/>}
//                  {isSaving ? "Spremanje..." : "Postavi Avatar"}
//              </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LmxAvatarGenerator;
