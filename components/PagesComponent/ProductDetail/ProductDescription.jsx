import { useEffect, useRef, useState } from "react";
import parse from "html-react-parser";
import { t } from "@/utils";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { MdDescription } from "react-icons/md";

const ProductDescription = ({ productDetails }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const descriptionRef = useRef(null);

  const translated_item = productDetails?.translated_item;

  const fullDescription =
    translated_item?.description?.replace(/\n/g, "<br />") ||
    productDetails?.description?.replace(/\n/g, "<br />");

  useEffect(() => {
    const descriptionBody = descriptionRef.current;
    if (descriptionBody) {
      setIsOverflowing(
        descriptionBody.scrollHeight > descriptionBody.clientHeight
      );
    }
  }, [fullDescription]);

  const toggleDescription = () => {
    setShowFullDescription((prev) => !prev);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes expandHeight {
          from {
            max-height: 72px;
          }
          to {
            max-height: 2000px;
          }
        }

        .description-expand {
          animation: expandHeight 0.4s ease-out;
        }

        .fade-overlay {
          background: linear-gradient(to bottom, transparent 0%, white 100%);
          pointer-events: none;
        }
      `}</style>

      <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <MdDescription className="text-gray-700 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {t("description")}
              </h3>
            </div>
          </div>
        </div>

        {/* Description Content */}
        <div className="p-6 relative">
          <div
            className={`${
              showFullDescription ? "max-h-none description-expand" : "max-h-[250px]"
            } prose prose-sm lg:prose-base max-w-none overflow-hidden transition-all duration-300`}
            ref={descriptionRef}
          >
            <div className="text-gray-700 leading-relaxed">
              {parse(fullDescription || "")}
            </div>
          </div>

          {/* Fade Overlay when collapsed */}
          {!showFullDescription && isOverflowing && (
            <div className="fade-overlay absolute bottom-0 left-0 right-0 h-16"></div>
          )}
        </div>

        {/* See More/Less Button */}
        {isOverflowing && (
          <div className="px-6 pb-4">
            <button
              onClick={toggleDescription}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-lg transition-all duration-300 group"
            >
              <span className="text-sm font-semibold text-blue-700">
                {showFullDescription ? t("seeLess") : t("seeMore")}
              </span>
              {showFullDescription ? (
                <FaChevronUp className="text-blue-600 text-sm group-hover:-translate-y-0.5 transition-transform duration-300" />
              ) : (
                <FaChevronDown className="text-blue-600 text-sm group-hover:translate-y-0.5 transition-transform duration-300" />
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductDescription;