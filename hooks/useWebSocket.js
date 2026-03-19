import { useEffect, useRef, useCallback, useState } from 'react';
import Pusher from 'pusher-js';

const isWebSocketDebugEnabled = process.env.NODE_ENV !== 'production';
const wsDebugLog = (...args) => {
  if (isWebSocketDebugEnabled) {
  }
};

const useWebSocket = ({ userId, onMessage }) => {
  const pusher = useRef(null);
  const channels = useRef(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) {
      if (isWebSocketDebugEnabled) {
        console.warn('⚠️ No userId provided to useWebSocket');
      }
      return;
    }

    if (pusher.current) return;

    wsDebugLog('🚀 Initializing WebSocket connection...');

    try {
      pusher.current = new Pusher(process.env.NEXT_PUBLIC_REVERB_APP_KEY, {
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '443'),
        wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '443'),
        forceTLS: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'wss',
        encrypted: process.env.NEXT_PUBLIC_REVERB_SCHEME === 'wss',
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1',
      });

      pusher.current.connection.bind('connected', () => {
        wsDebugLog('✅ WebSocket connected');
        setIsConnected(true);
      });

      pusher.current.connection.bind('disconnected', () => {
        wsDebugLog('🔌 WebSocket disconnected');
        setIsConnected(false);
      });

      pusher.current.connection.bind('error', (err) => {
        console.error('❌ WebSocket error:', err);
      });

      // 🔥 Subscribe na globalni online-status kanal
      const onlineChannel = pusher.current.subscribe('online-status');
      
      onlineChannel.bind('UserOnlineStatus', (data) => {
        wsDebugLog('🟢 Online status event:', data);
        onMessageRef.current?.({ ...data, type: 'user_online_status' });
      });

    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
    }

    return () => {
      wsDebugLog('🧹 Cleaning up WebSocket');
      if (pusher.current) {
        pusher.current.disconnect();
        pusher.current = null;
      }
      channels.current.clear();
    };
  }, [userId]);

  const subscribeToChat = useCallback((chatId) => {
    if (!pusher.current) {
      console.warn('⚠️ Pusher not initialized');
      return;
    }

    if (channels.current.has(chatId)) {
      wsDebugLog(`📡 Already subscribed to chat.${chatId}`);
      return;
    }

    wsDebugLog(`📡 Subscribing to chat.${chatId}...`);

    try {
      const channel = pusher.current.subscribe(`chat.${chatId}`);

      channel.bind('pusher:subscription_succeeded', () => {
        wsDebugLog(`✅ Successfully subscribed to chat.${chatId}`);
      });

      channel.bind('pusher:subscription_error', (error) => {
        console.error(`❌ Subscription error for chat.${chatId}:`, error);
      });

      if (isWebSocketDebugEnabled) {
        // DEBUG-only global event tap.
        channel.bind_global((eventName, data) => {
          wsDebugLog(`🔔 [chat.${chatId}] Event: ${eventName}`, data);
        });
      }

      // TYPING
      const handleTyping = (data) => {
        wsDebugLog('✍️ Typing event:', data);
        onMessageRef.current?.({ 
          ...data, 
          type: 'typing',
          chat_id: data.chat_id || chatId,
        });
      };
      channel.bind('typing', handleTyping);
      channel.bind('.typing', handleTyping);

      // NEW MESSAGE
      const handleNewMessage = (data) => {
        wsDebugLog('💬 New message event:', data);
        onMessageRef.current?.({ 
          ...data, 
          type: 'new_message',
        });
      };
      channel.bind('NewMessage', handleNewMessage);
      channel.bind('.NewMessage', handleNewMessage);

      // MESSAGE STATUS
      const handleMessageStatus = (data) => {
        wsDebugLog('👁️ Message status event:', data);
        onMessageRef.current?.({ 
          ...data, 
          type: 'message_status',
        });
      };
      channel.bind('MessageStatusUpdated', handleMessageStatus);
      channel.bind('.MessageStatusUpdated', handleMessageStatus);

      channels.current.set(chatId, channel);
      
    } catch (error) {
      console.error(`❌ Error subscribing to chat ${chatId}:`, error);
    }
  }, []);

  const unsubscribeFromChat = useCallback((chatId) => {
    const channel = channels.current.get(chatId);
    if (channel && pusher.current) {
      wsDebugLog(`📴 Unsubscribing from chat.${chatId}`);
      channel.unbind_all();
      if (pusher.current.connection?.state === 'connected') {
        pusher.current.unsubscribe(`chat.${chatId}`);
      }
      channels.current.delete(chatId);
    }
  }, []);

  // 🔥 NOVO: Subscribe na više chatova odjednom (za typing u sidebar)
  const subscribeToMultipleChats = useCallback((chatIds) => {
    if (!pusher.current) return;
    
    chatIds.forEach(chatId => {
      if (!channels.current.has(chatId)) {
        subscribeToChat(chatId);
      }
    });
  }, [subscribeToChat]);

  return {
    isConnected,
    subscribeToChat,
    unsubscribeFromChat,
    subscribeToMultipleChats,
  };
};

export default useWebSocket;
