import React from 'react';
import { FaCheck, FaRegCalendarCheck } from "react-icons/fa";
import { MdOpenInNew, MdOutlineAttachFile, MdVisibility, MdTag, MdSettings } from "react-icons/md";
import { isPdf } from "@/utils/index";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
 
const ProductFeature = ({ filteredFields, productDetails }) => {
  
  if (!filteredFields || filteredFields.length === 0) {
    return null;
  }
 
  // Format datuma: DD. mjesec YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate();
    const months = [
      "januar", "februar", "mart", "april", "maj", "juni",
      "juli", "august", "septembar", "oktobar", "novembar", "decembar"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}. ${month} ${year}`;
  };
 
  // Izvuci "Stanje oglasa" iz custom fields (ako postoji)
  const statusField = filteredFields.find(feature => {
    const fieldName = (feature?.translated_name || feature?.name || '').toLowerCase();
    return fieldName.includes('stanje') || fieldName.includes('condition');
  });
 
  // Sva polja idu u specifikacije
  const specFields = filteredFields;
 
  const renderValue = (feature) => {
    const { type, value, translated_selected_values } = feature;
 
    // Checkbox - lista sa checkmark ikonama
    if (type === "checkbox") {
      const values = Array.isArray(translated_selected_values) 
        ? translated_selected_values 
        : translated_selected_values ? [translated_selected_values] : [];
      
      if (values.length === 0) return <span className="text-sm text-slate-400">—</span>;
      
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg"
            >
              <FaCheck className="w-3 h-3 text-green-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-green-800">
                {item}
              </span>
            </div>
          ))}
        </div>
      );
    }
 
    // File input
    if (type === "fileinput") {
      const fileUrl = value?.[0];
      if (!fileUrl) return null;
 
      const isPdfFile = isPdf(fileUrl);
 
      if (isPdfFile) {
        return (
          <CustomLink
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <MdOutlineAttachFile className="text-base" />
            <span>Pogledaj PDF</span>
            <MdOpenInNew className="text-xs" />
          </CustomLink>
        );
      }
 
      return (
        <CustomLink
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <CustomImage
            src={fileUrl}
            alt="Pregled"
            width={60}
            height={60}
            className="object-cover rounded-lg border border-slate-200 hover:border-primary transition-colors"
          />
        </CustomLink>
      );
    }
 
    // Boolean/Checkmark vrijednosti
    if (
      type === "radio" && 
      (translated_selected_values === "Da" || 
       translated_selected_values === "Yes" || 
       translated_selected_values === "true" ||
       translated_selected_values === true)
    ) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
          <FaCheck className="text-green-600 text-sm" />
          <span className="text-xs font-semibold text-green-800">Da</span>
        </div>
      );
    }
 
    // Default - text
    const displayValue = Array.isArray(translated_selected_values)
      ? translated_selected_values.filter(Boolean).join(", ")
      : translated_selected_values || value || '—';
 
    return (
      <span className="text-sm text-slate-800 font-semibold">
        {displayValue}
      </span>
    );
  };
 
  return (
    <div className="space-y-5">
      {/* Brze informacije */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100">
          {/* Stanje oglasa */}
          {statusField && (
            <div className="p-4 hover:bg-slate-50 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium">
                {statusField?.translated_name || statusField?.name}
              </p>
              <div className="font-bold text-slate-800 text-sm">
                {statusField.translated_selected_values || statusField.value || '—'}
              </div>
            </div>
          )}
 
          {/* Broj pregleda */}
          {productDetails?.clicks !== undefined && (
            <div className="p-4 hover:bg-slate-50 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium flex items-center gap-1">
                <MdVisibility className="text-xs" />
                Pregledi
              </p>
              <div className="font-bold text-slate-800 text-sm">
                {productDetails.clicks}
              </div>
            </div>
          )}
 
          {/* ID oglasa */}
          {productDetails?.id && (
            <div className="p-4 hover:bg-slate-50 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium flex items-center gap-1">
                <MdTag className="text-xs" />
                ID oglasa
              </p>
              <div className="font-bold text-slate-800 text-sm">
                #{productDetails.id}
              </div>
            </div>
          )}
 
          {/* Datum objave */}
          {productDetails?.created_at && (
            <div className="p-4 hover:bg-slate-50 transition-colors">
              <p className="text-xs text-slate-500 mb-1.5 font-medium flex items-center gap-1">
                <FaRegCalendarCheck className="text-xs" />
                Objavljeno
              </p>
              <div className="font-bold text-slate-800 text-sm">
                {formatDate(productDetails.created_at)}
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Specifikacije - tabela */}
      {specFields.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <MdSettings className="text-slate-600 text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Karakteristike
                </h3>
                <p className="text-xs text-slate-500">Specifikacije i oprema</p>
              </div>
            </div>
          </div>
 
          {/* Tabela - 2 kolone */}
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {specFields.map((feature, index) => {
                const isCheckbox = feature.type === 'checkbox';
                
                return (
                  <div
                    key={index}
                    className={`
                      ${isCheckbox ? 'md:col-span-2' : ''}
                      flex ${isCheckbox ? 'flex-col gap-2' : 'items-center justify-between'} 
                      py-3.5 border-b border-slate-100 last:border-b-0
                    `}
                  >
                    {/* Label */}
                    <span className="text-sm text-slate-500 flex-shrink-0">
                      {feature?.translated_name || feature?.name}
                    </span>
                    
                    {/* Value */}
                    <div className={`${isCheckbox ? 'w-full mt-1' : 'text-right'}`}>
                      {renderValue(feature)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
 
export default ProductFeature;