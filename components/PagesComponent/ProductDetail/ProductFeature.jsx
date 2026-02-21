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
  const normalizeLabel = (value = "") =>
    String(value)
      .toLowerCase()
      .replace(/[čć]/g, "c")
      .replace(/đ/g, "dj")
      .replace(/[š]/g, "s")
      .replace(/[ž]/g, "z")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

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
  const hasViewsSummary = productDetails?.clicks !== undefined;
  const hasIdSummary = Boolean(productDetails?.id);
  const hasPublishedSummary = Boolean(publishedAt);

  const shouldHideAsSummaryDuplicate = (feature) => {
    const key = normalizeLabel(getFieldLabel(feature));
    if (!key) return false;

    if (statusField?.id && feature?.id === statusField.id) return true;
    if (statusField && (key.includes("stanje oglasa") || key === "stanje" || key.includes("condition"))) return true;
    if (hasViewsSummary && (key.includes("pregledi") || key.includes("views"))) return true;
    if (hasIdSummary && (key === "id" || key.includes("id oglasa") || key.includes("ad id"))) return true;
    if (hasPublishedSummary && (key.includes("objavljeno") || key.includes("datum objave") || key.includes("posted"))) return true;

    return false;
  };

  const visibleFeatureFields = filteredFields.filter((feature) => !shouldHideAsSummaryDuplicate(feature));
  const dedupedFeatureFields = visibleFeatureFields.filter((feature, index, list) => {
    const currentKey = normalizeLabel(getFieldLabel(feature));
    if (!currentKey) return true;
    return index === list.findIndex((candidate) => normalizeLabel(getFieldLabel(candidate)) === currentKey);
  });

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
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Eye-Fill--Streamline-Mingcute-Fill" height="20" width="20">

  <g fill="none" fill-rule="evenodd">
    <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" stroke-width="0.6667"></path>
    <path fill="#0ab6af" d="M8 2.6666666666666665C6.1419999999999995 2.6666666666666665 4.491333333333333 3.504666666666666 3.316 4.542 2.7266666666666666 5.062666666666667 2.2399999999999998 5.6466666666666665 1.8973333333333333 6.229333333333333 1.5599999999999998 6.800666666666666 1.3333333333333333 7.42 1.3333333333333333 8c0 0.58 0.22666666666666668 1.1993333333333331 0.564 1.7706666666666666 0.3426666666666667 0.582 0.8286666666666667 1.1666666666666665 1.4186666666666667 1.6873333333333334C4.491333333333333 12.495333333333331 6.142666666666667 13.333333333333332 8 13.333333333333332c1.8579999999999999 0 3.5086666666666666 -0.8379999999999999 4.683999999999999 -1.8753333333333333 0.59 -0.5206666666666666 1.076 -1.1053333333333333 1.4186666666666667 -1.6873333333333334C14.44 9.199333333333332 14.666666666666666 8.579999999999998 14.666666666666666 8c0 -0.58 -0.22666666666666668 -1.1993333333333331 -0.564 -1.7706666666666666 -0.3426666666666667 -0.582 -0.8286666666666667 -1.1666666666666665 -1.4186666666666667 -1.6873333333333334C11.508666666666667 3.504666666666666 9.857333333333333 2.6666666666666665 8 2.6666666666666665Zm1.3333333333333333 5.333333333333333c0.24 0 0.4646666666666666 -0.06333333333333332 0.6593333333333333 -0.174A2 2 0 1 1 8.173333333333332 6.006666666666666 1.3333333333333333 1.3333333333333333 0 0 0 9.333333333333332 8Z" stroke-width="0.6667"></path>
  </g>
