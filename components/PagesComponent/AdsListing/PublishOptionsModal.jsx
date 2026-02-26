"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar, Clock, Zap, CalendarClock, ChevronRight, Info } from "@/components/Common/UnifiedIconPack";
 
const PublishOptionsModal = ({
  isOpen,
  onClose,
  onPublishNow,
  onSchedule,
  isSubmitting,
}) => {
  const [selectedOption, setSelectedOption] = useState("now"); // "now" | "schedule"
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [error, setError] = useState("");
 
  // Get minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  
  // Get maximum date (30 days from now)
  const maxDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
 
  const handleConfirm = () => {
    if (selectedOption === "now") {
      onPublishNow();
    } else {
      if (!scheduledDate) {
        setError("Molimo odaberite datum");
        return;
      }
      
      // Combine date and time
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const now = new Date();
      
      if (scheduledDateTime <= now) {
        setError("Datum i vrijeme moraju biti u budućnosti");
        return;
      }
      
      setError("");
      onSchedule(scheduledDateTime.toISOString());
    }
  };
 
  const handleClose = () => {
    setSelectedOption("now");
    setScheduledDate("");
    setScheduledTime("09:00");
    setError("");
    onClose();
  };
 
  // Format date for display in Bosnian
  const formatDateBosnian = (dateStr, timeStr) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    const days = ["Nedjelja", "Ponedjeljak", "Utorak", "Srijeda", "Četvrtak", "Petak", "Subota"];
    const months = ["januar", "februar", "mart", "april", "maj", "juni", "juli", "august", "septembar", "oktobar", "novembar", "decembar"];
    
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${dayName}, ${day}. ${month} ${year}. u ${hours}:${minutes}h`;
  };
 
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-lg:fixed max-lg:inset-0 max-lg:!m-0 max-lg:!max-w-none max-lg:!translate-x-0 max-lg:!translate-y-0 max-lg:rounded-none max-lg:border-0 !max-w-[480px] overflow-hidden bg-white p-0 dark:bg-slate-950 lg:rounded-2xl lg:dark:bg-slate-900">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 sm:p-6 sm:pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-slate-100">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0ab6af]/10">
              <CalendarClock className="w-5 h-5 text-[#0ab6af]" />
            </div>
            Opcije objave
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Odaberite kada želite da se vaš oglas pojavi na platformi.
          </DialogDescription>
        </DialogHeader>
 
        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Option 1: Publish Now */}
          <button
            onClick={() => setSelectedOption("now")}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedOption === "now"
                ? "border-[#0ab6af] bg-[#0ab6af]/8 shadow-md dark:bg-[#0ab6af]/18"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                selectedOption === "now" 
                  ? "bg-[#0ab6af] text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-lg ${
                    selectedOption === "now" ? "text-[#0ab6af]" : "text-gray-800 dark:text-slate-100"
                  }`}>
                    Objavi odmah
                  </h3>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === "now" 
                      ? "border-[#0ab6af] bg-[#0ab6af]"
                      : "border-gray-300 dark:border-slate-600"
                  }`}>
                    {selectedOption === "now" && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Vaš oglas će biti vidljiv odmah nakon objave
                </p>
              </div>
            </div>
          </button>
 
          {/* Option 2: Schedule */}
          <button
            onClick={() => setSelectedOption("schedule")}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedOption === "schedule"
                ? "border-[#0ab6af] bg-[#0ab6af]/8 shadow-md dark:bg-[#0ab6af]/18"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                selectedOption === "schedule" 
                  ? "bg-[#0ab6af] text-white"
                  : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
              }`}>
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-lg ${
                    selectedOption === "schedule" ? "text-[#0ab6af]" : "text-gray-800 dark:text-slate-100"
                  }`}>
                    Zakaži objavu
                  </h3>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === "schedule" 
                      ? "border-[#0ab6af] bg-[#0ab6af]"
                      : "border-gray-300 dark:border-slate-600"
                  }`}>
                    {selectedOption === "schedule" && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Odaberite tačan datum i vrijeme objave oglasa.
                </p>
              </div>
            </div>
          </button>
 
          {/* Schedule Date/Time Picker */}
          {selectedOption === "schedule" && (
            <div className="mt-4 animate-in slide-in-from-top-2 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 duration-200 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Možete zakazati objavu do 30 dana unaprijed</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Datum
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => {
                      setScheduledDate(e.target.value);
                      setError("");
                    }}
                    min={minDate}
                    max={maxDate}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none transition-all focus:border-[#0ab6af] focus:ring-2 focus:ring-[#0ab6af]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
 
                {/* Time Input */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-200">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Vrijeme
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => {
                      setScheduledTime(e.target.value);
                      setError("");
                    }}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 outline-none transition-all focus:border-[#0ab6af] focus:ring-2 focus:ring-[#0ab6af]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
 
              {error && (
                <p className="text-red-500 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center flex-shrink-0">!</span>
                  {error}
                </p>
              )}
 
              {scheduledDate && (
                <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    Oglas će biti objavljen:{" "}
                    <span className="mt-1 block font-semibold text-[#0ab6af]">
                      {formatDateBosnian(scheduledDate, scheduledTime)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
 
        {/* Footer */}
        <DialogFooter className="p-5 pt-2 sm:p-6 sm:pt-2 max-lg:pb-[max(env(safe-area-inset-bottom),20px)]">
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:justify-end">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-[#0ab6af] font-semibold text-white transition-colors hover:bg-[#09a8a2] disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2 sm:w-auto sm:min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Objavljujem...
                </>
              ) : (
                <>
                  {selectedOption === "now" ? "Objavi odmah" : "Zakaži objavu"}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="h-11 w-full rounded-xl text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 sm:w-auto sm:min-w-[120px]"
            >
              Odustani
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
 
export default PublishOptionsModal;
