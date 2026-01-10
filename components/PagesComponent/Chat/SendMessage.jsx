"use client";
import { sendMessageApi, chatListApi } from "@/utils/api";
import { useEffect, useState, useRef } from "react";
import { IoMdAttach, IoMdSend } from "react-icons/io";
import { FaMicrophone, FaRegStopCircle } from "react-icons/fa";
import { Loader2, X } from "lucide-react";
import { useReactMediaRecorder } from "react-media-recorder";
import { toast } from "sonner";
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

  // Provjera da li je chat dozvoljen
  const isAllowToChat =
    selectedChatDetails?.item?.status === "approved" ||
    selectedChatDetails?.item?.status === "featured";

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
    
    console.log('📤 Sending typing status:', isTyping);
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
      toast.error("Failed to process recording");
    }
  };

  // --- FILE HANDLERS ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only image files (JPEG, PNG, JPG) are allowed");
      return;
    }

    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    setSelectedFile(file);
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

    console.log('📤 Sending message with params:', {
      item_offer_id: params.item_offer_id,
      message: params.message,
      hasFile: !!params.file,
      hasAudio: !!params.audio
    });

    try {
      setIsSending(true);
      const response = await sendMessageApi.sendMessage(params);

      console.log('📥 Send message response:', response?.data);

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
        toast.error(response?.data?.message || "Failed to send message");
      }
    } catch (error) {
      // Remove optimistic message on error
      setChatMessages((prev) => 
        prev.filter((msg) => msg.id !== optimisticMessage.id)
      );
      console.error('Send message error:', error);
      console.error('Error response:', error?.response?.data);
      toast.error(error?.response?.data?.message || "Error sending message");
      
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
            toast.error(t("microphoneAccessDenied"));
            break;
          case "no_specified_media_found":
            toast.error(t("noMicrophoneFound"));
            break;
          default:
            toast.error(t("somethingWentWrong"));
        }
      }
    }
  };

  // Ako chat nije dozvoljen, prikaži poruku
  if (!isAllowToChat) {
    return (
      <div className="p-4 border-t text-center text-muted-foreground">
        {t("thisAd")} {selectedChatDetails?.item?.status}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Other user typing indicator */}
      {isOtherUserTyping && (
        <div className="px-4 py-2 text-sm text-cyan-600 flex items-center gap-2 bg-cyan-50 animate-in fade-in slide-in-from-bottom-1 transition-all">
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
          <div className="relative w-32 h-32 border rounded-md overflow-hidden group">
            <CustomImage
              src={previewUrl}
              alt="File preview"
              fill
              className="object-contain"
            />
            <button
              onClick={removeSelectedFile}
              className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t flex items-center gap-2">
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
              className="hover:text-primary transition-colors"
            >
              <IoMdAttach size={20} className="text-muted-foreground" />
            </button>
          </>
        )}

        {isRecording ? (
          <div className="flex-1 py-2 px-3 bg-red-50 text-red-500 rounded-md flex items-center justify-center font-medium">
            🔴 {t("recording")} {formatDuration(recordingDuration)}
          </div>
        ) : (
          <textarea
            ref={inputRef}
            placeholder="Poruka..."
            className="flex-1 outline-none border px-3 py-1 rounded-md resize-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={message}
            rows={2}
            onChange={handleMessageChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (message.trim() || selectedFile) {
                  sendMessage();
                }
              }
            }}
          />
        )}

        <button
          className={cn(
            "p-2 rounded-md transition-all",
            "bg-primary text-white hover:bg-primary/90",
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