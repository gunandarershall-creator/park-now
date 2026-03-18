/**
 * VIEW: ChatView.jsx
 * In-app messaging screen between driver and host.
 */

import React from 'react';
import { ArrowLeft, Phone, Plus, Send } from 'lucide-react';

const ChatView = ({ chatContext, userMode, onBack }) => (
  <div className="screen" style={{padding: 0, display: 'flex', flexDirection: 'column', background: '#fff'}}>
    <div className="checkout-header" style={{padding: '20px', margin: 0, background: '#fff', zIndex: 10}}>
      <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
      <h2 className="checkout-title" style={{paddingRight: 0}}>{chatContext.name}</h2>
      <button className="close-btn" style={{background: 'transparent'}} onClick={() => alert('Calling feature coming soon.')}>
        <Phone size={20} color="#0056D2" />
      </button>
    </div>

    <div className="chat-area">
      <div style={{textAlign: 'center', color: '#8E8E93', fontSize: 12, margin: '10px 0'}}>Today 14:02</div>
      <div className={`chat-bubble ${userMode === 'driver' ? 'sent' : 'received'}`}>
        Hi there, just wanted to double check if my vehicle is okay parked on the left side?
      </div>
      <div className={`chat-bubble ${userMode === 'driver' ? 'received' : 'sent'}`}>
        Yes, that's perfect! Let me know if you need anything else.
      </div>
    </div>

    <div className="chat-input-bar">
      <Plus size={24} color="#8E8E93" style={{cursor: 'pointer'}} />
      <input className="chat-input" placeholder="Type a message..." />
      <button className="send-btn" onClick={() => alert('Message sent!')}><Send size={18} /></button>
    </div>
  </div>
);

export default ChatView;
