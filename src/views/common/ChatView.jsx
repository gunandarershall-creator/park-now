/**
 * VIEW: ChatView.jsx
 * Real-time in-app messaging screen between driver and host.
 * Messages are stored and synced via Firestore.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';

const ChatView = ({
  chatContext,
  userId,
  messages,
  messageText, setMessageText,
  onSend,
  isSending,
  onBack,
  showToast,
}) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="screen" style={{padding: 0, display: 'flex', flexDirection: 'column', background: '#fff'}}>
      {/* Header */}
      <div className="checkout-header" style={{padding: '20px', margin: 0, background: '#fff', zIndex: 10, borderBottom: '1px solid #F2F2F7'}}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title" style={{paddingRight: 0}}>{chatContext.name}</h2>
      </div>

      {/* Messages */}
      <div className="chat-area" style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
        {messages.length === 0 ? (
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
            const isMine = msg.senderId === userId;
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
                <div className={`chat-bubble ${isMine ? 'sent' : 'received'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="chat-input-bar">
        <input
          className="chat-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
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
