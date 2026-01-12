import React from 'react';
import { FaCheck, FaRegCalendarCheck } from "react-icons/fa";
import { MdOpenInNew, MdOutlineAttachFile } from "react-icons/md";
import { isPdf, t } from "@/utils/index";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";

const ProductFeature = ({ filteredFields, productDetails }) => {
  
  if (!filteredFields || filteredFields.length === 0) {
    return null;
  }

  // Format datuma: DD.MM.YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
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

    // Checkbox - lista sa checkmark ikonama (bolji prikaz)
    if (type === "checkbox") {
      const values = Array.isArray(translated_selected_values) 
        ? translated_selected_values 
        : translated_selected_values ? [translated_selected_values] : [];
      
      if (values.length === 0) return <span className="text-sm text-gray-400">-</span>;
      
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-md"
            >
              <FaCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-medium text-emerald-900">
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
            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:underline"
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
            alt="Preview"
            width={60}
            height={60}
            className="object-cover rounded border border-gray-200 hover:border-gray-300"
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
      return <FaCheck className="text-green-600 text-lg" />;
    }

    // Default - text
    const displayValue = Array.isArray(translated_selected_values)
      ? translated_selected_values.filter(Boolean).join(", ")
      : translated_selected_values || value || '-';

    return (
      <span className="text-sm text-gray-900 font-medium">
        {displayValue}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Info Cards - Kompaktniji dizajn */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-200">
          {/* Stanje oglasa */}
          {statusField && (
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <p className="text-xs text-gray-500 mb-2">
                {statusField?.translated_name || statusField?.name}
              </p>
              <div className="font-semibold text-gray-900 text-sm">
                {statusField.translated_selected_values || statusField.value || '-'}
              </div>
            </div>
          )}

          {/* Broj pregleda */}
          {productDetails?.clicks !== undefined && (
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <p className="text-xs text-gray-500 mb-2">
                {"Broj pregleda"}
              </p>
              <div className="font-semibold text-gray-900 text-sm">
                {productDetails.clicks}
              </div>
            </div>
          )}

          {/* ID oglasa */}
          {productDetails?.id && (
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <p className="text-xs text-gray-500 mb-2">
                {t("adId") || "ID oglasa"}
              </p>
              <div className="font-semibold text-gray-900 text-sm">
                #{productDetails.id}
              </div>
            </div>
          )}

          {/* Datum objave */}
          {productDetails?.created_at && (
            <div className="p-4 hover:bg-gray-50 transition-colors">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <FaRegCalendarCheck className="text-xs" />
                {"Datum objave"}
              </p>
              <div className="font-semibold text-gray-900 text-sm">
                {formatDate(productDetails.created_at)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Specifikacije - tabela */}
      {specFields.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Specifikacije i oprema
            </h3>
          </div>

          {/* Table - 2 kolone */}
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
              {specFields.map((feature, index) => {
                const isCheckbox = feature.type === 'checkbox';
                
                return (
                  <div
                    key={index}
                    className={`
                      ${isCheckbox ? 'md:col-span-2' : ''}
                      flex ${isCheckbox ? 'flex-col gap-2' : 'items-center justify-between'} 
                      py-3 border-b border-gray-100 last:border-b-0
                    `}
                  >
                    {/* Label */}
                    <span className="text-sm text-gray-600 flex-shrink-0">
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