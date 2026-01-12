import { userSignUpData } from "@/redux/reducer/authSlice";
import {
  formatChatMessageTime,
  formatMessageDate,
  formatPriceAbbreviated,
  t,
} from "@/utils";
import { getMessagesApi } from "@/utils/api";
import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  ChevronUp,
  Check,
  CheckCheck,
  Clock,
  Star,
} from "lucide-react";
import dynamic from "next/dynamic";
const SendMessage = dynamic(() => import("./SendMessage"), { ssr: false });
import GiveReview from "../../PagesComponent/Chat/GiveReview";
import { getNotification } from "@/redux/reducer/globalStateSlice";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
 
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
    </div>
  );
};
 
// Message Status Icon Component
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
      return <Check className="w-3 h-3 text-gray-400" title="Poslano" />;
    case "delivered":
      return (
        <CheckCheck className="w-3 h-3 text-gray-400" title="Dostavljeno" />
      );
    case "seen":
      return (
        <CheckCheck className="w-3 h-3 text-blue-500" title="Pregledano" />
      );
    default:
      return null;
  }
};
 
// 🆕 Komponenta za prikaz da je recenzija već ostavljena
const ReviewAlreadySubmitted = ({ review }) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mx-4 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Star className="w-5 h-5 text-green-600 fill-green-600" />
        </div>
 
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-800">
            Već ste ostavili recenziju
          </p>
 
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= (review?.ratings || 0)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-300"
                )}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({review?.ratings || 0}/5)
            </span>
          </div>
 
          {review?.review && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              "{review.review}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
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
        <div
          className={cn(
            baseTextClass,
            "flex flex-col gap-2",
            isOptimistic && "opacity-70 relative"
          )}
        >
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
        <p
          className={cn(
            baseTextClass,
            "whitespace-pre-wrap",
            isOptimistic && "opacity-70"
          )}
        >
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
  isOtherUserTyping,
  markChatAsSeen,
  incomingMessage,
  searchQuery,
  messageStatusUpdate,
}) => {
  const notification = useSelector(getNotification);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessagesPage, setCurrentMessagesPage] = useState(1);
  const [hasMoreChatMessages, setHasMoreChatMessages] = useState(false);
  const [isLoadPrevMesg, setIsLoadPrevMesg] = useState(false);
  const [IsLoading, setIsLoading] = useState(false);
 
  // review modal state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
 
  const lastMessageDate = useRef(null);
  const messagesEndRef = useRef(null);
  const prevChatIdRef = useRef(null);
 
  const user = useSelector(userSignUpData);
  const userId = user?.id;
 
  // 🔥 PROVJERA: Da li je ovo kupac kome je prodat oglas
  const isBuyerOfSoldItem =
    !isSelling &&
    selectedChatDetails?.item?.status === "sold out" &&
    Number(selectedChatDetails?.item?.sold_to) ===
      Number(selectedChatDetails?.buyer_id);
 
  // 🔥 Da li je kupac VEĆ ostavio recenziju
  const hasAlreadyReviewed =
    isBuyerOfSoldItem && !!selectedChatDetails?.item?.review;
 
  // 🔥 Ako NIJE ostavio recenziju -> prikazujemo samo dugme koje otvara popup
  const canLeaveReview =
    isBuyerOfSoldItem && !selectedChatDetails?.item?.review;
 
  // 🔥 FILTER LOGIC
  const filteredMessages = chatMessages.filter((msg) => {
    if (!searchQuery) return true;
    const text = msg.message || "";
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  });
 
  useEffect(() => {
    if (
      incomingMessage &&
      incomingMessage.item_offer_id === selectedChatDetails?.id
    ) {
      setChatMessages((prev) => {
        const exists = prev.some(
          (msg) =>
            msg.id === incomingMessage.id ||
            (msg.id &&
              msg.id.toString().startsWith("temp-") &&
              msg.message === incomingMessage.message)
        );
        if (exists) return prev;
        return [...prev, incomingMessage];
      });
    }
  }, [incomingMessage, selectedChatDetails?.id]);
 
  useEffect(() => {
    if (
      messageStatusUpdate &&
      Number(messageStatusUpdate.chat_id) === selectedChatDetails?.id
    ) {
      setChatMessages((prev) =>
        prev.map((msg) => {
          if (
            messageStatusUpdate.message_id &&
            msg.id === messageStatusUpdate.message_id
          ) {
            return { ...msg, status: messageStatusUpdate.status };
          }
          if (!messageStatusUpdate.message_id && msg.sender_id === userId) {
            return { ...msg, status: messageStatusUpdate.status };
          }
          return msg;
        })
      );
    }
  }, [messageStatusUpdate, selectedChatDetails?.id, userId]);
 
  useEffect(() => {
    const currentChatId = selectedChatDetails?.id;
 
    if (currentChatId && currentChatId !== prevChatIdRef.current) {
      lastMessageDate.current = null;
      setChatMessages([]);
 
      // zatvori modal kad se promijeni chat
      setShowReviewDialog(false);
 
      fetchChatMessages(1);
 
      if (markChatAsSeen) {
        markChatAsSeen(chatId);
      }
 
      prevChatIdRef.current = currentChatId;
    }
  }, [selectedChatDetails?.id, chatId, markChatAsSeen]);
 
  // ako je recenzija vec ostavljena (npr. nakon submit-a), zatvori modal
  useEffect(() => {
    if (showReviewDialog && hasAlreadyReviewed) {
      setShowReviewDialog(false);
    }
  }, [showReviewDialog, hasAlreadyReviewed]);
 
  useEffect(() => {
    if (!notification) return;
 
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
 
      setChatMessages((prev) => {
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    }
 
    if (
      (notification?.type === "seen" ||
        notification?.type === "message_seen") &&
      Number(notification?.item_offer_id) === Number(chatId)
    ) {
      setChatMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.sender_id === userId ? { ...msg, status: "seen" } : msg
        )
      );
    }
  }, [notification, chatId, userId, isSelling]);
 
  const fetchChatMessages = async (page) => {
    try {
      page > 1 ? setIsLoadPrevMesg(true) : setIsLoading(true);
 
      const response = await getMessagesApi.chatMessages({
        item_offer_id: selectedChatDetails?.id,
        page,
      });
 
      if (response?.data?.error === false) {
        const currentPage = Number(response?.data?.data?.current_page);
        const lastPage = Number(response?.data?.data?.last_page);
        const hasMore = currentPage < lastPage;
        const messagesData = (response?.data?.data?.data || []).reverse();
 
        const messagesWithStatus = messagesData.map((msg) => ({
          ...msg,
          status:
            msg.sender_id === userId
              ? msg.is_read === 1 ||
                msg.is_read === true ||
                msg.status === "seen"
                ? "seen"
                : "delivered"
              : "seen",
        }));
 
        setCurrentMessagesPage(currentPage);
        setHasMoreChatMessages(hasMore);
 
        if (page > 1) {
          setChatMessages((prev) => [...messagesWithStatus, ...prev]);
        } else {
          setChatMessages(messagesWithStatus);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadPrevMesg(false);
      setIsLoading(false);
    }
  };
 
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
 
  useEffect(() => {
    if (chatMessages.length > 0 && !IsLoading && !isLoadPrevMesg && !searchQuery) {
      scrollToBottom();
    }
  }, [chatMessages.length, IsLoading, isLoadPrevMesg, scrollToBottom, searchQuery]);
 
  return (
    <>
      <div className="flex-1 overflow-y-auto bg-muted p-4 flex flex-col gap-2.5 relative">
        {IsLoading ? (
          <ChatMessagesSkeleton />
        ) : (
          <>
            {/* Review popup (modal) */}
            {showReviewDialog && canLeaveReview && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 p-4">
                <div className="w-full max-w-md">
                  <GiveReview
                    itemId={selectedChatDetails?.item_id}
                    sellerId={selectedChatDetails?.seller_id}
                    setSelectedChatDetails={setSelectedChatDetails}
                    setBuyer={setBuyer}
                    onClose={() => setShowReviewDialog(false)}
                    onSuccess={() => setShowReviewDialog(false)}
                  />
                </div>
              </div>
            )}
 
            {/* Load more button */}
            {hasMoreChatMessages && !IsLoading && !searchQuery && (
              <div className="absolute top-3 left-0 right-0 z-10 flex justify-center pb-2">
                <button
                  onClick={() => fetchChatMessages(currentMessagesPage + 1)}
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
 
            {/* Offer price */}
            {!hasMoreChatMessages &&
              selectedChatDetails?.amount > 0 &&
              !searchQuery && (
                <div
                  className={cn(
                    "flex flex-col gap-1 rounded-md p-2 w-fit",
                    isSelling ? "bg-border" : "bg-primary text-white self-end"
                  )}
                >
                  <p className="text-sm">
                    {isSelling ? t("offer") : t("yourOffer")}
                  </p>
                  <span className="text-xl font-medium">
                    {formatPriceAbbreviated(selectedChatDetails.amount)}
                  </span>
                </div>
              )}
 
            {/* Messages */}
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => {
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
                      >
                        {renderMessageContent(message, true)}
                        <div className="flex items-center justify-end gap-1">
                          <p className="text-xs text-muted-foreground">
                            {formatChatMessageTime(message?.created_at)}
                          </p>
                          <MessageStatusIcon status={messageStatus} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex flex-col gap-1 max-w-[80%]",
                          message.message_type === "audio" && "w-full"
                        )}
                      >
                        {renderMessageContent(message, false)}
                        <p className="text-xs text-muted-foreground ltr:text-left rtl:text-right">
                          {formatChatMessageTime(message?.created_at)}
                        </p>
                      </div>
                    )}
                  </Fragment>
                );
              })
            ) : (
              searchQuery && (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 pt-10">
                  <span className="text-4xl">🔍</span>
                  <p>Nema pronađenih poruka za "{searchQuery}"</p>
                </div>
              )
            )}
 
            {/* Typing indicator */}
            {isOtherUserTyping && !searchQuery && (
              <div className="flex flex-col gap-1 max-w-[80%]">
                <div className="text-black bg-border p-3 rounded-md w-fit">
                  <div className="flex gap-1.5 items-center">
                    <span
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
 
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
 
      {/* 🔥 SEKCIJA ZA RECENZIJU - Iznad SendMessage */}
      {/* Ako je VEĆ ostavio recenziju - samo prikaži info (ne može opet) */}
      {hasAlreadyReviewed && (
        <ReviewAlreadySubmitted review={selectedChatDetails?.item?.review} />
      )}
 
      {/* Ako NIJE ostavio recenziju - prikaži dugme koje otvara popup */}
      {canLeaveReview && (
        <div className="mx-4 mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowReviewDialog(true)}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-95"
          >
            Ostavi recenziju
          </button>
        </div>
      )}
 
      {/* 🔥 CHAT UVIJEK RADI - SendMessage je uvijek prikazan */}
      <SendMessage
        key={`send-${selectedChatDetails?.id}`}
        selectedChatDetails={selectedChatDetails}
        setChatMessages={setChatMessages}
        isOtherUserTyping={isOtherUserTyping}
      />
    </>
  );
};
 
export default ChatMessages;