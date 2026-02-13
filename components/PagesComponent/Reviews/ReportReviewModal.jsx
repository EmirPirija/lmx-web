'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addReportReviewApi } from '@/utils/api';
import { toast } from "@/utils/toastBs";
import { cn } from '@/lib/utils';
import { HiOutlineExclamationCircle } from "@/components/Common/UnifiedIconPack";
 
const REPORT_REASONS = [
  { id: 'spam', label: 'Spam ili reklamiranje' },
  { id: 'offensive', label: 'Uvredljiv sadržaj' },
  { id: 'fake', label: 'Lažna recenzija' },
  { id: 'irrelevant', label: 'Nije relevantno za proizvod' },
  { id: 'other', label: 'Drugo' },
];
 
const ReportReviewModal = ({ isOpen, setIsOpen, reviewId, setMyReviews }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
 
  // Reset pri zatvaranju modala
  useEffect(() => {
    if (!isOpen) {
      setSelectedReason('');
      setCustomReason('');
      setValidationError('');
    }
  }, [isOpen]);
 
  const handleSubmit = async () => {
    // Validacija
    if (!selectedReason) {
      setValidationError('Molimo odaberite razlog prijave');
      return;
    }
 
    if (selectedReason === 'other' && !customReason.trim()) {
      setValidationError('Molimo opišite razlog prijave');
      return;
    }
 
    setValidationError('');
    setIsSubmitting(true);
 
    try {
      const reasonText = selectedReason === 'other' 
        ? customReason 
        : REPORT_REASONS.find(r => r.id === selectedReason)?.label;
 
      const res = await addReportReviewApi.addReportReview({
        seller_review_id: reviewId,
        report_reason: reasonText,
      });
 
      if (res?.data?.error === false) {
        toast.success('Recenzija je uspješno prijavljena');
        
        setMyReviews((prevReviews) =>
          prevReviews.map((review) =>
            review.id === reviewId
              ? {
                  ...review,
                  report_reason: res?.data?.data.report_reason,
                  report_status: res?.data?.data.report_status,
                }
              : review
          )
        );
        
        setIsOpen(false);
      } else {
        toast.error(res?.data?.message || 'Greška pri prijavi recenzije');
      }
    } catch (error) {
      console.error('Greška pri prijavi recenzije:', error);
      toast.error('Došlo je do greške. Molimo pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <HiOutlineExclamationCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Prijavi recenziju
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500 mt-0.5">
                Recite nam zašto smatrate da ova recenzija krši pravila
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
 
        {/* Sadržaj */}
        <div className="px-6 py-5">
          {/* Razlozi za prijavu */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Razlog prijave
            </label>
            
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all',
                  selectedReason === reason.id
                    ? 'bg-primary/5 ring-1 ring-primary'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={(e) => {
                    setSelectedReason(e.target.value);
                    setValidationError('');
                  }}
                  className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                />
                <span className={cn(
                  'text-sm',
                  selectedReason === reason.id ? 'text-gray-900 font-medium' : 'text-gray-700'
                )}>
                  {reason.label}
                </span>
              </label>
            ))}
          </div>
 
          {/* Custom razlog */}
          {selectedReason === 'other' && (
            <div className="mt-4">
              <Textarea
                placeholder="Opišite razlog prijave..."
                value={customReason}
                onChange={(e) => {
                  setCustomReason(e.target.value);
                  if (validationError) setValidationError('');
                }}
                className={cn(
                  'h-24 resize-none',
                  validationError && selectedReason === 'other' && 'border-red-500'
                )}
              />
            </div>
          )}
 
          {/* Greška validacije */}
          {validationError && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-1">
              <HiOutlineExclamationCircle className="w-4 h-4" />
              {validationError}
            </p>
          )}
        </div>
 
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Odustani
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white"
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
              'Prijavi recenziju'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
 
export default ReportReviewModal;