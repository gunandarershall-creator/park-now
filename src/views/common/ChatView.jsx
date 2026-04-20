// ============================================================================
//  VIEW: ChatView.jsx - the in-app messaging screen
// ============================================================================
//  When a driver messages a host (or the other way round) they both end
//  up on this screen. The Firestore chat subscription lives in useChat and
//  streams messages in real time, so whenever the other person sends one
//  it just appears in the list.
//
//  Key UX details:
//    - Auto-scroll to the bottom every time a new message arrives, so you
//      don't have to manually chase the latest reply.
//    - Messages you sent appear on the right in blue; the other person's
//      are on the left in grey. That's handled by the `isMine` flag.
//    - A timestamp label pops in between messages if there's a 5+ minute
//      gap, like iMessage does.
//    - Enter sends the message; Shift+Enter lets you add a new line.
// ============================================================================

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

const ChatView = ({
  chatContext,
  userId,
  userMode,
  messages,
  messageText, setMessageText,
  onSend,
  isSending,
  onBack,
  showToast,
}) => {
  // Anchor element at the bottom of the message list - we scroll it into
  // view to pin the scrollbar to the latest message.
  const messagesEndRef = useRef(null);

  // Runs every time `messages` changes (i.e. a new message arrived or was
  // sent). Scrolls the anchor into view so the user always sees the latest.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enter key sends. Shift+Enter drops a newline so long messages stay
  // easy to type.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Firestore gives us Timestamp objects. Older/local messages might be
  // plain date strings. Handle both so we never crash here.
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="screen" style={{padding: 0, display: 'flex', flexDirection: 'column', background: '#fff'}}>
      {/* Top bar - back arrow + the other person's name */}
      <div className="checkout-header" style={{padding: '20px', margin: 0, background: '#fff', zIndex: 10, borderBottom: '1px solid #F2F2F7'}}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title" style={{paddingRight: 0}}>{chatContext.name}</h2>
      </div>

      {/* The scrolling message area */}
      <div className="chat-area" style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
        {messages.length === 0 ? (
          // Empty state - helps a nervous first-time user know the chat
          // works and is just waiting for them to type.
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', padding: '40px 32px',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: '#E6F0FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <MessageCircle size={32} color="#0056D2" />
            </div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1C1C1E' }}>No messages yet</p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 1.5 }}>
              Send a message to get the conversation started.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            // Is this message "mine"? Prefer the senderRole field because
            // it's reliable even when the same account opens both sides
            // of the conversation in testing. Fall back to comparing UIDs
            // for older messages that don't have senderRole yet.
            const isMine = msg.senderRole
              ? msg.senderRole === userMode
              : msg.senderId === userId;
            // Show a timestamp label above this message if more than 5
            // minutes (300 seconds) have passed since the previous one.
            const showTime = i === 0 || (
              messages[i - 1]?.timestamp &&
              msg.timestamp &&
              (msg.timestamp?.seconds - messages[i - 1]?.timestamp?.seconds) > 300
            );

            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                {showTime && msg.timestamp && (
                  <div style={{textAlign: 'center', color: '#8E8E93', fontSize: 12, margin: '10px 0'}}>
                    {formatTime(msg.timestamp)}
                  </div>
                )}
                {/* sent = right/blue, received = left/grey */}
                <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        {/* The invisible anchor at the bottom - we scroll this into view */}
        <div ref={messagesEndRef} />
      </div>

      {/* The bottom compose bar - input + send button */}
      <div className="chat-input-bar">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Send button dims and disables itself if the input is empty */}
        <button
          className="send-btn"
          onClick={onSend}
          disabled={isSending || !messageText.trim()}
          style={{opacity: (!messageText.trim() || isSending) ? 0.4 : 1}}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatView;
