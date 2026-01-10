import { useState, useRef } from "react";
import { formatTime } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Archive, 
  ArchiveRestore,
  Trash2, 
  Mail, 
  MailOpen, 
  Pin,
  PinOff,
  CheckSquare,
  Square,
  Volume2, // ✅ Dodana ikona za zvuk
  VolumeX  // ✅ Dodana ikona za mute
} from "lucide-react";

const ChatListCard = ({ 
  chat, 
  isActive, 
  currentUserId, 
  isArchived,
  // Bulk select
  bulkSelectMode,
  isSelected,
  toggleSelect,
  // Actions
  onArchive,
  onUnarchive,
  onDelete,
  onMarkUnread,
  onMarkRead,
  onPin,
  onMute, // ✅ Dodan prop za mute funkciju
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);
  const cardRef = useRef(null);

  // Determine other user
  const otherUser = chat?.buyer?.id === currentUserId ? chat?.seller : chat?.buyer;
  const isSelling = chat?.seller?.id === currentUserId;
  
  const isUnread = chat?.unread_chat_count > 0;
  const isOnline = otherUser?.is_online || false;
  const isTyping = otherUser?.is_typing || false;
  const isPinned = chat?.is_pinned || false;
  const isMuted = chat?.is_muted || false; // ✅ Status utišavanja

  if (!chat || !otherUser) return null;

  const lastMessage = chat?.last_message || "";
  const lastMessageType = chat?.last_message_type || "text";

  // Swipe handlers
  const handleTouchStart = (e) => {
    if (bulkSelectMode) return;
    touchStartX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping || bulkSelectMode) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    
    // Limit swipe distance
    const maxSwipe = 100;
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    setSwipeOffset(clampedDiff);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    const threshold = 60;
    
    if (swipeOffset > threshold) {
      // Swipe right -> Archive/Unarchive
      if (isArchived) {
        onUnarchive?.();
      } else {
        onArchive?.();
      }
    } else if (swipeOffset < -threshold) {
      // Swipe left -> Delete
      onDelete?.();
    }
    
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  // Format last message preview
  const getLastMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="flex items-center gap-1.5 italic text-primary font-medium">
          piše
          <span className="flex gap-0.5 pb-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0s" }}></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.15s" }}></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></span>
          </span>
        </span>
      );
    }

    if (!lastMessage) return "Nema poruka";

    switch (lastMessageType) {
      case "audio":
        return (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a1 1 0 00-1 1v4a1 1 0 002 0V4a1 1 0 00-1-1z"/>
              <path d="M6 8a1 1 0 011 1v.5a3 3 0 006 0V9a1 1 0 112 0v.5a5 5 0 01-10 0V9a1 1 0 011-1z"/>
            </svg>
            <span>Glasovna poruka</span>
          </span>
        );
      case "file":
      case "file_and_text":
        return (
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
            </svg>
            <span className="truncate">{lastMessageType === "file" ? "Fotografija" : lastMessage}</span>
          </span>
        );
      default:
        return lastMessage;
    }
  };

  const cardContent = (
    <>
      {/* Swipe action backgrounds */}
      <div className={cn(
        "absolute inset-y-0 left-0 w-24 flex items-center justify-center transition-opacity",
        swipeOffset > 30 ? "opacity-100" : "opacity-0",
        isArchived ? "bg-primary" : "bg-amber-500"
      )}>
        {isArchived ? <ArchiveRestore className="text-white" size={24} /> : <Archive className="text-white" size={24} />}
      </div>
      <div className={cn(
        "absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500 transition-opacity",
        swipeOffset < -30 ? "opacity-100" : "opacity-0"
      )}>
        <Trash2 className="text-white" size={24} />
      </div>

      {/* Main card content */}
      <div
        ref={cardRef}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200",
          "bg-white border border-transparent",
          isActive 
            ? "bg-primary text-white shadow-lg shadow-primary/20" 
            : "hover:bg-slate-50 hover:border-slate-200",
          isPinned && !isActive && "bg-amber-50/50 border-amber-200/50",
          isSelected && "bg-primary/10 border-primary/30"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? "none" : "transform 0.2s ease-out"
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Bulk select checkbox */}
        {bulkSelectMode && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSelect();
            }}
            className="flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare size={22} className="text-primary" />
            ) : (
              <Square size={22} className="text-slate-400" />
            )}
          </button>
        )}

        {/* Avatar with online status */}
        <div className="relative flex-shrink-0">
            {/* Online indicator */}
            {isOnline && (
              <div className="absolute bottom-0 right-0 z-10">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                <span className={cn(
                  "relative block w-3 h-3 rounded-full bg-green-500 ring-2",
                  isActive ? "ring-primary" : "ring-white"
                )} />
              </div>
            )}

          <div className={cn(
            "relative rounded-full overflow-hidden ring-2 transition-all",
            isActive ? "ring-white/30" : "ring-slate-200"
          )}>
            <CustomImage
              src={otherUser?.profile}
              alt={otherUser?.name}
              width={52}
              height={52}
              className="w-13 h-13 object-cover"
            />
          </div>

          {/* Pinned indicator */}
          {isPinned && !isActive && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <Pin size={10} className="text-white" />
            </div>
          )}
          
          {/* Muted indicator (mali ikonica ako je mutirano) */}
          {isMuted && !isActive && !isPinned && (
             <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center">
               <VolumeX size={10} className="text-white" />
             </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <h5 className={cn(
                "font-semibold truncate",
                isActive ? "text-white" : "text-slate-900"
              )}>
                {otherUser?.name}
              </h5>
              {!bulkSelectMode && !isActive && (
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0",
                  isSelling 
                    ? "bg-orange-100 text-orange-600" 
                    : "bg-cyan-100 text-cyan-600"
                )}>
                  {isSelling ? "Prodajem" : "Kupujem"}
                </span>
              )}
            </div>
            <span className={cn(
              "text-xs whitespace-nowrap flex-shrink-0",
              isActive ? "text-white/70" : "text-slate-500"
            )}>
              {formatTime(chat?.last_message_time)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className={cn(
              "text-sm truncate",
              isActive 
                ? "text-white/80" 
                : isUnread 
                  ? "text-slate-900 font-medium" 
                  : "text-slate-500"
            )}>
              {getLastMessagePreview()}
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Unread badge */}
              {isUnread && !isActive && (
                <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 
                               bg-primary text-white rounded-full text-xs font-bold">
                  {chat.unread_chat_count > 99 ? "99+" : chat.unread_chat_count}
                </span>
              )}
              
              {/* Actions menu */}
              {!bulkSelectMode && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      onClick={(e) => e.preventDefault()}
                      className={cn(
                        "p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                        isActive ? "hover:bg-white/20" : "hover:bg-slate-200"
                      )}
                    >
                      <MoreVertical size={16} className={isActive ? "text-white" : "text-slate-500"} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onPin?.(); }}>
                      {isPinned ? (
                        <>
                          <PinOff size={16} className="mr-2" />
                          Otkači
                        </>
                      ) : (
                        <>
                          <Pin size={16} className="mr-2" />
                          Zakači na vrh
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); isUnread ? onMarkRead?.() : onMarkUnread?.(); }}>
                      {isUnread ? (
                        <>
                          <MailOpen size={16} className="mr-2" />
                          Označi kao pročitano
                        </>
                      ) : (
                        <>
                          <Mail size={16} className="mr-2" />
                          Označi kao nepročitano
                        </>
                      )}
                    </DropdownMenuItem>

                    {/* ✅ Mute / Unmute Opcija */}
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); onMute?.(); }}>
                      {isMuted ? (
                        <>
                          <Volume2 size={16} className="mr-2" />
                          Uključi notifikacije
                        </>
                      ) : (
                        <>
                          <VolumeX size={16} className="mr-2" />
                          Isključi notifikacije
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); isArchived ? onUnarchive?.() : onArchive?.(); }}>
                      {isArchived ? (
                        <>
                          <ArchiveRestore size={16} className="mr-2" />
                          Vrati iz arhive
                        </>
                      ) : (
                        <>
                          <Archive size={16} className="mr-2" />
                          Arhiviraj
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      onClick={(e) => { e.preventDefault(); onDelete?.(); }}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Obriši
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Item name */}
          {chat?.item?.name && !isActive && (
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {chat.item.name}
            </p>
          )}
        </div>

        {/* Unread indicator line */}
        {isUnread && !isActive && !isSelected && (
          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary" />
        )}
      </div>
    </>
  );

  // If in bulk select mode, don't wrap in link
  if (bulkSelectMode) {
    return (
      <div className="group relative overflow-hidden rounded-xl">
        {cardContent}
      </div>
    );
  }

  return (
    <CustomLink
      href={`/chat?chatid=${chat?.id}`}
      scroll={false}
      shallow={true}
      className="group relative block overflow-hidden rounded-xl"
    >
      {cardContent}
    </CustomLink>
  );
};

export default ChatListCard;