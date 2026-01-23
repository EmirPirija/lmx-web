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
import { Calendar, Clock, Zap, CalendarClock, ChevronRight, Info } from "lucide-react";
 
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
      <DialogContent className="!max-w-[500px] p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <CalendarClock className="w-6 h-6 text-white" />
            </div>
            Opcije objave
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Odaberite kada želite da se vaš oglas pojavi na stranici
          </DialogDescription>
        </DialogHeader>
 
        {/* Options */}
        <div className="p-6 space-y-4">
          {/* Option 1: Publish Now */}
          <button
            onClick={() => setSelectedOption("now")}
            className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              selectedOption === "now"
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                selectedOption === "now" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-500"
              }`}>
                <Zap className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-lg ${
                    selectedOption === "now" ? "text-primary" : "text-gray-800"
                  }`}>
                    Objavi odmah
                  </h3>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === "now" 
                      ? "border-primary bg-primary" 
                      : "border-gray-300"
                  }`}>
                    {selectedOption === "now" && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
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
                ? "border-primary bg-primary/5 shadow-md"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${
                selectedOption === "schedule" 
                  ? "bg-primary text-white" 
                  : "bg-gray-100 text-gray-500"
              }`}>
                <Calendar className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-semibold text-lg ${
                    selectedOption === "schedule" ? "text-primary" : "text-gray-800"
                  }`}>
                    Zakaži objavu
                  </h3>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOption === "schedule" 
                      ? "border-primary bg-primary" 
                      : "border-gray-300"
                  }`}>
                    {selectedOption === "schedule" && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Odaberite tačan datum i vrijeme kada će se oglas objaviti
                </p>
              </div>
            </div>
          </button>
 
          {/* Schedule Date/Time Picker */}
          {selectedOption === "schedule" && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Možete zakazati objavu do 30 dana unaprijed</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Date Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
 
                {/* Time Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">
                    Oglas će biti objavljen:{" "}
                    <span className="font-semibold text-primary block mt-1">
                      {formatDateBosnian(scheduledDate, scheduledTime)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
 
        {/* Footer */}
        <DialogFooter className="p-6 pt-4 border-t bg-gray-50">
          <div className="flex gap-3 w-full">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Odustani
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
 
export default PublishOptionsModal;