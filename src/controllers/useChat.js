// ============================================================================
//  CONTROLLER: useChat.js - real-time chat between driver and host
// ============================================================================
//  When the chat screen opens against a specific chatId, this hook
//  subscribes to that chat's messages and keeps them flowing in live.
//  Also exposes the send-message action.
//
//  isSending guards against double-send: if the user taps Send twice
//  before the first write finishes, the second tap is ignored.
// ============================================================================

import { useState, useEffect } from 'react';
import { sendMessage, subscribeToMessages } from '../models/chatModel';

export const useChat = (chatId, userId, userMode, showToast) => {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Subscribe whenever chatId changes (e.g. user opens a different chat).
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
    // Guards: empty text, missing ids, or already-sending => bail.
    if (!messageText.trim() || !chatId || !userId || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(chatId, userId, userMode, messageText.trim());
      // Clear the input field so the user can type the next message.
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
      if (showToast) showToast('Could not send message. Check your connection and try again.', 'error');
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
