/**
 * VIEW: HelpCenterView.jsx
 * Role-aware FAQ screen — different Q&A for drivers vs hosts.
 */

import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Mail } from 'lucide-react';

const DRIVER_FAQS = [
  { q: 'How do I find and book a parking spot?', a: 'Open the Map tab, tap on any blue price marker to see spot details, then tap "Book Spot" to go to checkout. Choose your duration and confirm payment.' },
  { q: 'How do I pay for a booking?', a: 'Payment is taken at checkout using your saved card. Tap "Pay & Confirm" to complete the booking. You\'ll receive a confirmation receipt immediately.' },
  { q: 'Can I cancel my booking?', a: 'Yes — on the Booking Confirmation screen tap "Cancel Booking & Request Refund". During an active session, scroll down on the Active Session screen and tap "Cancel Booking & Request Refund". Refunds are processed within 3–5 business days.' },
  { q: 'How do I extend my parking session?', a: 'From the Active Session screen, select the extra time you need from the dropdown and tap "Pay & Extend". The extra charge is added immediately.' },
  { q: 'What if someone else is in my booked spot?', a: 'Tap "Message Host" on the Active Session screen to contact the host directly. If unresolved, use "Report an issue" to escalate to support.' },
  { q: 'How do I navigate to my spot?', a: 'Tap "Navigate There" on the Active Session screen to open your preferred maps app (Google Maps, Apple Maps, Waze) with directions.' },
  { q: 'What is Premium Protection?', a: 'An optional £1.50 add-on at checkout that provides cover for your vehicle during the parking session, up to £1M.' },
  { q: 'Where can I see my past bookings?', a: 'Go to the Activity tab. All your past and current bookings are listed there. Tap any booking to view the full receipt.' },
];

const HOST_FAQS = [
  { q: 'How do I list my driveway?', a: 'Switch to Host mode from your Profile, then tap the + button on the Host Dashboard. Add your address, a photo, your hourly rate, and set your availability hours.' },
  { q: 'When do I get paid?', a: 'Your earnings accumulate in your Host Dashboard. Go to the Payout screen and tap "Request Payout" to transfer your balance.' },
  { q: 'How do I see who has booked my spot?', a: 'The Host Dashboard shows "Active Guests" with a live green indicator, and "Past Bookings" below. You can message any driver directly from there.' },
  { q: 'Can I turn my listing on and off?', a: 'Yes — on the Host Dashboard under "Your Driveways", use the green toggle next to any listing to activate or deactivate it instantly.' },
  { q: 'Can I edit my listing?', a: 'Tap the pencil icon next to any listing on the Host Dashboard to update the address, price, photo, or availability hours.' },
  { q: 'What if a driver causes damage?', a: 'Use the "Report" button next to the booking in your Active Guests or Past Bookings section. Your report will be sent to our support team immediately.' },
  { q: 'How do I set availability hours?', a: 'When adding or editing a listing, toggle off "All day" under Availability Hours and set your From / To times. Drivers will see these hours on the spot listing.' },
  { q: 'What happens if I get a bad driver?', a: 'You can report any driver using the Flag button on their booking card. Our team reviews all reports within 24 hours.' },
];

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderBottom: '1px solid #F2F2F7', cursor: 'pointer' }}
      onClick={() => setOpen(o => !o)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
        <span style={{ fontWeight: 600, fontSize: 14, flex: 1, paddingRight: 12, color: '#1C1C1E' }}>{q}</span>
        {open ? <ChevronUp size={18} color="#8E8E93" /> : <ChevronDown size={18} color="#8E8E93" />}
      </div>
      {open && (
        <p style={{ margin: 0, padding: '0 16px 14px', fontSize: 14, color: '#3C3C43', lineHeight: 1.6 }}>{a}</p>
      )}
    </div>
  );
};

const HelpCenterView = ({ onBack, userMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const faqs = userMode === 'host' ? HOST_FAQS : DRIVER_FAQS;
  const filtered = faqs.filter(({ q, a }) =>
    q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="screen" style={{ overflowY: 'auto', paddingBottom: 100 }}>
      <div className="checkout-header" style={{ marginTop: 10 }}>
        <button className="close-btn" onClick={onBack}><ArrowLeft size={20} color="#000" /></button>
        <h2 className="checkout-title">{userMode === 'host' ? 'Host Help' : 'Driver Help'}</h2>
      </div>

      {/* Search */}
      <div style={{ background: '#E5E5EA', padding: '12px 15px', borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <HelpCircle size={18} color="#8E8E93" />
        <input
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 16, flex: 1 }}
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* FAQs */}
      <div className="settings-section-title">
        {searchQuery ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'Frequently Asked Questions'}
      </div>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        {filtered.length > 0 ? filtered.map((faq) => (
          <FAQItem key={faq.q} {...faq} />
        )) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8E8E93' }}>No results for "{searchQuery}"</div>
        )}
      </div>

      {/* Contact */}
      <a
        href="mailto:k2339894@kingston.ac.uk?subject=Park Now Support"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: '#E6F0FF', color: '#0056D2', fontWeight: 600, padding: '16px', borderRadius: '14px', textDecoration: 'none', fontSize: 16, marginBottom: 40 }}
      >
        <Mail size={20} /> Email Support
      </a>
    </div>
  );
};

export default HelpCenterView;
