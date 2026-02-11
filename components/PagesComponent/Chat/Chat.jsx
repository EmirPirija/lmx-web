"use client";
import SelectedChatHeader from "./SelectedChatHeader";
import ChatList from "./ChatList";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import NoChatFound from "./NoChatFound";
import ChatMessages from "./ChatMessages";
import { useSelector } from "react-redux";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { useMediaQuery } from "usehooks-ts";
import { chatListApi } from "@/utils/api";
import { useNavigate } from "@/components/Common/useNavigate";
import { userSignUpData } from "@/redux/reducer/authSlice";
import useWebSocket from "@/hooks/useWebSocket";
import { toast } from "sonner";

const Chat = () => {
  const searchParams = useSearchParams();
  const chatId = Number(searchParams.get("chatid")) || "";
  const [selectedChatDetails, setSelectedChatDetails] = useState();
  const langCode = useSelector(getCurrentLangCode);
  const { navigate } = useNavigate();
  const user = useSelector(userSignUpData);

  const [IsLoading, setIsLoading] = useState(true);

  // --- TABS & LISTS STATE ---
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox', 'unread', 'archived'
  const [roleFilter, setRoleFilter] = useState("all"); // 'all', 'selling', 'buying', 'online'
  
  // --- SEARCH STATES ---
  const [searchQuery, setSearchQuery] = useState(""); // Za pretragu korisnika u listi lijevo
  const [messageSearchQuery, setMessageSearchQuery] = useState(""); // Za pretragu poruka u chatu desno
  
  // --- BULK ACTION STATES ---
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState(new Set());

  // --- DATA STATES ---
  const [chats, setChats] = useState({
    all: [],        // Svi aktivni chatovi
    archived: [],   // Arhivirani chatovi
    currentPage: 1,
    hasMore: false,
  });

  // --- WEBSOCKET STATES ---
  const [typingUsers, setTypingUsers] = useState({});
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [messageStatusUpdate, setMessageStatusUpdate] = useState(null);
  const markedSeenChats = useRef(new Set());
  const onlineTimeouts = useRef(new Map());

  const isLargeScreen = useMediaQuery("(min-width: 1200px)");

  // === HELPERS ZA FILTRIRANJE ===

  const filterChats = useCallback(
    (list) => {
      const normalizedList = Array.isArray(list) ? list : [];

      const roleFiltered = normalizedList.filter((chat) => {
        const otherUser = chat?.buyer?.id === user?.id ? chat?.seller : chat?.buyer;
        const isSellingChat =
          chat?.chatType === "selling" || Number(chat?.seller_id) === Number(user?.id);

        switch (roleFilter) {
          case "selling":
            return isSellingChat;
          case "buying":
            return !isSellingChat;
          case "online":
            return Boolean(otherUser?.is_online);
          default:
            return true;
        }
      });

      if (!searchQuery.trim()) return roleFiltered;

      const query = searchQuery.toLowerCase();
      return roleFiltered.filter((chat) => {
        const otherUser = chat?.buyer?.id === user?.id ? chat?.seller : chat?.buyer;
        const userName = otherUser?.name?.toLowerCase() || "";
        const itemName = (chat?.item?.name || chat?.item?.translated_name || "").toLowerCase();
        return userName.includes(query) || itemName.includes(query);
      });
    },
    [roleFilter, searchQuery, user?.id]
  );

  // Računamo liste
  const inboxChats = chats.all.filter(c => !c.is_archived && !c.is_deleted);
  const unreadChats = inboxChats.filter(c => c.unread_chat_count > 0);
  const archivedChats = chats.archived;

  // Određujemo koja lista se prikazuje
  const getCurrentList = () => {
    switch (activeTab) {
      case "unread":
        return filterChats(unreadChats);
      case "archived":
        return filterChats(archivedChats);
      default:
        return filterChats(inboxChats);
    }
  };

  const unreadCount = unreadChats.length;
  const archivedCount = archivedChats.length;

  // === WEBSOCKET HANDLER ===
  const handleWebSocketMessage = useCallback((data) => {
    // console.log('📨 WebSocket message received:', data);
    
    switch (data.type) {
      case 'typing':
        handleTypingIndicator(data);
        break;
      case 'new_message':
        handleNewMessage(data);
        break;
      case 'message_status':
        handleMessageStatus(data);
        break;
      case 'user_online_status':
      case 'user_status':
        handleOnlineStatus(data);
        break;
      default:
        break;
    }
  }, [chatId, user?.id]);

  const { isConnected, subscribeToChat, unsubscribeFromChat, subscribeToMultipleChats } = useWebSocket({
    userId: user?.id,
    onMessage: handleWebSocketMessage,
  });

  // Subscribe na trenutni chat
  useEffect(() => {
    if (chatId && user?.id && isConnected) {
      subscribeToChat(chatId);
    }
    return () => {
      if (chatId) {
        unsubscribeFromChat(chatId);
        markedSeenChats.current.delete(chatId);
      }
    };
  }, [chatId, user?.id, isConnected, subscribeToChat, unsubscribeFromChat]);

  // Subscribe na sve chatove u listi (za update zadnje poruke i statusa u realnom vremenu)
  useEffect(() => {
    if (!isConnected || !user?.id) return;
    const allChatIds = [...chats.all, ...chats.archived].map(c => c.id).filter(Boolean);
    if (allChatIds.length > 0) {
      subscribeToMultipleChats(allChatIds);
    }
  }, [isConnected, user?.id, chats.all, chats.archived, subscribeToMultipleChats]);

  // === WEBSOCKET LOGIC FUNCTIONS ===
  
  function handleTypingIndicator(data) {
    const eventUserId = Number(data.user_id);
    const eventChatId = Number(data.chat_id);
    
    if (eventUserId === Number(user?.id)) return;
    
    const isTypingBool = data.is_typing === true || data.is_typing === 'true' || 
                         data.is_typing === 1 || data.is_typing === '1';

    updateChatProperty(eventChatId, (chat) => {
      const newChat = { ...chat };
      if (newChat.buyer?.id === eventUserId) {
        newChat.buyer = { ...newChat.buyer, is_typing: isTypingBool };
      }
      if (newChat.seller?.id === eventUserId) {
        newChat.seller = { ...newChat.seller, is_typing: isTypingBool };
      }
      return newChat;
    });

    if (eventChatId === Number(chatId)) {
      if (isTypingBool) {
        setTypingUsers(prev => ({ ...prev, [eventChatId]: eventUserId }));
        // Auto remove typing indicator after 3s
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = { ...prev };
            if (updated[eventChatId] === eventUserId) delete updated[eventChatId];
            return updated;
          });
        }, 3000);
      } else {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[eventChatId];
          return updated;
        });
      }
    }
  }

  function handleMessageStatus(data) {
    setMessageStatusUpdate(data);
  }

  function handleOnlineStatus(data) {
    const targetUserId = Number(data.user_id);
    
    // Normalizacija statusa
    const rawStatus = data.is_online !== undefined ? data.is_online : data.status;
    const isOnline = 
      rawStatus === true || 
      rawStatus === "true" || 
      rawStatus === 1 || 
      rawStatus === "1" || 
      rawStatus === "online";
    
    if (!isOnline) {
      updateUserOnlineStatus(targetUserId, false);
      return;
    }
    
    if (onlineTimeouts.current.has(targetUserId)) {
      clearTimeout(onlineTimeouts.current.get(targetUserId));
    }
    
    updateUserOnlineStatus(targetUserId, true);
    
    // Auto-offline fallback
    const timeout = setTimeout(() => {
      updateUserOnlineStatus(targetUserId, false);
      onlineTimeouts.current.delete(targetUserId);
    }, 120000); // 2 minute
    
    onlineTimeouts.current.set(targetUserId, timeout);
  }

  function updateUserOnlineStatus(targetUserId, isOnline) {
    const updateList = (list) => list.map(chat => {
      const newChat = { ...chat };
      if (newChat.buyer?.id === targetUserId) {
        newChat.buyer = { ...newChat.buyer, is_online: isOnline };
      }
      if (newChat.seller?.id === targetUserId) {
        newChat.seller = { ...newChat.seller, is_online: isOnline };
      }
      return newChat;
    });

    setChats(prev => ({
      ...prev,
      all: updateList(prev.all),
      archived: updateList(prev.archived)
    }));
    
    setSelectedChatDetails(prev => {
      if (!prev) return prev;
      const newDetails = { ...prev };
      if (newDetails.buyer?.id === targetUserId) {
        newDetails.buyer = { ...newDetails.buyer, is_online: isOnline };
      }
      if (newDetails.seller?.id === targetUserId) {
        newDetails.seller = { ...newDetails.seller, is_online: isOnline };
      }
      return newDetails;
    });
  }

  function handleNewMessage(data) {
    const message = data.message || data;
    const msgChatId = Number(message.chat_id || message.item_offer_id);
    const senderId = Number(message.sender_id);
    const currentUserId = Number(user?.id);
    const currentOpenChatId = Number(chatId);
    
    // Ažuriraj listu chatova (pomjeri na vrh, update tekst)
    updateChatProperty(msgChatId, (chat) => {
      const shouldIncrementUnread = senderId !== currentUserId && msgChatId !== currentOpenChatId;
      return {
        ...chat,
        last_message: message.message,
        last_message_type: message.message_type,
        last_message_time: message.created_at,
        last_message_sender_id: senderId,
        unread_chat_count: shouldIncrementUnread 
          ? (chat.unread_chat_count || 0) + 1 
          : chat.unread_chat_count
      };
    });

    // Sortiraj listu ponovo
    setChats(prev => ({
      ...prev,
      all: [...prev.all].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.last_message_time) - new Date(a.last_message_time);
      })
    }));
    
    // Ako je taj chat otvoren, dodaj poruku u state
    if (msgChatId === currentOpenChatId) {
      setIncomingMessage({
        ...message,
        id: message.id || `ws-${Date.now()}`,
        item_offer_id: msgChatId,
        created_at: message.created_at || new Date().toISOString(),
        status: senderId === currentUserId ? 'sent' : 'delivered'
      });
      
      if (senderId !== currentUserId) {
        markChatAsSeenInternal(msgChatId, false);
      }
    }
  }

  function updateChatProperty(chatId, updateFn) {
    setChats(prev => ({
      ...prev,
      all: prev.all.map(chat => chat.id === chatId ? updateFn(chat) : chat),
      archived: prev.archived.map(chat => chat.id === chatId ? updateFn(chat) : chat)
    }));
  }

  // === CHAT ACTIONS ===

  // 1. MUTE CHAT
  const muteChat = async (targetChatId) => {
      const id = targetChatId || chatId;
      try {
          await chatListApi.muteChat(id);
          toast.success("Notifikacije za ovaj chat su isključene");
      } catch (error) {
          toast.error("Greška pri isključivanju notifikacija");
      }
  };


const handleToggleMuteChat = async (targetChatId, isCurrentlyMuted) => {
    try {
      // 1. Optimistično ažuriranje UI-a (odmah mijenjamo state)
      const updateList = (list) => list.map(c => 
        c.id === targetChatId ? { ...c, is_muted: !isCurrentlyMuted } : c
      );

      setChats(prev => ({
        ...prev,
        all: updateList(prev.all),
        archived: updateList(prev.archived)
      }));

      // Ažuriraj i selectedChatDetails ako je taj chat trenutno otvoren
      if (selectedChatDetails?.id === targetChatId) {
        setSelectedChatDetails(prev => ({ ...prev, is_muted: !isCurrentlyMuted }));
      }

      // 2. API Poziv
      if (isCurrentlyMuted) {
        await chatListApi.unmuteChat(targetChatId);
        toast.success("Notifikacije uključene");
      } else {
        await chatListApi.muteChat(targetChatId);
        toast.success("Notifikacije isključene");
      }

    } catch (error) {
      console.error("Greška pri mute/unmute:", error);
      toast.error("Greška pri promjeni postavki");
      fetchAllChats(); // Vrati staro stanje ako pukne API
    }
  };
  

  // 2. ARCHIVE CHAT
  const archiveChat = async (chatId) => {
    try {
      setChats(prev => {
        const chatToArchive = prev.all.find(c => c.id === chatId);
        if (!chatToArchive) return prev; 
        
        return {
          ...prev,
          all: prev.all.filter(c => c.id !== chatId),
          archived: [{ ...chatToArchive, is_archived: true }, ...prev.archived]
        };
      });
      
      await chatListApi.archiveChat(chatId);
      toast.success("Chat arhiviran");
      
      // Ako arhiviramo trenutno otvoreni chat, vratimo se nazad
      if(Number(chatId) === Number(selectedChatDetails?.id)) {
          handleBack();
      }

    } catch (error) {
      console.error("Error archiving chat:", error);
      toast.error("Greška pri arhiviranju");
      fetchAllChats(); 
    }
  };

  const unarchiveChat = async (chatId) => {
    try {
      setChats(prev => {
        const chatToUnarchive = prev.archived.find(c => c.id === chatId);
        if (!chatToUnarchive) return prev;
        
        return {
          ...prev,
          archived: prev.archived.filter(c => c.id !== chatId),
          all: [{ ...chatToUnarchive, is_archived: false }, ...prev.all]
        };
      });
      
      await chatListApi.unarchiveChat(chatId);
      toast.success("Chat vraćen u inbox");
    } catch (error) {
      console.error("Error unarchiving chat:", error);
      toast.error("Greška pri vraćanju");
      fetchAllChats();
    }
  };

  // 3. DELETE CHAT
  const deleteChat = (chatId) => {
    toast("Jeste li sigurni da želite obrisati ovaj razgovor?", {
      description: "Ova radnja je nepovratna i izbrisat će sve poruke.",
      action: {
        label: "Obriši",
        onClick: async () => {
          try {
            setChats(prev => ({
              ...prev,
              all: prev.all.filter(c => c.id !== chatId),
              archived: prev.archived.filter(c => c.id !== chatId)
            }));
            
            await chatListApi.deleteChat(chatId);
            toast.success("Chat uspješno obrisan");
            
            if (Number(chatId) === Number(selectedChatDetails?.id)) {
              handleBack();
            }
          } catch (error) {
            console.error("Error deleting chat:", error);
            toast.error("Greška pri brisanju");
            fetchAllChats();
          }
        },
      },
      cancel: {
        label: "Odustani",
        onClick: () => toast.dismiss(),
      },
      duration: 5000,
    });
  };

  // --- WRAPPERS ZA HEADER ---
  const handleDeleteCurrentChat = () => {
      if(chatId) deleteChat(chatId);
  };


  const handleUnarchiveCurrentChat = () => {
    if(chatId) unarchiveChat(chatId);
  };

  const handleArchiveCurrentChat = () => {
      if(chatId) archiveChat(chatId);
  };
  
  const handleMessageSearch = (query) => {
      setMessageSearchQuery(query);
  };

  // --- OSTALE AKCIJE ---

  const markAsUnread = async (chatId) => {
    try {
      updateChatProperty(chatId, chat => ({ ...chat, unread_chat_count: 1 }));
      await chatListApi.markAsUnread(chatId);
      toast.success("Označeno kao nepročitano");
    } catch (error) {
      console.error("Error marking as unread:", error);
    }
  };

  const markAsRead = async (chatId) => {
    try {
      updateChatProperty(chatId, chat => ({ ...chat, unread_chat_count: 0 }));
      await chatListApi.markSeen(chatId);
      toast.success("Označeno kao pročitano");
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const pinChat = async (chatId) => {
    try {
      const chat = [...chats.all, ...chats.archived].find(c => c.id === chatId);
      const newPinned = !chat?.is_pinned;
      
      updateChatProperty(chatId, chat => ({ ...chat, is_pinned: newPinned }));
      
      setChats(prev => ({
        ...prev,
        all: [...prev.all].sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.last_message_time) - new Date(a.last_message_time);
        })
      }));
      
      await chatListApi.pinChat(chatId, newPinned);
      toast.success(newPinned ? "Chat zakačen" : "Chat otkačen");
    } catch (error) {
      console.error("Error pinning chat:", error);
      toast.error("Greška");
    }
  };

  // --- BULK ACTIONS ---
  const bulkArchive = () => {
    const ids = Array.from(selectedChats);
    const count = ids.length;

    if (count === 0) return;

    toast(`Želite li arhivirati ${count} razgovora?`, {
      description: "Razgovori će biti prebačeni u arhivu.",
      action: {
        label: "Arhiviraj sve",
        onClick: async () => {
          try {
            setChats(prev => {
              const chatsToArchive = prev.all.filter(c => selectedChats.has(c.id));
              return {
                all: prev.all.filter(c => !selectedChats.has(c.id)),
                archived: [...prev.archived, ...chatsToArchive]
              };
            });

            setBulkSelectMode(false);
            setSelectedChats(new Set());

            await Promise.all(ids.map(id => chatListApi.archiveChat(id)));
            toast.success("Razgovori arhivirani");
          } catch (error) {
            console.error("Error bulk archiving:", error);
            toast.error("Greška pri arhiviranju");
            fetchAllChats();
          }
        },
      },
      cancel: {
        label: "Odustani",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const bulkDelete = () => {
    const ids = Array.from(selectedChats);
    const count = ids.length;

    if (count === 0) return;

    toast(`Jeste li sigurni da želite obrisati ${count} razgovora?`, {
      description: "Ovo se ne može poništiti.",
      action: {
        label: "Obriši sve",
        onClick: async () => {
          try {
            setChats(prev => ({
              ...prev,
              all: prev.all.filter(c => !selectedChats.has(c.id)),
              archived: prev.archived.filter(c => !selectedChats.has(c.id))
            }));

            setBulkSelectMode(false);
            setSelectedChats(new Set());

            if (selectedChatDetails && selectedChats.has(selectedChatDetails.id)) {
              handleBack();
            }

            await Promise.all(ids.map(id => chatListApi.deleteChat(id)));
            toast.success(`${count} razgovora obrisano`);

          } catch (error) {
            console.error("Error bulk deleting:", error);
            toast.error("Greška pri grupnom brisanju");
            fetchAllChats();
          }
        }
      },
      cancel: {
        label: "Odustani",
        onClick: () => toast.dismiss() 
      }
    });
  };

  const bulkMarkRead = async () => {
    const ids = Array.from(selectedChats);
    for (const id of ids) {
      await markAsRead(id);
    }
    setBulkSelectMode(false);
    setSelectedChats(new Set());
  };

  const toggleSelectChat = (chatId) => {
    setSelectedChats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const currentList = getCurrentList();
    setSelectedChats(new Set(currentList.map(c => c.id)));
  };

  const deselectAll = () => {
    setSelectedChats(new Set());
  };

  // --- MARK SEEN INTERNAL ---
  async function markChatAsSeenInternal(targetChatId, updateUI = true) {
    const cId = Number(targetChatId);
    if (!cId || !user?.id) return;

    try {
      if (updateUI) {
        updateChatProperty(cId, chat => ({ ...chat, unread_chat_count: 0 }));
        if (selectedChatDetails?.id === cId) {
          setSelectedChatDetails(prev => prev ? { ...prev, unread_chat_count: 0 } : prev);
        }
      }
      await chatListApi.markSeen(cId);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  }

  const markChatAsSeen = useCallback(async (targetChatId) => {
    const cId = Number(targetChatId);
    if (markedSeenChats.current.has(cId)) return;
    markedSeenChats.current.add(cId);
    await markChatAsSeenInternal(cId, true);
  }, [user?.id, selectedChatDetails?.id]);

  // === DATA FETCHING ===
  const fetchAllChats = async (page = 1) => {
    if (page === 1) setIsLoading(true);
    
    try {
      const [sellerRes, buyerRes, archivedRes] = await Promise.all([
        chatListApi.chatList({ type: "seller", page }),
        chatListApi.chatList({ type: "buyer", page }),
        chatListApi.chatList({ type: "archived", page }).catch(() => ({ data: { data: [] } }))
      ]);

      const extractData = (res) => {
        const responseData = res?.data?.data || res?.data;
        return responseData?.data || responseData || [];
      };

      const sellerChats = extractData(sellerRes).map(chat => ({ ...chat, chatType: 'selling' }));
      const buyerChats = extractData(buyerRes).map(chat => ({ ...chat, chatType: 'buying' }));
      const archived = extractData(archivedRes).map(chat => ({ ...chat, is_archived: true }));

      const allChats = [...sellerChats, ...buyerChats]
        .filter((chat, index, self) => index === self.findIndex(c => c.id === chat.id))
        .filter(c => !c.deleted_by?.includes(user?.id) && !c.deleted_by?.includes(String(user?.id)))
        .sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
        });

      setChats({
        all: allChats,
        archived: archived,
        currentPage: page,
        hasMore: false
      });

    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllChats();
  }, [langCode]);

  useEffect(() => {
    if (chatId) {
      const allAvailable = [...chats.all, ...chats.archived];
      const found = allAvailable.find(chat => chat.id === chatId);
      setSelectedChatDetails(found);
      setMessageSearchQuery(""); // Reset pretrage poruka kada se promijeni chat
    } else {
      setSelectedChatDetails("");
    }
  }, [chatId, chats.all, chats.archived]);

  useEffect(() => {
    return () => {
      onlineTimeouts.current.forEach(timeout => clearTimeout(timeout));
      onlineTimeouts.current.clear();
    };
  }, []);

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("chatid");
    navigate(`?${params.toString()}`, { scroll: false });
  };

  const isSelling = selectedChatDetails?.chatType === 'selling' || 
                    selectedChatDetails?.seller_id === user?.id;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.7)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/90">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl dark:bg-cyan-500/10" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

      <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[70vh] lg:min-h-[760px]">
        {/* Sidebar List */}
        <div className="xl:col-span-4 xl:border-r xl:border-slate-200/80 dark:xl:border-slate-700">
          {(isLargeScreen || !chatId || IsLoading) && (
            <ChatList
              chatId={chatId}
              chats={getCurrentList()}
              IsLoading={IsLoading}
              currentUserId={user?.id}
              isLargeScreen={isLargeScreen}
              isConnected={isConnected}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              // Tabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              unreadCount={unreadCount}
              archivedCount={archivedCount}
              // Search (Sidebar)
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              // Bulk select
              bulkSelectMode={bulkSelectMode}
              setBulkSelectMode={setBulkSelectMode}
              selectedChats={selectedChats}
              toggleSelectChat={toggleSelectChat}
              selectAll={selectAll}
              deselectAll={deselectAll}
              bulkArchive={bulkArchive}
              bulkDelete={bulkDelete}
              bulkMarkRead={bulkMarkRead}
              // Actions
              archiveChat={archiveChat}
              unarchiveChat={unarchiveChat}
              deleteChat={deleteChat}
              onToggleMute={handleToggleMuteChat}
              markAsUnread={markAsUnread}
              markAsRead={markAsRead}
              pinChat={pinChat}
            />
          )}
        </div>

        {/* Main Chat Area */}
        {(isLargeScreen || chatId) && (
          <div className="xl:col-span-8">
            {selectedChatDetails?.id ? (
              <div className="relative flex h-full min-h-[70vh] flex-col bg-gradient-to-b from-slate-50/70 via-white to-slate-100/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 lg:min-h-[760px]">
                <SelectedChatHeader
                  selectedChat={selectedChatDetails}
                  isSelling={isSelling}
                  setSelectedChat={setSelectedChatDetails}
                  handleBack={handleBack}
                  isLargeScreen={isLargeScreen}
                  onSearch={handleMessageSearch}
                  onDelete={handleDeleteCurrentChat}
                  onArchive={handleArchiveCurrentChat}
                  onUnarchive={handleUnarchiveCurrentChat}
                  onMute={() => muteChat(chatId)}
                  onShowMedia={() => toast.info("Galerija stiže uskoro!")}
                />

                <ChatMessages
                  selectedChatDetails={selectedChatDetails}
                  setSelectedChatDetails={setSelectedChatDetails}
                  isSelling={isSelling}
                  setChats={setChats}
                  chatId={chatId}
                  isOtherUserTyping={typingUsers[chatId] !== undefined}
                  markChatAsSeen={markChatAsSeen}
                  incomingMessage={incomingMessage}
                  messageStatusUpdate={messageStatusUpdate}
                  searchQuery={messageSearchQuery}
                />
              </div>
            ) : (
              <div className="flex h-full min-h-[70vh] items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 lg:min-h-[760px]">
                <NoChatFound isLargeScreen={isLargeScreen} handleBack={handleBack} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Chat;