</svg> Pregledi</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{productDetails.clicks}</div>
            </div>
          )}
          {productDetails?.id && (
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Hashtag-Fill--Streamline-Mingcute-Fill" height="20" width="20">

  <g fill="none" fill-rule="evenodd">
    <path d="M16 0v16H0V0h16ZM8.395333333333333 15.505333333333333l-0.007333333333333332 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023333333333333334c-0.006666666666666666 -0.0026666666666666666 -0.012666666666666666 -0.0006666666666666666 -0.016 0.003333333333333333l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.011333333333333334 -0.011999999999999999Zm0.17666666666666667 -0.07533333333333334 -0.008666666666666666 0.0013333333333333333 -0.12333333333333332 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.004666666666666666 0.134 0.062c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665Zm-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.0026666666666666666 -0.007333333333333332 0.011333333333333334 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666 -0.12266666666666666 -0.06133333333333333Z" stroke-width="0.6667"></path>
    <path fill="#0ab6af" d="M6.457333333333333 1.6746666666666665a1 1 0 0 1 0.8686666666666666 1.1159999999999999L7.091333333333333 4.666666666666666h2.6506666666666665l0.266 -2.1239999999999997a1 1 0 0 1 1.9846666666666666 0.248L11.758 4.666666666666666H13.333333333333332a1 1 0 0 1 0 2h-1.8253333333333333l-0.3333333333333333 2.6666666666666665H13a1 1 0 0 1 0 2h-2.075333333333333l-0.2653333333333333 2.1239999999999997a1 1 0 0 1 -1.9846666666666666 -0.248L8.908666666666665 11.333333333333332H6.258666666666667l-0.2653333333333333 2.1239999999999997a1 1 0 1 1 -1.9846666666666666 -0.248L4.242 11.333333333333332H3a1 1 0 1 1 0 -2h1.492l0.3333333333333333 -2.6666666666666665H3.333333333333333a1 1 0 1 1 0 -2h1.742l0.266 -2.1239999999999997A1 1 0 0 1 6.457333333333333 1.6733333333333331ZM9.16 9.333333333333332l0.3333333333333333 -2.6666666666666665h-2.651333333333333l-0.3333333333333333 2.6666666666666665h2.6506666666666665Z" stroke-width="0.6667"></path>
  </g>
</svg> ID oglasa</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{productDetails.id}</div>
            </div>
          )}
          {publishedAt && (
            <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Calendar-Time-Add-Fill--Streamline-Mingcute-Fill" height="20" width="20">
  <g fill="none" fill-rule="evenodd">
    <path d="M16 0v16H0V0zM8.395999999999999 15.505333333333333l-0.008 0.0013333333333333333 -0.047333333333333324 0.023333333333333334 -0.013333333333333332 0.0026666666666666666 -0.009333333333333332 -0.0026666666666666666 -0.047333333333333324 -0.023999999999999997c-0.006666666666666666 -0.002 -0.012666666666666666 0 -0.016 0.004l-0.0026666666666666666 0.006666666666666666 -0.011333333333333334 0.2853333333333333 0.003333333333333333 0.013333333333333332 0.006666666666666666 0.008666666666666666 0.06933333333333333 0.049333333333333326 0.009999999999999998 0.0026666666666666666 0.008 -0.0026666666666666666 0.06933333333333333 -0.049333333333333326 0.008 -0.010666666666666666 0.0026666666666666666 -0.011333333333333334 -0.011333333333333334 -0.2846666666666666c-0.0013333333333333333 -0.006666666666666666 -0.005999999999999999 -0.011333333333333334 -0.010666666666666666 -0.011999999999999999m0.176 -0.07533333333333334 -0.009333333333333332 0.0013333333333333333 -0.12266666666666666 0.062 -0.006666666666666666 0.006666666666666666 -0.002 0.007333333333333332 0.011999999999999999 0.2866666666666666 0.003333333333333333 0.008 0.005333333333333333 0.005333333333333333 0.134 0.06133333333333333c0.008 0.0026666666666666666 0.015333333333333332 0 0.019333333333333334 -0.005333333333333333l0.0026666666666666666 -0.009333333333333332 -0.02266666666666667 -0.4093333333333333c-0.002 -0.008 -0.006666666666666666 -0.013333333333333332 -0.013333333333333332 -0.014666666666666665m-0.4766666666666666 0.0013333333333333333a0.015333333333333332 0.015333333333333332 0 0 0 -0.018 0.004l-0.004 0.009333333333333332 -0.02266666666666667 0.4093333333333333c0 0.008 0.004666666666666666 0.013333333333333332 0.011333333333333334 0.016l0.009999999999999998 -0.0013333333333333333 0.134 -0.062 0.006666666666666666 -0.005333333333333333 0.002 -0.007333333333333332 0.011999999999999999 -0.2866666666666666 -0.002 -0.008 -0.006666666666666666 -0.006666666666666666z" stroke-width="0.6667"></path>
    <path fill="#0ab6af" d="M10.666666666666666 2a0.6666666666666666 0.6666666666666666 0 0 1 0.6666666666666666 0.6666666666666666v0.6666666666666666h1.3333333333333333a1.3333333333333333 1.3333333333333333 0 0 1 1.3333333333333333 1.3333333333333333v3.685333333333333A4 4 0 0 0 8.352 14H3.333333333333333a1.3333333333333333 1.3333333333333333 0 0 1 -1.3333333333333333 -1.3333333333333333V4.666666666666666a1.3333333333333333 1.3333333333333333 0 0 1 1.3333333333333333 -1.3333333333333333h1.3333333333333333V2.6666666666666665a0.6666666666666666 0.6666666666666666 0 0 1 1.3333333333333333 0v0.6666666666666666h4V2.6666666666666665a0.6666666666666666 0.6666666666666666 0 0 1 0.6666666666666666 -0.6666666666666666m0.6666666666666666 6.666666666666666a2.6666666666666665 2.6666666666666665 0 1 1 0 5.333333333333333 2.6666666666666665 2.6666666666666665 0 0 1 0 -5.333333333333333m0 1a0.6666666666666666 0.6666666666666666 0 0 0 -0.6619999999999999 0.5886666666666667L10.666666666666666 10.333333333333332V11.333333333333332a0.6666666666666666 0.6666666666666666 0 0 0 0.5886666666666667 0.6619999999999999L11.333333333333332 12h0.6666666666666666a0.6666666666666666 0.6666666666666666 0 0 0 0.078 -1.3286666666666667L12 10.666666666666666v-0.3333333333333333a0.6666666666666666 0.6666666666666666 0 0 0 -0.6666666666666666 -0.6666666666666666M5.666666666666666 9.333333333333332H5.333333333333333a0.6666666666666666 0.6666666666666666 0 1 0 0 1.3333333333333333h0.3333333333333333a0.6666666666666666 0.6666666666666666 0 1 0 0 -1.3333333333333333m1.6666666666666665 -2.6666666666666665H5.333333333333333a0.6666666666666666 0.6666666666666666 0 0 0 -0.078 1.3286666666666667L5.333333333333333 8h2a0.6666666666666666 0.6666666666666666 0 0 0 0.078 -1.3286666666666667z" stroke-width="0.6667"></path>
  </g>
</svg> Objavljeno</p>
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{formatDate(publishedAt)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Specifikacije */}
      {dedupedFeatureFields.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="rounded-xl border border-slate-100 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <MdSettings className="text-slate-600 dark:text-slate-300 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Karakteristike</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Specifikacije i oprema</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {dedupedFeatureFields.length}
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {dedupedFeatureFields.map((feature, index) => {
                const isCheckbox = feature.type === 'checkbox';
                const fieldLabel = getFieldLabel(feature);
                return (
                  <div
                    key={index}
                    className={cn(
                      "rounded-2xl border border-slate-200/80 bg-gradient-to-r from-white via-slate-50/70 to-white px-3.5 py-3 transition-all hover:border-primary/40 hover:bg-primary/[0.03] dark:border-slate-700/70 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-800/80 dark:hover:bg-primary/10",
                      isCheckbox && "md:col-span-2"
                    )}
                  >
                    <div className={cn("flex items-start justify-between gap-3", isCheckbox && "flex-col")}>
                      <span className="inline-flex items-center gap-2.5 text-sm text-slate-500 dark:text-slate-400">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                          <CustomFieldSemanticIcon fieldLabel={fieldLabel} className="w-[17px] h-[17px]" />
                        </span>
                        <span className="font-semibold">{fieldLabel}</span>
                      </span>
                      <div className={cn(isCheckbox ? "w-full pt-1" : "min-w-0 text-right")}>{renderValue(feature)}</div>
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
