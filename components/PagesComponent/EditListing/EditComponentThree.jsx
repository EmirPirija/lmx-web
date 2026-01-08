import React, { useState } from 'react';
import { IoInformationCircleOutline } from "react-icons/io5";
import { HiOutlineUpload } from "react-icons/hi";
import { MdClose } from "react-icons/md";
import { toast } from "sonner";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";

const EditComponentThree = ({
  uploadedImages,
  setUploadedImages,
  OtherImages,
  setOtherImages,
  handleImageSubmit,
  handleGoBack,
  setDeleteImagesId,
}) => {
  const [isDraggingMain, setIsDraggingMain] = useState(false);
  const [isDraggingOther, setIsDraggingOther] = useState(false);

  // ✅ HELPER: Sigurno dobijanje URL-a slike (sprečava crash)
  const getImageUrl = (image) => {
    if (!image) return "";
    
    // Ako je nova slika (File/Blob)
    if (image instanceof File || image instanceof Blob) {
      return URL.createObjectURL(image);
    }
    
    // Ako je postojeća slika sa servera (String)
    if (typeof image === "string") {
      return image;
    }

    // Ako je objekt sa propertijem image (čest slučaj kod galerije sa API-ja)
    if (typeof image === "object" && image.image) {
      return image.image;
    }

    return "";
  };

  // Handle main image drop
  const handleMainImageDrop = (e) => {
    e.preventDefault();
    setIsDraggingMain(false);
    const file = e.dataTransfer?.files[0] || e.target?.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Pogrešan tip fajla. Molimo uploadujte sliku.');
      return;
    }
    setUploadedImages([file]);
  };

  // Handle other images drop
  const handleOtherImagesDrop = (e) => {
    e.preventDefault();
    setIsDraggingOther(false);
    const files = Array.from(e.dataTransfer?.files || e.target?.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    const remainingSlots = 5 - OtherImages.length;
    if (remainingSlots === 0) {
      toast.error("Dostigli ste maksimalan broj slika");
      return;
    }

    if (imageFiles.length > remainingSlots) {
      toast.error(`Možete dodati još samo ${remainingSlots} slika`);
      return;
    }

    setOtherImages(prev => [...prev, ...imageFiles]);
  };

  // ✅ Logika za brisanje slika (handla i ID-eve za API)
  const handleRemoveGalleryImage = (index) => {
    const imageToRemove = OtherImages[index];

    // Ako slika ima ID (stara slika sa servera), dodaj u listu za brisanje
    if (imageToRemove?.id) {
      setDeleteImagesId((prev) => {
        const currentIds = prev ? prev.split(',') : [];
        currentIds.push(imageToRemove.id);
        return currentIds.join(',');
      });
    }

    // Ukloni iz state-a
    setOtherImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* GLAVNA SLIKA */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold flex items-center gap-2">
          Glavna slika <span className="text-red-500">*</span>
        </label>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingMain(true); }}
          onDragLeave={() => setIsDraggingMain(false)}
          onDrop={handleMainImageDrop}
          className="relative"
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleMainImageDrop}
            className="hidden"
            id="main-image-input"
          />
          
          {uploadedImages.length === 0 ? (
            <label
              htmlFor="main-image-input"
              className={`block border-2 border-dashed rounded-xl p-8 min-h-[280px] cursor-pointer transition-all duration-300 ${
                isDraggingMain
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <HiOutlineUpload size={56} className="text-blue-500" />
                <div>
                  <p className="text-gray-700 mb-2 font-semibold text-lg">
                    {isDraggingMain ? "Spustite fajl ovdje" : "Prevucite sliku ovdje"}
                  </p>
                  <span className="text-blue-600 font-semibold text-base">Kliknite za upload</span>
                </div>
              </div>
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden shadow-lg group">
              <CustomImage
                width={591}
                height={280}
                className="rounded-xl object-cover aspect-[591/280] w-full"
                src={getImageUrl(uploadedImages[0])} // ✅ KORISTI HELPER
                alt="Main image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => setUploadedImages([])}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2.5 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                >
                  <MdClose size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DODATNE SLIKE (GALERIJA) */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 font-semibold text-sm">
          Dodatne slike
          <div className="relative group">
            <IoInformationCircleOutline size={20} className="text-gray-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl">
              Maksimum 5 dodatnih slika
            </div>
          </div>
        </label>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDraggingOther(true); }}
          onDragLeave={() => setIsDraggingOther(false)}
          onDrop={handleOtherImagesDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            multiple
            onChange={handleOtherImagesDrop}
            className="hidden"
            id="other-images-input"
          />

          {OtherImages.length < 5 && (
            <label
              htmlFor="other-images-input"
              className={`block border-2 border-dashed rounded-xl p-6 cursor-pointer mb-6 transition-all duration-300 ${
                isDraggingOther
                  ? 'border-blue-500 bg-blue-50 scale-105'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-3 text-center">
                <HiOutlineUpload size={28} className="text-blue-500" />
                <span className="text-gray-700 font-semibold text-base">
                  {isDraggingOther ? "Spustite slike ovdje" : "Dodajte još slika"} ({OtherImages.length}/5)
                </span>
              </div>
            </label>
          )}

          {/* Grid Prikaz Slika */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {OtherImages.map((file, index) => (
              <div
                key={index}
                className="relative rounded-xl overflow-hidden shadow-lg group aspect-square hover:scale-105 transition-transform duration-200"
              >
                <CustomImage
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  src={getImageUrl(file)} // ✅ KORISTI HELPER
                  alt={`gallery-${index}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handleRemoveGalleryImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200"
                  >
                    <MdClose size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex justify-between sm:justify-end gap-3">
          <button
            className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleGoBack}
          >
            Nazad
          </button>
          <button
            className="bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-base sm:text-lg font-medium hover:bg-primary/90 transition-colors shadow-md flex-1 sm:flex-none"
            onClick={handleImageSubmit}
          >
            Naprijed
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditComponentThree;