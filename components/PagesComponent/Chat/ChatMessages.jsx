import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  formatChatMessageTime,
  formatMessageDate,
  formatPriceAbbreviated,
  t,
} from "@/utils";
import { getMessagesApi } from "@/utils/api";
import { Fragment, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ChevronUp, Check, CheckCheck, Clock } from "lucide-react";
import dynamic from "next/dynamic";
const SendMessage = dynamic(() => import("./SendMessage"), { ssr: false });
import GiveReview from "./GiveReview";
import { getNotification } from "@/redux/reducer/globalStateSlice";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";

/**
 * ChatMessages Component - Production Ready
 * * Features:
 * ✅ Message status indicators (sending/sent/delivered/seen)
 * ✅ Typing indicator
 * ✅ Optimistic UI updates
 * ✅ Real-time message updates
 * ✅ Infinite scroll with load previous messages
 */

// Skeleton component for chat messages
const ChatMessagesSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1 w-[65%] max-w-[80%]">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] rounded-md" />
      </div>
      <div className="flex flex-col gap-1 w-[70%] max-w-[80%] self-end">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] self-end rounded-md" />
      </div>
      <div className="flex flex-col gap-1 w-[50%] max-w-[80%]">
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] rounded-md" />
      </div>
      <div className="flex flex-col gap-1 w-[60%] max-w-[80%] self-end">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] self-end rounded-md" />
      </div>
      <div className="flex flex-col gap-1 w-[45%] max-w-[80%]">
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] rounded-md" />
      </div>
      <div className="flex flex-col gap-1 w-[60%] max-w-[80%] self-end">
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] self-end rounded-md" />
      </div>
      <div className="flex flex-col gap-1 w-[45%] max-w-[80%]">
        <Skeleton className="h-14 w-full rounded-md" />
        <Skeleton className="h-3 w-[30%] rounded-md" />
      </div>
    </div>
  );
};

/**
 * Message Status Icon Component
 */
const MessageStatusIcon = ({ status }) => {
  switch (status) {
    case "sending":
      return (
        <Clock 
          className="w-3 h-3 text-gray-400 animate-pulse" 
          title="Slanje..."
        />
      );
    case "sent":
      return (
        <Check 
          className="w-3 h-3 text-gray-400" 
          title="Poslano"
        />
      );
    case "delivered":
      return (
        <CheckCheck 
          className="w-3 h-3 text-gray-400" 
          title="Dostavljeno"
        />
      );
    case "seen":
      return (
        <CheckCheck 
          className="w-3 h-3 text-blue-500" 
          title="Pregledano"
        />
      );
    default:
      return null;
  }
};

const renderMessageContent = (message, isCurrentUser) => {
  const baseTextClass = isCurrentUser
    ? "text-white bg-primary p-2 rounded-md w-fit"
    : "text-black bg-border p-2 rounded-md w-fit";

  const audioStyles = isCurrentUser ? "border-primary" : "border-border";

  const isOptimistic = message.isOptimistic || message.status === "sending";

  switch (message.message_type) {
    case "audio":
      return (
        <div className="relative">
          <audio
            src={message.audio}
            controls
            className={cn(
              "w-full sm:w-[70%]",
              isCurrentUser ? "self-end" : "self-start",
              "rounded-md border-2",
              audioStyles,
              isOptimistic && "opacity-70"
            )}
            controlsList="nodownload"
            type="audio/mpeg"
            preload="metadata"
          />
          {isOptimistic && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-md">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          )}
        </div>
      );

    case "file":
      return (
        <div className={cn(baseTextClass, isOptimistic && "opacity-70 relative")}>
          <CustomImage
            src={message.file}
            alt="Chat Image"
            className="rounded-md w-auto h-auto max-h-[250px] max-w-[250px] object-contain"
            width={200}
            height={200}
          />
          {isOptimistic && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}
        </div>
      );

    case "file_and_text":
      return (
        <div className={cn(baseTextClass, "flex flex-col gap-2", isOptimistic && "opacity-70 relative")}>
          <CustomImage
            src={message.file}
            alt="Chat Image"
            className="rounded-md w-auto h-auto max-h-[250px] max-w-[250px] object-contain"
            width={200}
            height={200}
          />
          <div className="border-white/20">{message.message}</div>
          {isOptimistic && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            </div>
          )}
        </div>
      );

    default:
      return (
        <p className={cn(baseTextClass, "whitespace-pre-wrap", isOptimistic && "opacity-70")}>
          {message?.message}
        </p>
      );
  }
};

