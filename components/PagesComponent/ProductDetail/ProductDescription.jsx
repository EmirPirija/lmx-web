import { useEffect, useRef, useState } from "react";
import parse from "html-react-parser";
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
 
      <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 via-gray-50 to-zinc-50 px-5 lg:px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <MdDescription className="text-slate-600 text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Opis oglasa
              </h3>
              <p className="text-xs text-slate-500">Detaljne informacije o artiklu</p>
            </div>
          </div>
        </div>
 
        {/* Sadržaj opisa */}
        <div className="p-5 lg:p-6 relative">
          <div
            className={`${
              showFullDescription ? "max-h-none description-expand" : "max-h-[250px]"
            } prose prose-sm lg:prose-base max-w-none overflow-hidden transition-all duration-300`}
            ref={descriptionRef}
          >
            <div className="text-slate-700 leading-relaxed">
              {parse(fullDescription || "<p class='text-slate-400 italic'>Opis nije dostupan za ovaj oglas.</p>")}
            </div>
          </div>
 
          {/* Fade Overlay kada je skupljeno */}
          {!showFullDescription && isOverflowing && (
            <div className="fade-overlay absolute bottom-0 left-0 right-0 h-20"></div>
          )}
        </div>
 
        {/* Dugme Prikaži više/manje */}
        {isOverflowing && (
          <div className="px-5 lg:px-6 pb-5">
            <button
              onClick={toggleDescription}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15 border border-primary/20 rounded-xl transition-all duration-300 group"
            >
              <span className="text-sm font-bold text-primary">
                {showFullDescription ? "Prikaži manje" : "Prikaži više"}
              </span>
              {showFullDescription ? (
                <FaChevronUp className="text-primary text-sm group-hover:-translate-y-0.5 transition-transform duration-300" />
              ) : (
                <FaChevronDown className="text-primary text-sm group-hover:translate-y-0.5 transition-transform duration-300" />
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
 
export default ProductDescription;