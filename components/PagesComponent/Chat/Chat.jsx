"use client";
import SelectedChatHeader from "./SelectedChatHeader";
import ChatList from "./ChatList";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import NoChatFound from "./NoChatFound";
import ChatMessages from "./ChatMessages";
import { useSelector } from "react-redux";
import { getCurrentLangCode } from "@/redux/reducer/languageSlice";
import { useMediaQuery } from "usehooks-ts";
import { chatListApi } from "@/utils/api";
import { useNavigate } from "@/components/Common/useNavigate";
import { userSignUpData } from "@/redux/reducer/authSlice";
import useWebSocket from "@/hooks/useWebSocket"; 

const Chat = () => {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("activeTab") || "selling";
  const chatId = Number(searchParams.get("chatid")) || "";
  const [selectedChatDetails, setSelectedChatDetails] = useState();
  const langCode = useSelector(getCurrentLangCode);
  const { navigate } = useNavigate();
  const user = useSelector(userSignUpData);

  const [IsLoading, setIsLoading] = useState(true);

  const [buyer, setBuyer] = useState({
    BuyerChatList: [],
    CurrentBuyerPage: 1,
    HasMoreBuyer: false,
  });

  const [seller, setSeller] = useState({
    SellerChatList: [],
    CurrentSellerPage: 1,
    HasMoreSeller: false,
  });

  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const isLargeScreen = useMediaQuery("(min-width: 1200px)");

  const { isConnected, subscribeToChat, unsubscribeFromChat } = useWebSocket({
    userId: user?.id,
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    if (chatId && user?.id) {
      console.log('📡 Subscribing to chat:', chatId);
      subscribeToChat(chatId);
    }
    return () => {
      if (chatId) {
        console.log('📴 Unsubscribing from chat:', chatId);
        unsubscribeFromChat(chatId);
      }
    };
  }, [chatId, user?.id]);

  function handleWebSocketMessage(data) {
    console.log('📨 WebSocket received:', data);
    
    switch (data.type) {
      case 'typing':
        handleTypingIndicator(data);
        break;
      case 'user_status':
        handleUserStatus(data);
        break;
      case 'message_status':
        handleMessageStatus(data);
        break;
      case 'new_message':
        handleNewMessage(data);
        break;
      default:
        console.warn('⚠️ Unknown WebSocket message type:', data.type);
    }
  }

  function handleTypingIndicator(data) {
    const { chat_id, user_id, is_typing } = data;
    
    if (is_typing) {
      setTypingUsers(prev => ({ ...prev, [chat_id]: user_id }));
      setTimeout(() => {
        setTypingUsers(prev => {
          const updated = { ...prev };
          if (updated[chat_id] === user_id) {
            delete updated[chat_id];
          }
          return updated;
        });
      }, 3000);
    } else {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[chat_id];
        return updated;
      });
    }

    updateChatListTypingStatus(chat_id, user_id, is_typing);
  }

  function handleUserStatus(data) {
    const { user_id, status } = data;
    
    setOnlineUsers(prev => {
      const updated = new Set(prev);
      if (status === 'online') {
        updated.add(user_id);
      } else {
        updated.delete(user_id);
      }
      return updated;
    });

    updateChatListOnlineStatus(user_id, status === 'online');
  }

  function handleMessageStatus(data) {
    const { message_id, status, chat_id } = data;
    console.log(`📧 Message ${message_id} status: ${status}`);
  }

  function handleNewMessage(data) {
    const { message } = data;
    console.log('💬 New message received:', message);
    updateChatListLastMessage(message.chat_id, message);
  }

  function updateChatListTypingStatus(chatId, userId, isTyping) {
    const updateList = (list) => list.map(chat => {
      if (chat.id === chatId) {
        const user = activeTab === 'selling' ? chat.buyer : chat.seller;
        if (user.id === userId) {
          return {
            ...chat,
            [activeTab === 'selling' ? 'buyer' : 'seller']: {
              ...user,
              is_typing: isTyping
            }
          };
        }
      }
      return chat;
    });

    if (activeTab === 'selling') {
      setSeller(prev => ({
        ...prev,
        SellerChatList: updateList(prev.SellerChatList)
      }));
    } else {
      setBuyer(prev => ({
        ...prev,
        BuyerChatList: updateList(prev.BuyerChatList)
      }));
    }
  }

  function updateChatListOnlineStatus(userId, isOnline) {
    const updateList = (list) => list.map(chat => {
      const user = activeTab === 'selling' ? chat.buyer : chat.seller;
      if (user.id === userId) {
        return {
          ...chat,
          [activeTab === 'selling' ? 'buyer' : 'seller']: {
            ...user,
            is_online: isOnline
          }
        };
      }
      return chat;
    });

    setSeller(prev => ({
      ...prev,
      SellerChatList: updateList(prev.SellerChatList)
    }));
    
    setBuyer(prev => ({
      ...prev,
      BuyerChatList: updateList(prev.BuyerChatList)
    }));
  }

  function updateChatListLastMessage(chatId, message) {
    const updateList = (list) => list.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          last_message: message.message,
          last_message_type: message.message_type,
          last_message_time: message.created_at,
          last_message_sender_id: message.sender_id,
          unread_chat_count: message.sender_id !== user?.id 
            ? (chat.unread_chat_count || 0) + 1 
            : chat.unread_chat_count
        };
      }
      return chat;
    });

    if (activeTab === 'selling') {
      setSeller(prev => ({
        ...prev,
        SellerChatList: updateList(prev.SellerChatList)
      }));
    } else {
      setBuyer(prev => ({
        ...prev,
        BuyerChatList: updateList(prev.BuyerChatList)
      }));
    }
  }

  /**
   * 🆕 Mark messages as seen when chat is opened
   */
  async function markChatAsSeen(chatId) {
    if (!chatId || !user?.id) return;
  
    try {
      const response = await chatListApi.markSeen(chatId);
      console.log('✅ Messages marked as seen:', response.data);
  
      // Update unread count
      const updateList = (list) => list.map(chat => 
        chat.id === chatId ? { ...chat, unread_chat_count: 0 } : chat
      );
  
      if (activeTab === 'selling') {
        setSeller(prev => ({ ...prev, SellerChatList: updateList(prev.SellerChatList) }));
      } else {
        setBuyer(prev => ({ ...prev, BuyerChatList: updateList(prev.BuyerChatList) }));
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  const fetchSellerChatList = async (page = 1) => {
    if (page === 1) {
      setIsLoading(true);
    }
    try {
      const res = await chatListApi.chatList({ type: "seller", page });
      
      const responseData = res?.data?.data || res?.data;
      const data = responseData?.data || responseData;
      const currentPage = responseData?.current_page || 1;
      const lastPage = responseData?.last_page || 1;

      if (data && Array.isArray(data)) {
        setSeller((prev) => ({
          ...prev,
          SellerChatList: page === 1 ? data : [...prev.SellerChatList, ...data],
          CurrentSellerPage: currentPage,
          HasMoreSeller: currentPage < lastPage,
        }));
      }
    } catch (error) {
      console.error("Error fetching seller chat list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBuyerChatList = async (page = 1) => {
    if (page === 1) {
      setIsLoading(true);
    }
    try {
      const res = await chatListApi.chatList({ type: "buyer", page });
      
      const responseData = res?.data?.data || res?.data;
      const data = responseData?.data || responseData;
      const currentPage = responseData?.current_page || 1;
      const lastPage = responseData?.last_page || 1;

      if (data && Array.isArray(data)) {
        setBuyer((prev) => ({
          ...prev,
          BuyerChatList: page === 1 ? data : [...prev.BuyerChatList, ...data],
          CurrentBuyerPage: currentPage,
          HasMoreBuyer: currentPage < lastPage,
        }));
      }
    } catch (error) {
      console.error("Error fetching buyer chat list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    activeTab === "selling" ? fetchSellerChatList() : fetchBuyerChatList();
  }, [activeTab, langCode]);

  useEffect(() => {
    if (chatId && activeTab === "selling" && seller.SellerChatList.length > 0) {
      setSelectedChatDetails(
        seller.SellerChatList.find((chat) => chat.id === chatId)
      );
    } else if (
      chatId &&
      activeTab === "buying" &&
      buyer.BuyerChatList.length > 0
    ) {
      setSelectedChatDetails(
        buyer.BuyerChatList.find((chat) => chat.id === chatId)
      );
    } else if (!chatId) {
      setSelectedChatDetails("");
    }
  }, [chatId, activeTab, seller.SellerChatList, buyer.BuyerChatList, langCode]);

  /**
   * 🆕 Mark messages as seen when chat is opened
   */
  useEffect(() => {
    if (chatId && user?.id) {
      markChatAsSeen(chatId);
    }
  }, [chatId, user?.id]);

  const handleBack = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("chatid");
    navigate(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12">
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-full px-3 py-1 text-xs">
          {isConnected ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Disconnected
            </span>
          )}
        </div>
      )}

      <div className="col-span-4">
        {(isLargeScreen || !chatId || IsLoading) && (
          <ChatList
            chatId={chatId}
            activeTab={activeTab}
            buyer={buyer}
            setBuyer={setBuyer}
            langCode={langCode}
            isLargeScreen={isLargeScreen}
            seller={seller}
            setSeller={setSeller}
            IsLoading={IsLoading}
            fetchSellerChatList={fetchSellerChatList}
            fetchBuyerChatList={fetchBuyerChatList}
            setSelectedChatDetails={setSelectedChatDetails}
          />
        )}
      </div>
      {(isLargeScreen || chatId) && (
        <div className="col-span-8">
          {selectedChatDetails?.id ? (
            <div className="ltr:xl:border-l rtl:lg:border-r h-[65vh] lg:h-[800px] flex flex-col">
              <SelectedChatHeader
                selectedChat={selectedChatDetails}
                isSelling={activeTab === "selling"}
                setSelectedChat={setSelectedChatDetails}
                handleBack={handleBack}
                isLargeScreen={isLargeScreen}
              />
              <ChatMessages
                selectedChatDetails={selectedChatDetails}
                setSelectedChatDetails={setSelectedChatDetails}
                isSelling={activeTab === "selling"}
                setBuyer={setBuyer}
                chatId={chatId}
                isOtherUserTyping={typingUsers[chatId] !== undefined}
              />
            </div>
          ) : (
            <div className="ltr:xl:border-l rtl:xl:border-r h-[60vh] lg:h-[800px] flex items-center justify-center">
              <NoChatFound
                isLargeScreen={isLargeScreen}
                handleBack={handleBack}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;