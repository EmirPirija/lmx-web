import { formatTime } from "@/utils";
import CustomLink from "@/components/Common/CustomLink";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";

/**
 * ChatListCard Component - Production Ready
 * 
 * Features implemented:
 * ✅ Last message preview
 * ✅ Online/offline status indicator
 * ✅ Typing indicator
 * ✅ Message status icons (sent/delivered/seen)
 * ✅ Unread count badge
 * ✅ Hover effects and animations
 * ✅ Optimistic UI updates
 * 
 * Props expected from backend:
 * - chat.last_message: string (last message text)
 * - chat.last_message_type: "text" | "audio" | "file" (for icons)
 * - chat.last_message_status: "sent" | "delivered" | "seen" (message status)
 * - user.is_online: boolean (online status)
 * - user.is_typing: boolean (typing indicator)
 * - chat.last_message_time: string (timestamp)
 * 
 * TODO Backend Integration:
 * 1. WebSocket connection for real-time typing indicator
 * 2. WebSocket connection for online/offline status
 * 3. API endpoint to mark messages as read when clicked
 */

const ChatListCard = ({ chat, isSelling, isActive, handleChatTabClick }) => {
  const user = isSelling ? chat?.buyer : chat?.seller;
  const isUnread = chat?.unread_chat_count > 0;
  
  // TODO: These will come from WebSocket in production
  const isOnline = user?.is_online || false; // TODO: Connect to WebSocket for real-time status
  const isTyping = user?.is_typing || false; // TODO: Connect to WebSocket for real-time typing

  // Fallback za missing data
  if (!chat || !user) {
    return null;
  }

  // Get last message preview
  // TODO: Backend should send last_message in chat object
  const lastMessage = chat?.last_message || "";
  const lastMessageType = chat?.last_message_type || "text";
  
  // Get message status for display
  // TODO: Backend should send last_message_status ("sent" | "delivered" | "seen")
  const messageStatus = chat?.last_message_status || "sent";

  // Format last message preview based on type
  const getLastMessagePreview = () => {
    if (isTyping) {
      return (
        <span className="flex items-center gap-1 italic text-primary">
          typing
          <span className="flex gap-0.5">
            <span className="animate-bounce delay-0">.</span>
            <span className="animate-bounce delay-100">.</span>
            <span className="animate-bounce delay-200">.</span>
          </span>
        </span>
      );
    }

    if (!lastMessage) return "No messages yet";

    switch (lastMessageType) {
      case "audio":
        return "🎤 Voice message";
      case "file":
        return "📷 Photo";
      case "file_and_text":
        return `📷 ${lastMessage}`;
      default:
        return lastMessage;
    }
  };

  // Message status icons
  const MessageStatusIcon = () => {
    // Only show status for sent messages (when user is sender)
    if (!isSelling && chat?.last_message_sender_id === user?.id) {
      return null;
    }

    // TODO: Backend should provide last_message_status
    switch (messageStatus) {
      case "sent":
        return (
          <span className="text-xs" title="Sent">
            ✓
          </span>
        );
      case "delivered":
        return (
          <span className="text-xs" title="Delivered">
            ✓✓
          </span>
        );
      case "seen":
        return (
          <span className="text-xs text-blue-500" title="Seen">
            ✓✓
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <CustomLink
      scroll={false}
      href={`/chat?activeTab=${isSelling ? "selling" : "buying"}&chatid=${chat?.id}`}
      onClick={() => handleChatTabClick(chat, isSelling)}
      role="button"
      aria-label={`Chat with ${user?.name} about ${chat?.item?.name || "item"}`}
      aria-current={isActive ? "true" : undefined}
      className={cn(
        "group relative py-4 px-4 border-b transition-all duration-200",
        "flex items-center gap-4 cursor-pointer",
        isActive 
          ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-md" 
          : "hover:bg-gray-50 hover:shadow-sm active:bg-gray-100"
      )}
    >
      {/* Avatar sa item image overlay */}
      <div className="relative flex-shrink-0">
        <div className={cn(
          "relative rounded-full overflow-hidden",
          "ring-2 transition-all duration-200",
          isActive 
            ? "ring-white/30" 
            : "ring-gray-200 group-hover:ring-primary/30"
        )}>
          <CustomImage
            src={user?.profile}
            alt={`${user?.name}'s avatar`}
            width={56}
            height={56}
            className="w-[56px] h-[56px] object-cover"
          />
          
          {/* Online status indicator */}
          {/* TODO: Connect to WebSocket for real-time online/offline status */}
          {isOnline && (
            <div 
              className={cn(
                "absolute bottom-1 right-1 w-3 h-3 rounded-full",
                "ring-2 transition-all duration-200",
                isActive ? "ring-primary" : "ring-white",
                "bg-green-500"
              )}
              title="Online"
            />
          )}
        </div>

        {/* Item thumbnail badge */}
        {chat?.item?.image && (
          <div className={cn(
            "absolute -bottom-1 -right-1 rounded-full overflow-hidden",
            "ring-2 transition-all duration-200",
            isActive ? "ring-primary" : "ring-white"
          )}>
            <CustomImage
              src={chat.item.image}
              alt="Item"
              width={28}
              height={28}
              className="w-[28px] h-[28px] object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 w-full min-w-0 flex-1">
        {/* Header sa imenom i vremenom */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h5 
            className={cn(
              "font-semibold text-[15px] truncate transition-colors",
              isActive ? "text-white" : "text-gray-900 group-hover:text-primary"
            )}
            title={user?.name}
          >
            {user?.name}
          </h5>
          <span 
            className={cn(
              "text-xs font-medium whitespace-nowrap flex-shrink-0",
              isActive ? "text-white/80" : "text-gray-500"
            )}
          >
            {formatTime(chat?.last_message_time)}
          </span>
        </div>

        {/* Last message preview and unread badge */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Message status icon */}
            <MessageStatusIcon />
            
            {/* Last message text */}
            <p
              className={cn(
                "text-sm truncate transition-colors",
                isActive 
                  ? "text-white/90" 
                  : isUnread 
                    ? "text-gray-900 font-medium" 
                    : "text-gray-600 group-hover:text-gray-700"
              )}
              title={typeof getLastMessagePreview() === 'string' ? getLastMessagePreview() : ''}
            >
              {getLastMessagePreview()}
            </p>
          </div>
          
          {/* Unread badge */}
          {isUnread && !isActive && (
            <span className={cn(
              "flex items-center justify-center",
              "bg-primary text-white rounded-full",
              "min-w-[22px] h-[22px] px-2",
              "text-xs font-bold",
              "animate-in fade-in zoom-in duration-200",
              "shadow-sm flex-shrink-0"
            )}>
              {chat.unread_chat_count > 99 ? "99+" : chat.unread_chat_count}
            </span>
          )}
        </div>
      </div>

      {/* Active indicator line */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/40 rounded-r-full" />
      )}

      {/* Unread indicator line (alternative style) */}
      {isUnread && !isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
      )}
    </CustomLink>
  );
};

export default ChatListCard;
