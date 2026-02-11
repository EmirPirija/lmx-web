'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HiOutlinePhotograph, HiX } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import StarRatingInput from '../../PagesComponent/Reviews/StartRatingInput';
import { addItemReviewApi } from '@/utils/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
 
const GiveReview = ({ 
  itemId, 
  setSelectedChatDetails, 
  setBuyer,
  // Novi props za modal verziju
  onClose,
  onSuccess,
  sellerId 
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({ rating: '', review: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
 
  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
 
  const handleRatingChange = (newRating) => {
    setRating(newRating);
    setErrors((prev) => ({ ...prev, rating: '' }));
  };
 
  const handleReviewChange = (e) => {
    setReview(e.target.value);
    setErrors((prev) => ({ ...prev, review: '' }));
  };
 
  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Dozvoljene su samo slike');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Maksimalna veličina slike je 5MB');
      return false;
    }
    return true;
  };
 
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
 
  const addImages = (files) => {
    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maksimalno ${MAX_IMAGES} slika`);
      return;
    }
 
    const validFiles = files.filter(validateFile).slice(0, remainingSlots);
    
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
 
    setImages((prev) => [...prev, ...validFiles]);
  };
 
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };
 
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
 
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
 
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };
 
  const validateForm = () => {
    const newErrors = { rating: '', review: '' };
    let isValid = true;
 
    if (rating === 0) {
      newErrors.rating = 'Molimo odaberite ocjenu';
      isValid = false;
    }
 
    if (!review.trim()) {
      newErrors.review = 'Molimo napišite recenziju';
      isValid = false;
    } else if (review.trim().length < 10) {
      newErrors.review = 'Recenzija mora imati najmanje 10 karaktera';
      isValid = false;
    }
 
    setErrors(newErrors);
    return isValid;
  };
 
  const handleSubmit = async () => {
    if (!validateForm()) return;
 
    try {
      setIsSubmitting(true);
 
      const res = await addItemReviewApi.addItemReview({
        item_id: itemId,
        review,
        ratings: rating,
        images: images.length > 0 ? images : undefined
      });
 
      if (res?.data?.error === false) {
        toast.success('Recenzija uspješno poslana!');
        
        // Ažuriraj chat details ako postoji funkcija
        if (typeof setSelectedChatDetails === 'function') {
          setSelectedChatDetails((prev) => ({
            ...prev,
            item: {
              ...prev?.item,
              review: res?.data?.data,
            },
          }));
        }
        
        // Ažuriraj buyer listu ako postoji funkcija
        if (typeof setBuyer === 'function') {
          setBuyer((prev) => ({
            ...prev,
            BuyerChatList: prev?.BuyerChatList?.map((chatItem) =>
              chatItem?.item?.id === Number(res?.data?.data?.item_id)
                ? {
                    ...chatItem,
                    item: {
                      ...chatItem.item,
                      review: res?.data?.data?.review,
                    },
                  }
                : chatItem
            ) || [],
          }));
        }
 
        // Pozovi onSuccess callback ako postoji (za modal verziju)
        if (typeof onSuccess === 'function') {
          onSuccess(res?.data?.data);
        }
 
        // Reset forme
        setRating(0);
        setReview('');
        setImages([]);
        setImagePreviews([]);
        setErrors({ rating: '', review: '' });
      } else {
        toast.error(res?.data?.message || 'Greška pri slanju recenzije');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Došlo je do greške. Molimo pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };
 
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white/95 shadow-[0_32px_80px_-44px_rgba(15,23,42,0.6)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="relative p-5 sm:p-6">
        {typeof onClose === 'function' && (
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Zatvori"
          >
            <HiX className="h-5 w-5" />
          </button>
        )}

        <div className="mb-6 pr-10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0ab6af]">Dojam kupca</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">Ocijenite prodavača</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kratko i konkretno podijelite iskustvo kupovine.
          </p>
        </div>

        <div className="mb-6">
          <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">Vaša ocjena</label>
          <StarRatingInput
            rating={rating}
            onRatingChange={handleRatingChange}
            size={34}
          />
          {errors.rating && (
            <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{errors.rating}</p>
          )}
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">Vaš dojam</label>
          <Textarea
            placeholder="Napišite šta je bilo dobro, a šta može bolje..."
            value={review}
            onChange={handleReviewChange}
            maxLength={500}
            className={cn(
              'min-h-[130px] resize-none rounded-2xl border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus-visible:ring-[#0ab6af]/35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
              errors.review && 'border-rose-500 focus-visible:ring-rose-500/35'
            )}
          />
          <div className="mt-1 flex justify-between">
            {errors.review ? (
              <p className="text-sm text-rose-600 dark:text-rose-400">{errors.review}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">{review.length}/500</span>
          </div>
        </div>

        <div className="mb-7">
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Fotografije <span className="font-normal text-slate-400">(opcionalno)</span>
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'rounded-2xl border-2 border-dashed p-4 text-center transition-colors',
              isDragging
                ? 'border-[#0ab6af] bg-[#0ab6af]/5 dark:bg-[#0ab6af]/10'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
              images.length >= MAX_IMAGES && 'pointer-events-none opacity-55'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreviews.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5"
                disabled={images.length >= MAX_IMAGES}
              >
                <HiOutlinePhotograph className="mx-auto mb-2 h-8 w-8 text-slate-400 dark:text-slate-500" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Kliknite ili prevucite slike ovdje
                </p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Maksimalno {MAX_IMAGES} slika, do 5MB po slici
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap justify-center gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="group relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Ukloni sliku"
                      >
                        <IoClose className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-20 w-20 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 text-2xl text-slate-400 transition-colors hover:border-[#0ab6af] hover:text-[#0ab6af] dark:border-slate-700 dark:text-slate-500 dark:hover:border-[#0ab6af]"
                      aria-label="Dodaj još slika"
                    >
                      +
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {images.length}/{MAX_IMAGES} slika
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {typeof onClose === 'function' && (
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border-slate-300 dark:border-slate-700"
            >
              Odustani
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[150px] rounded-xl bg-[#0ab6af] text-white hover:bg-[#0a9f99]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Šaljem...
              </span>
            ) : (
              'Pošalji recenziju'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
 
export default GiveReview;
