'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { HiOutlinePhotograph } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import StarRatingInput from '../../PagesComponent/Reviews/StarRatingInput';
import { addItemReviewApi } from '@/utils/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
 
const GiveReview = ({ itemId, setSelectedChatDetails, setBuyer }) => {
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
        images
      });
 
      if (res?.data?.error === false) {
        toast.success('Recenzija uspješno poslana!');
        
        setSelectedChatDetails((prev) => ({
          ...prev,
          item: {
            ...prev.item,
            review: res?.data?.data,
          },
        }));
        
        setBuyer((prev) => ({
          ...prev,
          BuyerChatList: prev.BuyerChatList.map((chatItem) =>
            chatItem?.item?.id === Number(res?.data?.data?.item_id)
              ? {
                  ...chatItem,
                  item: {
                    ...chatItem.item,
                    review: res?.data?.data?.review,
                  },
                }
              : chatItem
          ),
        }));
 
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
      console.error(error);
      toast.error('Došlo je do greške. Molimo pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <div className="bg-gray-50 p-4">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Ocijenite prodavača</h3>
          <p className="text-sm text-gray-500 mt-1">
            Podijelite vaše iskustvo sa drugima
          </p>
        </div>
 
        {/* Ocjena zvjezdicama */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Vaša ocjena
          </label>
          <StarRatingInput
            rating={rating}
            onRatingChange={handleRatingChange}
            size={36}
          />
          {errors.rating && (
            <p className="text-red-500 text-sm mt-2">{errors.rating}</p>
          )}
        </div>
 
        {/* Tekst recenzije */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vaša recenzija
          </label>
          <Textarea
            placeholder="Opišite vaše iskustvo sa prodavačem..."
            value={review}
            onChange={handleReviewChange}
            className={cn(
              'min-h-[120px] resize-none rounded-lg',
              errors.review && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          <div className="flex justify-between mt-1">
            {errors.review ? (
              <p className="text-red-500 text-sm">{errors.review}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">{review.length}/500</span>
          </div>
        </div>
 
        {/* Upload slika */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dodajte slike <span className="text-gray-400 font-normal">(opcionalno)</span>
          </label>
 
          {/* Drag & Drop zona */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center transition-colors',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300',
              images.length >= MAX_IMAGES && 'opacity-50 pointer-events-none'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
 
            {imagePreviews.length === 0 ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4"
              >
                <HiOutlinePhotograph className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Kliknite ili prevucite slike ovdje
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maksimalno {MAX_IMAGES} slika, do 5MB po slici
                </p>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Preview slika */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IoClose className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
 
                  {/* Dugme za dodavanje više slika */}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="text-2xl text-gray-400">+</span>
                    </button>
                  )}
                </div>
 
                <p className="text-xs text-gray-400">
                  {images.length}/{MAX_IMAGES} slika
                </p>
              </div>
            )}
          </div>
        </div>
 
        {/* Submit dugme */}
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
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