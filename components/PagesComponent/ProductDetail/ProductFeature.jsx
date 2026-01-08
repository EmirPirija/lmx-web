import { Badge } from "@/components/ui/badge";
import { FaRegLightbulb, FaCheck, FaTimes } from "react-icons/fa";
import { isPdf, t } from "@/utils/index";
import { MdOutlineAttachFile, MdOpenInNew, MdCheckBox } from "react-icons/md";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";

const ProductFeature = ({ filteredFields }) => {
  const renderValue = (feature) => {
    const { type, value, translated_selected_values } = feature;

    // Checkbox type - Multiple items in column layout
    if (type === "checkbox") {
      const values = Array.isArray(translated_selected_values) 
        ? translated_selected_values 
        : translated_selected_values ? [translated_selected_values] : [];
      
      return (
        <div className="flex flex-col gap-2 w-full">
          {values.map((item, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg w-fit"
            >
              <div className="flex items-center justify-center w-4 h-4 bg-green-500 rounded">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-900">
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
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-blue-700"></div>
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
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-300 group"
          >
            <div className="p-1.5 bg-white rounded-md shadow-sm">
              <MdOutlineAttachFile className="text-red-600 text-lg" />
            </div>
            <span className="text-sm font-medium text-red-700">
              {t("viewPdf") || "View PDF"}
            </span>
            <MdOpenInNew className="text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
          <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-300 group">
            <CustomImage
              src={fileUrl}
              alt="Preview"
              width={80}
              height={80}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 flex items-center justify-center transition-all duration-300">
              <MdOpenInNew className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xl" />
            </div>
          </div>
        </CustomLink>
      );
    }

    // Number type
    if (type === "number") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
          <span className="text-sm font-semibold text-indigo-900">
            {translated_selected_values || value}
          </span>
        </div>
      );
    }

    // Textbox type
    if (type === "textbox") {
      return (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-900">
            {translated_selected_values || value}
          </span>
        </div>
      );
    }

    // Default text type
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <span className="text-sm font-medium text-gray-900">
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
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-item {
          animation: slideInUp 0.3s ease-out backwards;
        }

        .feature-item:hover {
          background: rgba(0, 0, 0, 0.02);
        }

        .feature-icon-wrapper {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-item:hover .feature-icon-wrapper {
          transform: scale(1.1);
        }
      `}</style>

      <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <FaRegLightbulb className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("highlights")}
              </h3>
              <p className="text-sm text-gray-600">
                {filteredFields?.length} {t("keyFeatures") || "Key Features"}
              </p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredFields?.map((feature, index) => {
              const isCheckbox = feature.type === "checkbox";
              const hasMultipleValues = isCheckbox && Array.isArray(feature.translated_selected_values) && feature.translated_selected_values.length > 3;

              return (
                <div
                  className={`feature-item flex flex-col gap-3 p-4 rounded-lg border border-gray-100 hover:border-blue-200 transition-all duration-300 ${
                    hasMultipleValues ? '' : 'sm:flex-row sm:items-center'
                  }`}
                  key={index}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  {/* Feature Label */}
                  <div className="flex items-center gap-3 sm:w-1/3 flex-shrink-0">
                    <div className="feature-icon-wrapper flex-shrink-0">
                      <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <CustomImage
                          src={feature?.image}
                          alt={feature?.translated_name || feature?.name}
                          height={24}
                          width={24}
                          className="aspect-square size-6"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700">
                        {feature?.translated_name || feature?.name}
                      </p>
                    </div>
                  </div>

                  {/* Feature Value */}
                  <div className="flex items-start sm:flex-1">
                    {renderValue(feature)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductFeature;