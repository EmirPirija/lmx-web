import { useState } from "react";
import ChatListCard from "./ChatListCard";
import ChatListCardSkeleton from "./ChatListCardSkeleton";
import BlockedUsersMenu from "./BlockedUsersMenu";
import NoChatListFound from "./NoChatListFound";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Inbox, 
  Mail, 
  Archive, 
  CheckSquare, 
  Square,
  Trash2,
  ArchiveIcon,
  MailOpen,
  X
} from "lucide-react";

function formatDateEu(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString("hr-HR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}


const ChatList = ({
  chatId,
  chats,
  IsLoading,
  currentUserId,
  isLargeScreen,
  // Tabs
  activeTab,
  setActiveTab,
  unreadCount,
  archivedCount,
  // Search
  searchQuery,
  setSearchQuery,
  // Bulk select
  bulkSelectMode,
  setBulkSelectMode,
  selectedChats,
  toggleSelectChat,
  selectAll,
  deselectAll,
  bulkArchive,
  bulkDelete,
  bulkMarkRead,
  // Actions
  archiveChat,
  unarchiveChat,
  deleteChat,
  markAsUnread,
  markAsRead,
  pinChat,
  onToggleMute,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const tabs = [
    { 
      id: "inbox", 
      label: "Inbox", 
      icon: Inbox,
      count: null 
    },
    { 
      id: "unread", 
      label: "Nepročitane", 
      icon: Mail,
      count: unreadCount > 0 ? unreadCount : null 
    },
    { 
      id: "archived", 
      label: "Arhiva", 
      icon: Archive,
      count: archivedCount > 0 ? archivedCount : null 
    },
  ];
  

  return (
    <div
      className={cn(
        // glavni container – dodan overflow-hidden da ništa ne “gura” van
        "h-[60vh] max-h-[800px] flex flex-col lg:h-full",
        "bg-gradient-to-br from-slate-50 via-white to-slate-50",
        "overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-2xl text-slate-900">Poruke</h4>
          <div className="flex items-center gap-2">
            {/* Bulk Select Toggle */}
            <button
              onClick={() => {
                setBulkSelectMode(!bulkSelectMode);
                if (bulkSelectMode) deselectAll();
              }}
              className={cn(
                "p-2 rounded-lg transition-all",
                bulkSelectMode 
                  ? "bg-primary text-white" 
                  : "hover:bg-slate-100 text-slate-600"
              )}
              title="Odaberi više"
            >
              <CheckSquare size={20} />
            </button>
            <BlockedUsersMenu />
          </div>
        </div>

        {/* Search Bar */}
        <div
          className={cn(
            "relative transition-all duration-300",
            isSearchFocused ? "ring-2 ring-primary/20 rounded-xl" : ""
          )}
        >
          <Search 
            size={18} 
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
              isSearchFocused ? "text-primary" : "text-slate-400"
            )} 
          />
          <input
            type="text"
            placeholder="Pretraži poruke..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-100 rounded-xl border-0 
                       focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20
                       placeholder:text-slate-400 text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 
                         hover:text-slate-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 p-1 bg-slate-100 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <tab.icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count && (
                <span
                  className={cn(
                    "min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold",
                    activeTab === tab.id 
                      ? "bg-primary text-white" 
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkSelectMode && (
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/10 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <button
              onClick={selectedChats.size === chats.length ? deselectAll : selectAll}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
            >
              {selectedChats.size === chats.length ? (
                <>
                  <CheckSquare size={18} />
                  Odznači sve
                </>
              ) : (
                <>
                  <Square size={18} />
                  Označi sve
                </>
              )}
            </button>
            <span className="text-sm text-slate-500">
              {selectedChats.size} odabrano
            </span>
          </div>
          
          {selectedChats.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={bulkMarkRead}
                className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-primary transition-colors"
                title="Označi kao pročitano"
              >
                <MailOpen size={18} />
              </button>
              <button
                onClick={bulkArchive}
                className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-amber-600 transition-colors"
                title="Arhiviraj"
              >
                <ArchiveIcon size={18} />
              </button>
              <button
                onClick={bulkDelete}
                className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-red-600 transition-colors"
                title="Obriši"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Chat List */}
      <div
        id="chatList"
        className={cn(
          "flex-1 relative scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent",
          // ključni dio – min-h-0 da flex child ne raste preko roditelja
          "overflow-y-auto min-h-0"
        )}
      >
        <div className="sticky top-0 h-2 bg-gradient-to-b from-white/80 to-transparent z-10 pointer-events-none" />
        
        {IsLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 8 }, (_, index) => (
              <ChatListCardSkeleton key={index} />
            ))}
          </div>
        ) : chats.length > 0 ? (
          <div className="p-3 space-y-1">
            {chats.map((chat, index) => (
              <div
                key={chat.id || index}
                className="animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ChatListCard
                  chat={chat}
                  isActive={chat?.id === chatId}
                  currentUserId={currentUserId}
                  isArchived={activeTab === "archived"}
                  // Bulk select
                  bulkSelectMode={bulkSelectMode}
                  isSelected={selectedChats.has(chat.id)}
                  toggleSelect={() => toggleSelectChat(chat.id)}
                  // Actions
                  onArchive={() => archiveChat(chat.id)}
                  onUnarchive={() => unarchiveChat(chat.id)}
                  onDelete={() => deleteChat(chat.id)}
                  onMarkUnread={() => markAsUnread(chat.id)}
                  onMarkRead={() => markAsRead(chat.id)}
                  onPin={() => pinChat(chat.id)}
                  onMute={() => onToggleMute(chat.id, chat.is_muted)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            {activeTab === "unread" ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <MailOpen size={32} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Sve pročitano!</h3>
                <p className="text-sm text-slate-500">Nemate nepročitanih poruka</p>
              </>
            ) : activeTab === "archived" ? (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Archive size={32} className="text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Arhiva je prazna</h3>
                <p className="text-sm text-slate-500">Arhivirane poruke će se prikazati ovdje</p>
              </>
            ) : searchQuery ? (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Nema rezultata</h3>
                <p className="text-sm text-slate-500">Pokušajte s drugim pojmom za pretragu</p>
              </>
            ) : (
              <NoChatListFound />
            )}
          </div>
        )}

        <div className="sticky bottom-0 h-2 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

export default ChatList;
