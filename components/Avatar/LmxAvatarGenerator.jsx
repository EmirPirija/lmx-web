"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Dice5, Save, X, Check } from "lucide-react";
import { toast } from "sonner";

// --- CONFIG ---
const OPTIONS = {
  skinColors: ["#F3D4CF", "#E0B1A7", "#C68674", "#8D5524", "#FFDFC4", "#EDB999"],
  bgColors: ["#B2EBF2", "#FFCCBC", "#C5CAE9", "#DCEDC8", "#F0F4C3", "#E1BEE7", "#FFFFFF", "#e2e8f0"],
  hairColors: ["#2C3E50", "#E67E22", "#F1C40F", "#8E44AD", "#FFFFFF", "#34495E", "#5D4037", "#000000"],
  shirtColors: ["#3498DB", "#E74C3C", "#2ECC71", "#9B59B6", "#34495E", "#1ABC9C", "#F39C12"],
};

// --- SVG SHAPES ---
const FaceBase = ({ color }) => (
  <g>
    <rect x="35" y="70" width="30" height="30" fill={color} rx="10" />
    <rect x="20" y="20" width="60" height="70" rx="25" ry="25" fill={color} />
    <circle cx="18" cy="55" r="6" fill={color} />
    <circle cx="82" cy="55" r="6" fill={color} />
  </g>
);

const Eyes = ({ type }) => {
  const stroke = "#2c3e50";
  switch (type) {
    case "happy":
      return <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"><path d="M 30 50 Q 35 45 40 50" /><path d="M 60 50 Q 65 45 70 50" /></g>;
    case "sleepy":
      return <g fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round"><line x1="30" y1="52" x2="40" y2="52" /><line x1="60" y1="52" x2="70" y2="52" /></g>;
    case "glasses":
      return <g><circle cx="35" cy="50" r="8" fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth="2"/><circle cx="65" cy="50" r="8" fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth="2"/><line x1="43" y1="50" x2="57" y2="50" stroke={stroke} strokeWidth="2"/><circle cx="35" cy="50" r="2" fill={stroke}/><circle cx="65" cy="50" r="2" fill={stroke}/></g>;
    default:
      return <g fill={stroke}><circle cx="35" cy="50" r="4" /><circle cx="65" cy="50" r="4" /></g>;
  }
};

const Mouth = ({ type }) => {
  const stroke = "#2c3e50";
  switch (type) {
    case "smile": return <path d="M 40 70 Q 50 80 60 70" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
    case "sad": return <path d="M 40 75 Q 50 65 60 75" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
    case "surprised": return <circle cx="50" cy="72" r="4" fill="none" stroke={stroke} strokeWidth="3" />;
    default: return <line x1="42" y1="72" x2="58" y2="72" stroke={stroke} strokeWidth="3" strokeLinecap="round" />;
  }
};

const Hair = ({ type, color }) => {
  switch (type) {
    case "short": return <path d="M 20 40 C 20 10, 80 10, 80 40 L 80 30 C 80 0, 20 0, 20 30 Z" fill={color} />;
    case "long": return <rect x="15" y="20" width="70" height="80" rx="30" fill={color} />;
    case "mohawk": return <path d="M 40 20 L 50 5 L 60 20 Z" fill={color} />;
    case "curly": return <g fill={color}><circle cx="25" cy="25" r="10" /><circle cx="40" cy="15" r="12" /><circle cx="60" cy="15" r="12" /><circle cx="75" cy="25" r="10" /></g>;
    default: return null;
  }
};

const Shirt = ({ color }) => <path d="M 10 100 Q 50 80 90 100 L 90 100 L 10 100 Z" fill={color} />;

