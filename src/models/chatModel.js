// ============================================================================
//  MODEL: chatModel.js - real-time messaging between host and driver
// ============================================================================
//  Chats live at /chats/{chatId}/messages/{messageId} in Firestore. The
//  cleverness here is the chatId itself. Instead of looking up an
//  existing chat from a lookup table, I BUILD the id deterministically
//  from the two user ids plus the spot id. So both sides of the
//  conversation can derive the same chatId on demand, without any
//  handshake.
//
//  getChatId(A, B, S) === getChatId(B, A, S), because I sort the uids
//  first. That way it doesn't matter who opened the chat first.
// ============================================================================

import { addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getChatMessagesRef } from './firebase';

// Build the chat room id. Sort the two uids alphabetically so the order
// of arguments doesn't matter, then tack the spotId on the end so
// different bookings of the same pair get different rooms.
export const getChatId = (uid1, uid2, spotId) =>
  [...[uid1, uid2].sort(), spotId].join('_');

// ─── Send a new message ─────────────────────────────────────────────────────
// serverTimestamp() is a Firestore token that gets replaced with the
// actual server time when the message is written, which keeps timestamps
// consistent across clients with different clocks.
export const sendMessage = async (chatId, senderId, senderRole, text) => {
  const ref = getChatMessagesRef(chatId);
  await addDoc(ref, {
    senderId,
    senderRole, // 'host' or 'driver' - used to colour bubbles by role
    text: text.trim(),
    timestamp: serverTimestamp(),
  });
};

// ─── Live subscription to a chat's messages ─────────────────────────────────
// orderBy('timestamp', 'asc') means oldest first, so the UI can just
// render them in order. Returns an unsubscribe function.
export const subscribeToMessages = (chatId, onData, onError) => {
  const q = query(getChatMessagesRef(chatId), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onData(msgs);
  }, onError);
};
