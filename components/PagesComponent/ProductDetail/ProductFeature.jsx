import React from 'react';
import { Badge } from "@/components/ui/badge";
import { FaRegLightbulb, FaCheck, FaTimes } from "react-icons/fa";
import { isPdf, t } from "@/utils/index";
import { MdOutlineAttachFile, MdOpenInNew, MdCheckBox } from "react-icons/md";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";

const ProductFeature = ({ filteredFields }) => {
  const renderValue = (feature) => {
    const { type, value, translated_selected_values } = feature;

    // Checkbox type - cleaner pills
    if (type === "checkbox") {
      const values = Array.isArray(translated_selected_values) 
        ? translated_selected_values 
        : translated_selected_values ? [translated_selected_values] : [];
      
      return (
        <div className="flex flex-wrap gap-2">
          {values.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-colors"
            >
              <FaCheck className="w-3 h-3 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">
                {item}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Radio type
    if (type === "radio") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-sm font-medium text-blue-900">
            {translated_selected_values}
          </span>
        </div>
      );
    }

    // Dropdown/Select type
    if (type === "dropdown" || type === "select") {
      const values = Array.isArray(translated_selected_values) 
        ? translated_selected_values 
        : [translated_selected_values];
      
      return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-full transition-colors">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <span className="text-sm font-medium text-purple-900">
            {values.join(", ")}
          </span>
        </div>
      );
    }

    // File input type
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-all group shadow-sm hover:shadow"
          >
            <MdOutlineAttachFile className="text-red-600 text-lg" />
            <span className="text-sm font-medium text-red-700">
              {t("viewPdf") || "View PDF"}
            </span>
            <MdOpenInNew className="text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-400 transition-all group shadow-sm hover:shadow">
            <CustomImage
              src={fileUrl}
              alt="Preview"
              width={80}
              height={80}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all">
              <MdOpenInNew className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-xl" />
            </div>
          </div>
        </CustomLink>
      );
    }

    // Number type
    if (type === "number") {
      return (
        <div className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-full transition-colors">
          <span className="text-sm font-semibold text-indigo-900">
            {translated_selected_values || value}
          </span>
        </div>
      );
    }

    // Textbox type
    if (type === "textbox") {
      return (
        <div className="inline-flex items-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors">
          <span className="text-sm font-medium text-slate-900">
            {translated_selected_values || value}
          </span>
        </div>
      );
    }

    // Default text type
    return (
      <div className="inline-flex items-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors">
        <span className="text-sm font-medium text-slate-900">
          {Array.isArray(translated_selected_values)
            ? translated_selected_values.join(", ")
            : translated_selected_values || value}
        </span>
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-card {
          animation: fadeInUp 0.4s ease-out backwards;
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.05) rotate(2deg);
        }

        .feature-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <FaRegLightbulb className="text-white text-2xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {t("highlights") || "Key Features"}
              </h3>
              <p className="text-sm text-blue-100">
                {filteredFields?.length} {t("keyFeatures") || "features"}
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="p-6 sm:p-8">
          <div className="space-y-4">
            {filteredFields?.map((feature, index) => (
              <div
                className="feature-card group"
                key={index}
                style={{
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all">
                  {/* Feature Label */}
                  <div className="flex items-center gap-3 sm:w-1/3 flex-shrink-0">
                    <div className="feature-icon flex-shrink-0">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                        <CustomImage
                          src={feature?.image}
                          alt={feature?.translated_name || feature?.name}
                          height={24}
                          width={24}
                          className="size-6"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {feature?.translated_name || feature?.name}
                    </p>
                  </div>

                  {/* Feature Value */}
                  <div className="flex items-start sm:flex-1 sm:justify-end">
                    {renderValue(feature)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductFeature;