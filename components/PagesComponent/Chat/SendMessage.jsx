"use client";
import { sendMessageApi, chatListApi } from "@/utils/api";
import { useEffect, useState, useRef } from "react";
import { IoMdAttach, IoMdSend } from "@/components/Common/UnifiedIconPack";
import { FaMicrophone, FaRegStopCircle } from "@/components/Common/UnifiedIconPack";
import { Loader2, X } from "@/components/Common/UnifiedIconPack";
import { useReactMediaRecorder } from "react-media-recorder";
import { toast } from "@/utils/toastBs";
import { t } from "@/utils";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { userSignUpData } from "@/redux/reducer/authSlice";
 
/**
 * SendMessage Component
 * Features:
 * ✅ Optimistic UI
 * ✅ Debounced Typing indicator
 * ✅ File upload & Preview
 * ✅ Voice recording
 * ✅ Access control check
 */
 
const SendMessage = ({ 
  selectedChatDetails, 
  setChatMessages,
  isOtherUserTyping = false 
}) => {
  // 🔥 Dohvati ulogovanog korisnika
  const user = useSelector(userSignUpData);
  const userId = user?.id;
 
  // 🔥 ISPRAVKA: Dodano "sold out" kao dozvoljen status za chat
  const itemStatus = selectedChatDetails?.item?.status;
  const isAllowToChat =
    itemStatus === "approved" ||
    itemStatus === "featured" ||
    itemStatus === "sold out";
 
  const id = selectedChatDetails?.id;
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
 
  // Refs za Debounce typinga
  const lastTypingSentTime = useRef(0);
  const typingTimeoutRef = useRef(null);
 
  // --- VOICE RECORDING SETUP ---
  const { status, startRecording, stopRecording, mediaBlobUrl, error } =
    useReactMediaRecorder({
      audio: true,
      blobPropertyBag: { type: "audio/mpeg" },
    });
 
  const isRecording = status === "recording";
  const [recordingDuration, setRecordingDuration] = useState(0);
  const QUICK_REPLIES = [
    "Da, oglas je još dostupan.",
    "Može dogovor oko cijene.",
    "Pošaljite kontakt i javim se odmah.",
    "Može pregled danas.",
  ];
 
  // Format recording duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
 
  // Timer for recording
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);
 
  // Cleanup effect
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      stopRecording();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Pošalji false samo ako imamo ID
      if (id) {
        sendTypingStatus(false);
      }
    };
  }, [id]);
 
  // Handle recorded audio
  useEffect(() => {
    if (mediaBlobUrl && status === "stopped") {
      handleRecordedAudio();
    }
  }, [mediaBlobUrl, status]);
 
  // --- TYPING INDICATOR LOGIC ---
  const sendTypingStatus = async (isTyping) => {
    if (!id) return;

    try {
      await chatListApi.sendTyping({
        chat_id: id,
        is_typing: isTyping
      });
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  };
 
  // --- AUDIO HANDLER ---
  const handleRecordedAudio = async () => {
    try {
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      const audioFile = new File([blob], "recording.mp3", {
        type: "audio/mpeg",
      });
      sendMessage(audioFile);
    } catch (err) {
      console.error("Error processing audio:", err);
      toast.error("Obrada audio snimka nije uspjela.");
    }
  };
 
  // --- FILE HANDLERS ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    applySelectedFile(file, "upload");
  };

  const applySelectedFile = (file, source = "upload") => {
 
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
 
    if (!allowedTypes.includes(file.type)) {
      toast.error("Dozvoljeni su samo formati JPEG i PNG");
      return false;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
 
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    setSelectedFile(file);

    if (source === "paste") {
      toast.success("Slika dodana iz clipboard-a");
    }

    return true;
  };
 
  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
 
  // Handle message change with debounce
  const handleMessageChange = (e) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    const now = Date.now();
    const TIME_BETWEEN_EVENTS = 2000;
 
    if (newValue.length > 0) {
      if (now - lastTypingSentTime.current > TIME_BETWEEN_EVENTS) {
        sendTypingStatus(true);
        lastTypingSentTime.current = now;
      }
 
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
 
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 3000);
 
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }
  };

  const handlePaste = (e) => {
    if (selectedFile) return;

    const clipboardItems = Array.from(e.clipboardData?.items || []);
    const imageItem = clipboardItems.find((item) =>
      item.type?.startsWith("image/")
    );

    if (!imageItem) return;

    const file = imageItem.getAsFile();
    if (!file) return;

    e.preventDefault();
    applySelectedFile(file, "paste");
  };
 
  // --- SEND MESSAGE LOGIC ---
  const sendMessage = async (audioFile = null) => {
    if ((!message.trim() && !selectedFile && !audioFile) || isSending) return;
 
    // Zaustavi typing status
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTypingStatus(false);
 
    // 🔥 ISPRAVLJENO: Koristi userId iz ulogovanog korisnika
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      message_type: audioFile ? "audio" : selectedFile ? (message ? "file_and_text" : "file") : "text",
      message: message || "",
      sender_id: userId, // 🔥 Pravilni sender_id
      created_at: new Date().toISOString(),
      audio: audioFile ? URL.createObjectURL(audioFile) : null,
      file: selectedFile ? previewUrl : null,
      status: "sending",
      isOptimistic: true,
    };
 
    // Add optimistic message to UI
    setChatMessages((prev) => [...prev, optimisticMessage]);
 
    // Clear input
    const messageText = message;
    setMessage("");
    removeSelectedFile();
 
    // 🔥 ISPRAVLJENO: Pravilno slanje parametara
    const params = {
      item_offer_id: id,
    };
    
    // Dodaj message samo ako postoji
    if (messageText && messageText.trim()) {
      params.message = messageText;
    }
    
    // Dodaj file samo ako postoji
    if (selectedFile) {
      params.file = selectedFile;
    }
    
    // Dodaj audio samo ako postoji
    if (audioFile) {
      params.audio = audioFile;
    }
 
    try {
      setIsSending(true);
      const response = await sendMessageApi.sendMessage(params);
 
      if (response?.data?.error === false) {
        // Replace optimistic message with real message from server
        setChatMessages((prev) => 
          prev.map((msg) => 
            msg.id === optimisticMessage.id 
              ? { ...response.data.data, status: "sent" }
              : msg
          )
        );
      } else {
        // Remove optimistic message on error
        setChatMessages((prev) => 
          prev.filter((msg) => msg.id !== optimisticMessage.id)
        );
        toast.error(response?.data?.message || "Slanje poruke nije uspjelo.");
      }
    } catch (error) {
      // Remove optimistic message on error
      setChatMessages((prev) => 
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
      console.error('Send message error:', error);
      console.error('Error response:', error?.response?.data);
      toast.error(error?.response?.data?.message || "Greška pri slanju poruke.");
      
      // Restore message for retry
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };
 
  const handleVoiceButtonClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
      if (error) {
        console.log(error);
        switch (error) {
          case "permission_denied":
            toast.error("Mikrofon je odbijen. Uključi dozvolu.");
            break;
          case "no_specified_media_found":
            toast.error("Nema mikrofona. Priključi mikrofon i pokušaj ponovo.");
            break;
          default:
            toast.error("Nešto je pošlo po zlu. Pokušaj kasnije.");
        }
      }
    }
  };
 
  // 🔥 ISPRAVKA: Poboljšana poruka za blokirane statuse
  const getBlockedMessage = () => {
    switch (itemStatus) {
      case "review":
        return "Ovaj oglas je na pregledu";
      case "inactive":
        return "Ovaj oglas je deaktiviran";
      case "expired":
        return "Ovaj oglas je istekao";
      case "soft rejected":
      case "permanent rejected":
        return "Ovaj oglas je odbijen";
      default:
        return `Ovaj oglas ima status: ${itemStatus}`;
    }
  };
 
  // Ako chat nije dozvoljen, prikaži poruku
  if (!isAllowToChat) {
    return (
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-center text-muted-foreground bg-gray-50 dark:bg-slate-900">
        <p className="text-sm">{getBlockedMessage()}</p>
      </div>
    );
  }
 
  return (
    <div className="flex flex-col border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95">
      {/* Other user typing indicator */}
      {isOtherUserTyping && (
        <div className="px-4 py-2 text-sm text-cyan-600 dark:text-cyan-300 flex items-center gap-2 bg-cyan-50 dark:bg-cyan-500/10 animate-in fade-in slide-in-from-bottom-1 transition-all">
          <span className="font-medium">piše</span>
          <span className="flex gap-0.5 pb-1">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-[bounce_1s_ease-in-out_0s_infinite]"></span>
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-[bounce_1s_ease-in-out_0.15s_infinite]"></span>
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-[bounce_1s_ease-in-out_0.3s_infinite]"></span>
          </span>
        </div>
      )}
 
      {/* File Preview */}
      {previewUrl && (
        <div className="px-4 pt-2 pb-1">
          <div className="relative w-32 h-32 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden group">
            <CustomImage
              src={previewUrl}
              alt="File preview"
              fill
              className="object-contain"
            />
            <button
              onClick={removeSelectedFile}
              className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {!isRecording && !selectedFile && !message.trim() && (
        <div className="px-4 pt-2 flex flex-wrap gap-2">
          {QUICK_REPLIES.map((reply) => (
            <button
              key={reply}
              type="button"
              onClick={() => {
                setMessage(reply);
                inputRef.current?.focus();
              }}
              className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:border-primary/30 hover:text-primary"
            >
              {reply}
            </button>
          ))}
        </div>
      )}
 
      {/* Input Area */}
      <div className="p-4 flex items-end gap-2">
        {!isRecording && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              aria-label="Attach file"
              className="mb-1 h-10 w-10 inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:text-primary transition-colors"
            >
              <IoMdAttach size={20} className="text-muted-foreground dark:text-slate-300" />
            </button>
          </>
        )}
 
        {isRecording ? (
          <div className="flex-1 min-h-[42px] py-2 px-3 bg-red-50 dark:bg-red-500/15 text-red-500 rounded-xl flex items-center justify-center font-medium">
            🔴 {"Snimam..."} {formatDuration(recordingDuration)}
          </div>
        ) : (
          <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-sm">
            <textarea
              ref={inputRef}
              placeholder="Napišite poruku..."
              className="w-full outline-none border-0 bg-transparent px-0 py-0 text-sm resize-none min-h-[40px] max-h-[140px] focus:ring-0 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={message}
              rows={2}
              onChange={handleMessageChange}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (message.trim() || selectedFile) {
                    sendMessage();
                  }
                }
              }}
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Enter za slanje, Shift+Enter za novi red</span>
              <span>{message.length}/1200</span>
            </div>
          </div>
        )}
 
        <button
          className={cn(
            "mb-1 h-10 w-10 inline-flex items-center justify-center rounded-full transition-all",
            "bg-primary text-white hover:bg-primary/90 shadow-sm",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          disabled={isSending}
          onClick={
            message.trim() || selectedFile
              ? () => sendMessage()
              : handleVoiceButtonClick
          }
        >
          {isSending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : message.trim() || selectedFile ? (
            <IoMdSend size={20} className="rtl:scale-x-[-1]" />
          ) : isRecording ? (
            <FaRegStopCircle size={20} />
          ) : (
            <FaMicrophone size={20} />
          )}
        </button>
      </div>
    </div>
  );
};
 
export default SendMessage;
