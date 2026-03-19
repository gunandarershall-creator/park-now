/**
 * MODEL: chatModel.js
 * Firestore real-time messaging operations.
 * Chat room ID is deterministic: sorted([uid1, uid2]) + spotId
 */

import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/** Deterministic chat room ID — same result regardless of who opens it first */
export const getChatId = (uid1, uid2, spotId) =>
  [...[uid1, uid2].sort(), spotId].join('_');

/** Send a message to a chat room */
export const sendMessage = async (chatId, senderId, text) => {
  const ref = collection(db, 'chats', chatId, 'messages');
  await addDoc(ref, {
    senderId,
    text: text.trim(),
    timestamp: serverTimestamp(),
  });
};

/** Subscribe to messages in real-time, ordered oldest → newest */
export const subscribeToMessages = (chatId, onData, onError) => {
  const ref = collection(db, 'chats', chatId, 'messages');
  const q = query(ref, orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(msgs);
  }, onError);
};
