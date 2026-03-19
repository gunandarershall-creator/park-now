/**
 * CONTROLLER: useChat.js
 * Manages real-time chat state for a single chat room.
 * Subscribes to Firestore messages and exposes send functionality.
 */

import { useState, useEffect } from 'react';
import { sendMessage, subscribeToMessages } from '../models/chatModel';

export const useChat = (chatId, userId) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeToMessages(
      chatId,
      (msgs) => setMessages(msgs),
      (err) => console.error('Chat sync error:', err)
    );
    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !chatId || !userId || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(chatId, userId, messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    messageText, setMessageText,
    handleSendMessage,
    isSending,
  };
};