// --- COMPONENT ---
const LmxAvatarGenerator = ({ onSave, onCancel, isSaving }) => {
  const svgRef = useRef(null);
  
  const [config, setConfig] = useState({
    skinColor: OPTIONS.skinColors[0],
    bgColor: OPTIONS.bgColors[0],
    hairColor: OPTIONS.hairColors[0],
    shirtColor: OPTIONS.shirtColors[0],
    hairType: "short",
    eyeType: "default",
    mouthType: "smile",
  });

  const randomize = () => {
    setConfig({
      skinColor: OPTIONS.skinColors[Math.floor(Math.random() * OPTIONS.skinColors.length)],
      bgColor: OPTIONS.bgColors[Math.floor(Math.random() * OPTIONS.bgColors.length)],
      hairColor: OPTIONS.hairColors[Math.floor(Math.random() * OPTIONS.hairColors.length)],
      shirtColor: OPTIONS.shirtColors[Math.floor(Math.random() * OPTIONS.shirtColors.length)],
      hairType: ["short", "long", "curly", "none"][Math.floor(Math.random() * 4)],
      eyeType: ["default", "happy", "sleepy", "glasses"][Math.floor(Math.random() * 4)],
      mouthType: ["smile", "sad", "neutral", "surprised"][Math.floor(Math.random() * 4)],
    });
  };

  const handleExport = () => {
    if (!svgRef.current) return;
    
    // 1. Serialize SVG
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Add size attributes if missing to ensure crisp render
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // High resolution export
      canvas.width = 500;
      canvas.height = 500;
      ctx.drawImage(img, 0, 0, 500, 500);
      
      canvas.toBlob((blob) => {
        if (blob) {
          onSave(blob); // Pass the PNG blob back to parent
        } else {
          toast.error("Greška pri generisanju slike.");
        }
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = url;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
      {/* PREVIEW */}
      <div className="p-6 bg-slate-50 flex flex-col items-center justify-center gap-6 md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200">
        <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-md">
          <svg ref={svgRef} viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill={config.bgColor} />
            {config.hairType === 'long' && <Hair type="long" color={config.hairColor} />}
            <Shirt color={config.shirtColor} />
            <FaceBase color={config.skinColor} />
            <Mouth type={config.mouthType} />
            <Eyes type={config.eyeType} />
            {config.hairType !== 'long' && <Hair type={config.hairType} color={config.hairColor} />}
            {config.hairType === 'long' && <path d="M 20 25 Q 50 35 80 25" fill="none" stroke={config.hairColor} strokeWidth="0" />}
          </svg>
        </div>
        
        <div className="flex gap-2 w-full">
           <Button variant="outline" onClick={randomize} className="flex-1 gap-2" disabled={isSaving}>
             <Dice5 size={16} /> Random
           </Button>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">Dizajniraj Avatar</h3>
            {onCancel && <Button variant="ghost" size="icon" onClick={onCancel}><X size={20}/></Button>}
        </div>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4">
             <TabsTrigger value="colors">Boje</TabsTrigger>
             <TabsTrigger value="hair">Kosa</TabsTrigger>
             <TabsTrigger value="face">Lice</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4">
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Koža</label>
                <div className="flex flex-wrap gap-2">
                    {OPTIONS.skinColors.map(c => (
                        <button key={c} onClick={() => setConfig({...config, skinColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.skinColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{background: c}} />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Pozadina</label>
                <div className="flex flex-wrap gap-2">
                    {OPTIONS.bgColors.map(c => (
                        <button key={c} onClick={() => setConfig({...config, bgColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.bgColor === c ? 'border-primary scale-110' : 'border-gray-200'}`} style={{background: c}} />
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Majica</label>
                <div className="flex flex-wrap gap-2">
                    {OPTIONS.shirtColors.map(c => (
                        <button key={c} onClick={() => setConfig({...config, shirtColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.shirtColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{background: c}} />
                    ))}
                </div>
            </div>
          </TabsContent>

          <TabsContent value="hair" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                {['short', 'long', 'curly', 'mohawk', 'none'].map(s => (
                    <Button key={s} size="sm" variant={config.hairType === s ? "default" : "outline"} onClick={() => setConfig({...config, hairType: s})} className="capitalize">{s === 'none' ? 'Ćelav' : s}</Button>
                ))}
            </div>
            <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Boja Kose</label>
                <div className="flex flex-wrap gap-2">
                    {OPTIONS.hairColors.map(c => (
                        <button key={c} onClick={() => setConfig({...config, hairColor: c})} className={`w-8 h-8 rounded-full border-2 ${config.hairColor === c ? 'border-primary scale-110' : 'border-transparent'}`} style={{background: c}} />
                    ))}
                </div>
            </div>
          </TabsContent>

          <TabsContent value="face" className="space-y-4">
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Oči</label>
                <div className="grid grid-cols-2 gap-2">
                    {['default', 'happy', 'sleepy', 'glasses'].map(t => (
                        <Button key={t} size="sm" variant={config.eyeType === t ? "default" : "outline"} onClick={() => setConfig({...config, eyeType: t})} className="capitalize">{t}</Button>
                    ))}
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase">Usta</label>
                <div className="grid grid-cols-2 gap-2">
                    {['smile', 'sad', 'neutral', 'surprised'].map(t => (
                        <Button key={t} size="sm" variant={config.mouthType === t ? "default" : "outline"} onClick={() => setConfig({...config, mouthType: t})} className="capitalize">{t}</Button>
                    ))}
                </div>
             </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
             <Button variant="outline" onClick={onCancel} disabled={isSaving}>Odustani</Button>
             <Button onClick={handleExport} disabled={isSaving} className="gap-2">
                 {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Check size={16}/>}
                 {isSaving ? "Spremanje..." : "Postavi Avatar"}
             </Button>
        </div>
      </div>
    </div>
  );
};

export default LmxAvatarGenerator;