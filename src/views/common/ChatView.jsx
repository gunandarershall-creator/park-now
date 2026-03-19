/**
 * VIEW: ChatView.jsx
 * Real-time in-app messaging screen between driver and host.
 * Messages are stored and synced via Firestore.
 */

import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Send } from 'lucide-react';

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
        <button className="close-btn" style={{background: 'transparent'}} onClick={() => showToast('Calling feature coming soon.', 'info')}>
          <Phone size={20} color="#0056D2" />
        </button>
      </div>

      {/* Messages */}
      <div className="chat-area" style={{flex: 1, overflowY: 'auto', padding: '16px'}}>
        {messages.length === 0 ? (
          <div style={{textAlign: 'center', color: '#C7C7CC', fontSize: 14, marginTop: 40}}>
            No messages yet. Say hello!
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
              <div key={msg.id}>
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
