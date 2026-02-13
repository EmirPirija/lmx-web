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
  X,
  Store,
  ShoppingBag,
  Wifi,
  SlidersHorizontal,
} from "@/components/Common/UnifiedIconPack";


const ChatList = ({
  chatId,
  chats,
  IsLoading,
  currentUserId,
  isLargeScreen,
  isConnected,
  roleFilter,
  setRoleFilter,
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

  const roleFilters = [
    { id: "all", label: "Sve", icon: SlidersHorizontal },
    { id: "selling", label: "Prodajem", icon: Store },
    { id: "buying", label: "Kupujem", icon: ShoppingBag },
    { id: "online", label: "Online", icon: Wifi },
  ];
  

  return (
    <div
      className={cn(
        "h-full min-h-[70vh] lg:min-h-[760px] flex flex-col",
        "bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900",
        "overflow-hidden"
      )}
    >
      {/* Header */}
      <div className="p-4 lg:p-5 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/70">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-xl text-slate-900 dark:text-slate-100">Poruke</h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isConnected ? "Povezano u realnom vremenu" : "Pokušaj ponovnog povezivanja..."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full",
                isConnected ? "bg-emerald-500" : "bg-rose-500"
              )}
              title={isConnected ? "Povezano" : "Nije povezano"}
            />

            {/* Bulk Select Toggle */}
            <button
              onClick={() => {
                setBulkSelectMode(!bulkSelectMode);
                if (bulkSelectMode) deselectAll();
              }}
              className={cn(
                "p-2 rounded-lg transition-all",
                bulkSelectMode 
                  ? "bg-primary text-white shadow-md shadow-primary/25" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
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
            className="w-full pl-10 pr-10 py-2.5 bg-slate-100 rounded-xl border-0 dark:bg-slate-800/80 dark:text-slate-100
                       focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/20
                       placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                         hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 p-1 bg-slate-100 rounded-xl dark:bg-slate-800/70">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg",
                "text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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
                      : "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-200"
                  )}
                >
                  {tab.count > 99 ? "99+" : tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {roleFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setRoleFilter(filter.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                roleFilter === filter.id
                  ? "border-primary/30 bg-primary/10 text-primary dark:border-primary/40 dark:bg-primary/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <filter.icon className="h-3.5 w-3.5" />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkSelectMode && (
        <div className="px-4 py-3 bg-primary/5 dark:bg-primary/10 border-b border-primary/10 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
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
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {selectedChats.size} odabrano
            </span>
          </div>
          
          {selectedChats.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={bulkMarkRead}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                title="Označi kao pročitano"
              >
                <MailOpen size={18} />
              </button>
              <button
                onClick={bulkArchive}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
                title="Arhiviraj"
              >
                <ArchiveIcon size={18} />
              </button>
              <button
                onClick={bulkDelete}
                className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors"
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
          "overflow-y-auto min-h-0 dark:scrollbar-thumb-slate-700"
        )}
      >
        <div className="sticky top-0 h-2 bg-gradient-to-b from-white/80 to-transparent dark:from-slate-900/80 z-10 pointer-events-none" />
        
        {IsLoading ? (
          <div className="space-y-1 p-3">
            {Array.from({ length: 8 }, (_, index) => (
              <ChatListCardSkeleton key={index} />
            ))}
          </div>
        ) : chats.length > 0 ? (
          <div className="p-3 space-y-1.5">
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
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Sve pročitano!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nemate nepročitanih poruka</p>
              </>
            ) : activeTab === "archived" ? (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Archive size={32} className="text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Arhiva je prazna</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Arhivirane poruke će se prikazati ovdje</p>
              </>
            ) : searchQuery ? (
              <>
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} className="text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Nema rezultata</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pokušajte s drugim pojmom za pretragu</p>
              </>
            ) : (
              <NoChatListFound />
            )}
          </div>
        )}

        <div className="sticky bottom-0 h-2 bg-gradient-to-t from-white/80 to-transparent dark:from-slate-900/80 pointer-events-none" />
      </div>
    </div>
  );
};

export default ChatList;