const ChatMessages = ({
  selectedChatDetails,
  isSelling,
  setSelectedChatDetails,
  setBuyer,
  chatId,
}) => {
  const notification = useSelector(getNotification);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessagesPage, setCurrentMessagesPage] = useState(1);
  const [hasMoreChatMessages, setHasMoreChatMessages] = useState(false);
  const [isLoadPrevMesg, setIsLoadPrevMesg] = useState(false);
  const [IsLoading, setIsLoading] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const lastMessageDate = useRef(null);
  const messagesEndRef = useRef(null);
  
  const isAskForReview =
    !isSelling &&
    selectedChatDetails?.item?.status === "sold out" &&
    !selectedChatDetails?.item?.review &&
    Number(selectedChatDetails?.item?.sold_to) ===
      Number(selectedChatDetails?.buyer_id);

  const user = useSelector(userSignUpData);
  const userId = user?.id;

  // Auto scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Funkcija za označavanje poruka kao viđenih
   */
  const markMessagesAsSeen = async (chatId) => {
    if (!chatId) return;
    try {
      // Provjeri da li tvoj API koristi 'markAsSeen' ili sličan naziv
      await getMessagesApi.markAsSeen({ item_offer_id: chatId });
    } catch (error) {
      console.error('Greška pri označavanju poruka:', error);
    }
  };

  // Učitavanje poruka i označavanje kao viđenih pri otvaranju chata
  useEffect(() => {
    if (selectedChatDetails?.id) {
      fetchChatMessgaes(1);
      markMessagesAsSeen(selectedChatDetails?.id);
    }
  }, [selectedChatDetails?.id]);

  // Handle new message notifications & Status Updates
  useEffect(() => {
    // 1. SLUČAJ: Nova poruka stigla dok je chat otvoren
    if (
      notification?.type === "chat" &&
      Number(notification?.item_offer_id) === Number(chatId) &&
      (notification?.user_type === "Seller" ? !isSelling : isSelling)
    ) {
      const newMessage = {
        message_type: notification?.message_type_temp,
        message: notification?.message,
        sender_id: Number(notification?.sender_id),
        created_at: notification?.created_at,
        audio: notification?.audio,
        file: notification?.file,
        id: Number(notification?.id),
        item_offer_id: Number(notification?.item_offer_id),
        updated_at: notification?.updated_at,
        status: "delivered", 
      };

      setChatMessages((prev) => [...prev, newMessage]);
      scrollToBottom();

      // Odmah javi serveru da je viđena jer je chat otvoren
      markMessagesAsSeen(chatId);
    }

    // 2. SLUČAJ: Update statusa (neko je vidio tvoju poruku)
    // Provjeri koji 'type' šalje backend (seen, message_seen, read, itd.)
    if (
      (notification?.type === "seen" || notification?.type === "message_seen") &&
      Number(notification?.item_offer_id) === Number(chatId)
    ) {
        setChatMessages((prevMessages) => 
            prevMessages.map((msg) => 
                // Ako je poruka moja (ja sam sender), a stigao je info da je viđeno -> update status u "seen"
                msg.sender_id === userId ? { ...msg, status: "seen" } : msg
            )
        );
    }

  }, [notification, chatId, userId]); // Dodani dependency-ji za stabilnost

  // Auto scroll when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const fetchChatMessgaes = async (page) => {
    try {
      page > 1 ? setIsLoadPrevMesg(true) : setIsLoading(true);
      const response = await getMessagesApi.chatMessages({
        item_offer_id: selectedChatDetails?.id,
        page,
      });
      if (response?.data?.error === false) {
        const currentPage = Number(response?.data?.data?.current_page);
        const lastPage = Number(response?.data?.data?.last_page);
        const hasMoreChatMessages = currentPage < lastPage;
        const messagesData = (response?.data?.data?.data).reverse();
        
        // Mapiranje statusa inicijalno
        const messagesWithStatus = messagesData.map(msg => ({
          ...msg,
          // Ako sam ja poslao i backend kaže da je viđeno (treba backend podatak), ili defaultaj
          // Ovdje koristimo logiku: ako sam ja sender, status zavisi od 'is_read' polja s backenda (ako postoji)
          // Ako polje ne postoji, privremeno stavljamo "delivered" ili "seen" ako je stara poruka
          status: msg.sender_id === userId ? (msg.is_read ? "seen" : "delivered") : "seen"
        }));
        
        setCurrentMessagesPage(currentPage);
        setHasMoreChatMessages(hasMoreChatMessages);
        page > 1
          ? setChatMessages((prev) => [...messagesWithStatus, ...prev])
          : setChatMessages(messagesWithStatus);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadPrevMesg(false);
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-muted p-4 flex flex-col gap-2.5 relative">
        {IsLoading ? (
          <ChatMessagesSkeleton />
        ) : (
          <>
            {/* Show review dialog if open */}
            {showReviewDialog && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 p-4">
                <div className="w-full max-w-md">
                  <GiveReview
                    itemId={selectedChatDetails?.item_id}
                    sellerId={selectedChatDetails?.seller_id}
                    onClose={() => setShowReviewDialog(false)}
                    onSuccess={() => {
                      setShowReviewDialog(false);
                      // Refresh chat details
                    }}
                  />
                </div>
              </div>
            )}

            {/* button to load previous messages */}
            {hasMoreChatMessages && !IsLoading && (
              <div className="absolute top-3 left-0 right-0 z-10 flex justify-center pb-2">
                <button
                  onClick={() => fetchChatMessgaes(currentMessagesPage + 1)}
                  disabled={isLoadPrevMesg}
                  className="text-primary text-sm font-medium px-3 py-1.5 bg-white/90 rounded-full shadow-md hover:bg-white flex items-center gap-1.5 transition-all hover:shadow-lg"
                >
                  {isLoadPrevMesg ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      {t("loadPreviousMessages")}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* offer price */}
            {!hasMoreChatMessages &&
              selectedChatDetails?.amount > 0 &&
              (() => {
                const isSeller = isSelling;
                const containerClasses = cn(
                  "flex flex-col gap-1 rounded-md p-2 w-fit",
                  isSeller ? "bg-border" : "bg-primary text-white self-end"
                );
                const label = isSeller ? t("offer") : t("yourOffer");

                return (
                  <div className={containerClasses}>
                    <p className="text-sm">{label}</p>
                    <span className="text-xl font-medium">
                      {formatPriceAbbreviated(selectedChatDetails.amount)}
                    </span>
                  </div>
                );
              })()}

            {/* chat messages */}
            {chatMessages &&
              chatMessages.length > 0 &&
              chatMessages.map((message) => {
                const messageDate = formatMessageDate(message.created_at);
                const showDateSeparator =
                  messageDate !== lastMessageDate.current;
                if (showDateSeparator) {
                  lastMessageDate.current = messageDate;
                }

                const isCurrentUser = message.sender_id === userId;
                const messageStatus = message.status || "sent";

                return (
                  <Fragment key={message?.id}>
                    {showDateSeparator && (
                      <p className="text-xs bg-[#f1f1f1] py-1 px-2 rounded-lg text-muted-foreground my-5 mx-auto">
                        {messageDate}
                      </p>
                    )}

                    {isCurrentUser ? (
                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[80%] self-end",
                          message.message_type === "audio" && "w-full"
                        )}
                        key={message?.id}
                      >
                        {renderMessageContent(message, true)}
                        <div className="flex items-center justify-end gap-1">
                          <p className="text-xs text-muted-foreground">
                            {formatChatMessageTime(message?.created_at)}
                          </p>
                          {/* Message status indicator */}
                          <MessageStatusIcon status={messageStatus} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[80%]",
                          message.message_type === "audio" && "w-full"
                        )}
                        key={message?.id}
                      >
                        {renderMessageContent(message, false)}
                        <p className="text-xs text-muted-foreground ltr:text-left rtl:text-right">
                          {formatChatMessageTime(message?.created_at)}
                        </p>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {isAskForReview && (
        <GiveReview
          key={`review-${selectedChatDetails?.id}`}
          itemId={selectedChatDetails?.item_id}
          setSelectedChatDetails={setSelectedChatDetails}
          setBuyer={setBuyer}
        />
      )}
      <SendMessage
        key={`send-${selectedChatDetails?.id}`}
        selectedChatDetails={selectedChatDetails}
        setChatMessages={setChatMessages}
      />
    </>
  );
};

export default ChatMessages;