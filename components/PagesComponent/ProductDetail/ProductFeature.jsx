import React from 'react';
import { FaCheck, FaRegCalendarCheck } from "@/components/Common/UnifiedIconPack";
import { MdOpenInNew, MdOutlineAttachFile, MdVisibility, MdTag, MdSettings } from "@/components/Common/UnifiedIconPack";
import { isPdf } from "@/utils/index";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import CustomFieldSemanticIcon from "@/components/Common/CustomFieldSemanticIcon";
import { cn } from "@/lib/utils";

const ProductFeature = ({ filteredFields, productDetails }) => {
  if (!filteredFields || filteredFields.length === 0) return null;

  const getFieldLabel = (field) => field?.translated_name || field?.name || "Polje";

  const parseDateSafe = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const resolvePublishedAt = (item = {}) => {
    const candidates = [];

    if (item?.published_at) candidates.push(item.published_at);
    if (item?.created_at) candidates.push(item.created_at);
    if (item?.translated_item?.created_at) candidates.push(item.translated_item.created_at);

    if (Array.isArray(item?.translations)) {
      item.translations.forEach((translation) => {
        if (translation?.created_at) candidates.push(translation.created_at);
      });
    }

    const parsed = candidates
      .map((candidate) => parseDateSafe(candidate))
      .filter(Boolean)
      .sort((a, b) => a.getTime() - b.getTime());

    return parsed[0] || null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const statusField = filteredFields.find(feature => {
    const fieldName = (feature?.translated_name || feature?.name || '').toLowerCase();
    return fieldName.includes('stanje') || fieldName.includes('condition');
  });
  const publishedAt = resolvePublishedAt(productDetails);

  const renderValue = (feature) => {
    const { type, value, translated_selected_values } = feature;

    if (type === "checkbox") {
      const values = Array.isArray(translated_selected_values) ? translated_selected_values : translated_selected_values ? [translated_selected_values] : [];
      if (values.length === 0) return <span className="text-sm text-slate-400 dark:text-slate-500">—</span>;
      
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
              <FaCheck className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-xs font-semibold text-green-800 dark:text-green-300">{item}</span>
            </div>
          ))}
        </div>
      );
    }

    if (type === "fileinput") {
      const fileUrl = value?.[0];
      if (!fileUrl) return null;
      if (isPdf(fileUrl)) {
        return (
          <CustomLink href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            <MdOutlineAttachFile className="text-base" /> <span>Pogledaj PDF</span> <MdOpenInNew className="text-xs" />
          </CustomLink>
        );
      }
      return (
        <CustomLink href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block group">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <CustomImage src={fileUrl} alt="Pregled" width={60} height={60} className="object-cover group-hover:scale-110 transition-transform duration-300" />
          </div>
        </CustomLink>
      );
    }

    if (type === "radio" && ["Da", "Yes", "true", true].includes(translated_selected_values)) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-lg">
          <FaCheck className="text-green-600 dark:text-green-400 text-sm" />
          <span className="text-xs font-semibold text-green-800 dark:text-green-300">Da</span>
        </div>
      );
    }

    const displayValue = Array.isArray(translated_selected_values) ? translated_selected_values.filter(Boolean).join(", ") : translated_selected_values || value || '—';
    return <span className="text-sm text-slate-800 dark:text-slate-200 font-semibold">{displayValue}</span>;
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
      {/* Brze informacije */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800">
          {statusField && (
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">{statusField?.translated_name || statusField?.name}</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{statusField.translated_selected_values || statusField.value || '—'}</div>
            </div>
          )}
          {productDetails?.clicks !== undefined && (
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1"><MdVisibility className="text-xs" /> Pregledi</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{productDetails.clicks}</div>
            </div>
          )}
          {productDetails?.id && (
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1"><MdTag className="text-xs" /> ID oglasa</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{productDetails.id}</div>
            </div>
          )}
          {publishedAt && (
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1"><FaRegCalendarCheck className="text-xs" /> Objavljeno</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{formatDate(publishedAt)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Specifikacije */}
      {filteredFields.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 dark:bg-slate-800/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
              <MdSettings className="text-slate-600 dark:text-slate-300 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Karakteristike</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Specifikacije i oprema</p>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
              {filteredFields.map((feature, index) => {
                const isCheckbox = feature.type === 'checkbox';
                const fieldLabel = getFieldLabel(feature);
                return (
                  <div key={index} className={`flex ${isCheckbox ? 'flex-col gap-2 pt-2 pb-4' : 'items-center justify-between py-3.5'} border-b border-slate-100 dark:border-slate-800 last:border-b-0 ${isCheckbox ? 'md:col-span-2' : ''}`}>
                    <span className="inline-flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400 flex-shrink-0">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border p-1"
                      >
                        <CustomFieldSemanticIcon fieldLabel={fieldLabel} className="w-[17px] h-[17px]" />
                      </span>
                      <span>{fieldLabel}</span>
                    </span>
                    <div className={cn(isCheckbox ? 'w-full mt-1' : 'text-right')}>{renderValue(feature)}</div>
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
