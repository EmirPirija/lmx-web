import { useEffect, useRef, useCallback, useState } from 'react';
import Pusher from 'pusher-js';

const useWebSocket = ({ userId, onMessage }) => {
  const pusher = useRef(null);
  const channels = useRef(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);

  // Keep onMessage ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) {
      console.warn('⚠️ No userId provided to useWebSocket');
      return;
    }

    // Prevent multiple initializations
    if (pusher.current) {
      console.log('✅ WebSocket already initialized');
      return;
    }

    console.log('🚀 Initializing WebSocket connection...');

    try {
      pusher.current = new Pusher(process.env.NEXT_PUBLIC_REVERB_APP_KEY, {
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost',
        wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
        wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080'),
        forceTLS: false,
        encrypted: false,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        cluster: 'mt1',
      });

      pusher.current.connection.bind('connected', () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
      });

      pusher.current.connection.bind('connecting', () => {
        console.log('🔄 WebSocket connecting...');
      });

      pusher.current.connection.bind('disconnected', () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
      });

      pusher.current.connection.bind('error', (err) => {
        console.error('❌ WebSocket error:', err);
      });

    } catch (error) {
      console.error('❌ Error initializing WebSocket:', error);
    }

    // Cleanup ONLY on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket (component unmount)');
      if (pusher.current) {
        pusher.current.disconnect();
        pusher.current = null;
      }
    };
  }, [userId]); // ← Only userId dependency!

  const subscribeToChat = useCallback((chatId) => {
    if (!pusher.current) {
      console.warn('⚠️ Cannot subscribe: Pusher not initialized');
      return;
    }

    if (channels.current.has(chatId)) {
      console.log(`✅ Already subscribed to chat ${chatId}`);
      return;
    }

    console.log(`📡 Subscribing to chat.${chatId}...`);

    try {
      const channel = pusher.current.subscribe(`chat.${chatId}`);
      
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Successfully subscribed to chat.${chatId}`);
      });

      channel.bind('pusher:subscription_error', (error) => {
        console.error(`❌ Subscription error for chat.${chatId}:`, error);
      });

      channel.bind('UserTyping', (data) => {
        console.log('👤 UserTyping event:', data);
        onMessageRef.current?.({ ...data, type: 'typing' });
      });

      channel.bind('NewMessage', (data) => {
        console.log('💬 NewMessage event:', data);
        onMessageRef.current?.({ ...data, type: 'new_message' });
      });

      channel.bind('MessageStatusUpdated', (data) => {
        console.log('✓ MessageStatusUpdated event:', data);
        onMessageRef.current?.({ ...data, type: 'message_status' });
      });

      channels.current.set(chatId, channel);
    } catch (error) {
      console.error(`❌ Error subscribing to chat ${chatId}:`, error);
    }
  }, []);

  const unsubscribeFromChat = useCallback((chatId) => {
    const channel = channels.current.get(chatId);
    if (channel && pusher.current) {
      console.log(`📴 Unsubscribing from chat.${chatId}`);
      pusher.current.unsubscribe(`chat.${chatId}`);
      channels.current.delete(chatId);
    }
  }, []);

  return {
    isConnected,
    subscribeToChat,
    unsubscribeFromChat,
  };
};

export default useWebSocket;