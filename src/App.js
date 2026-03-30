/**
 * PROJECT: Park Now - Application
 * ARCHITECTURE: MVC (Model-View-Controller)
 *
 * App.js is the thin orchestrator that:
 *  1. Composes all controller hooks
 *  2. Wires up navigation + shared state
 *  3. Renders the correct View based on currentScreen
 *
 * Models  → src/models/        (Firebase data operations)
 * Controllers → src/controllers/ (Custom React hooks with business logic)
 * Views   → src/views/          (Pure presentational React components)
 */

import React, { useState, useEffect } from 'react';
import './styles/app.css';

// --- CONTROLLERS ---
import { useToast }        from './controllers/useToast';
import { useAuth }         from './controllers/useAuth';
import { useProfile }      from './controllers/useProfile';
import { useSpots }        from './controllers/useSpots';
import { useBookings }     from './controllers/useBookings';
import { useHost }         from './controllers/useHost';
import { useSessionTimer } from './controllers/useSessionTimer';
import { useChat }         from './controllers/useChat';
import { getChatId }       from './models/chatModel';

// --- VIEWS: Shared ---
import Toast from './views/shared/Toast';

// --- VIEWS: Auth ---
import LoginView         from './views/auth/LoginView';
import RegisterView      from './views/auth/RegisterView';
import ForgotPasswordView from './views/auth/ForgotPasswordView';

// --- VIEWS: Driver ---
import DriverDashboardView  from './views/driver/DriverDashboardView';
import MapView              from './views/driver/MapView';
import CheckoutView              from './views/driver/CheckoutView';
import BookingConfirmationView   from './views/driver/BookingConfirmationView';
import ActiveBookingView         from './views/driver/ActiveBookingView';
import ReviewView           from './views/driver/ReviewView';
import PastBookingDetailView from './views/driver/PastBookingDetailView';

// --- VIEWS: Host ---
import HostDashboardView from './views/host/HostDashboardView';
import AddSpotView       from './views/host/AddSpotView';
import EditSpotView      from './views/host/EditSpotView';

// --- VIEWS: Profile ---
import ProfileView        from './views/profile/ProfileView';
import PersonalInfoView   from './views/profile/PersonalInfoView';
import ManageVehiclesView from './views/profile/ManageVehiclesView';
import PaymentMethodsView from './views/profile/PaymentMethodsView';
import AddCardView        from './views/profile/AddCardView';
import NotificationsView  from './views/profile/NotificationsView';

// --- VIEWS: Common ---
import ChatView           from './views/common/ChatView';
import HelpCenterView     from './views/common/HelpCenterView';
import TermsPrivacyView   from './views/common/TermsPrivacyView';
import FullScreenImageView from './views/common/FullScreenImageView';

function App() {
  // --- NAVIGATION STATE ---
  const [currentScreen, setCurrentScreen] = useState('login');
  const [paymentReturnScreen, setPaymentReturnScreen] = useState('profile');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [chatContext, setChatContext] = useState({ name: '', returnScreen: '', chatId: null });
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // --- TOAST (must come first — passed into all controllers) ---
  const { toast, showToast } = useToast();

  // --- CONTROLLERS ---
  const auth     = useAuth(showToast);
  const profile  = useProfile(auth.user, showToast);
  const spots    = useSpots(auth.user, currentScreen, showToast);
  const bookings = useBookings(auth.user, showToast);
  const host     = useHost(auth.user, spots.spots, spots.setSpots, showToast, spots.panTo);
  const session  = useSessionTimer(bookings.activeBooking?.endTime ?? null);
  const chat     = useChat(chatContext.chatId, auth.user?.uid);

  // --- NAVIGATION HELPERS ---
  const navigate = (screen) => setCurrentScreen(screen);

  const openChat = (recipientName, returnScreen, chatId = null) => {
    setChatContext({ name: recipientName, returnScreen, chatId });
    navigate('chat');
  };

  const handleLoginSuccess = async (e) => {
    const success = await auth.handleLogin(e);
    if (success) navigate('map');
  };

  const handleRegisterSuccess = async (e, regName, regPlate) => {
    const success = await auth.handleRegister(e, regName, regPlate);
    if (success) navigate('map');
  };

  const handleGoogleSuccess = async () => {
    const success = await auth.handleGoogleSignIn();
    if (success) navigate('map');
  };

  const handleResetSuccess = async (e) => {
    const success = await auth.handleResetPassword(e);
    if (success) navigate('login');
  };

  const handleLogout = async () => {
    await auth.handleLogout();
    navigate('login');
  };

  const handleSwitchMode = async (newMode) => {
    const mode = await profile.handleSwitchMode(newMode);
    navigate(mode === 'host' ? 'hostDashboard' : 'map');
  };

  const handlePayment = async () => {
    const success = await bookings.handlePayment(spots.selectedSpot, spots.setSpots);
    if (success) navigate('confirmation');
  };

  const handleEndSession = () => {
    bookings.handleEndSession();
    navigate('review');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (bookings.activeBooking?.id) {
      try {
        const { updateBooking } = await import('./models/bookingModel');
        await updateBooking(bookings.activeBooking.id, {
          review: {
            rating,
            text: reviewText.trim(),
            timestamp: new Date().toISOString(),
          },
          status: 'reviewed',
        });
      } catch (err) {
        console.warn('Could not save review to Firestore:', err);
      }
    }
    showToast(`Thank you! Your ${rating}-star review has been saved.`, 'success');
    setRating(0);
    setReviewText('');
    bookings.setActiveBooking(null);
    bookings.setIsSessionActive(false);
    spots.setSelectedSpot(null);
    spots.setDriverLocation(null);
    navigate('map');
  };

  const handleUpdateProfile = async (e) => {
    const success = await profile.handleUpdateProfile(e, auth.email);
    if (success) navigate('profile');
  };

  const handleUpdateVehicle = async (e) => {
    const success = await profile.handleUpdateVehicle(e);
    if (success) navigate('profile');
  };

  const handleOpenEditSpot = (id) => {
    const ok = host.openEditSpot(id);
    if (ok) navigate('editSpot');
  };

  const handleUpdateSpot = (e) => {
    const ok = host.handleUpdateSpot(e);
    if (ok) navigate('hostDashboard');
  };

  const handlePublishSpot = (e) => {
    host.handlePublishSpot(e, navigate, spots.setSearchQuery);
  };

  // Auto-navigate when Firebase restores a saved session
  useEffect(() => {
    if (!auth.authLoading && auth.user && currentScreen === 'login') {
      navigate(profile.userMode === 'host' ? 'hostDashboard' : 'map');
    }
  }, [auth.authLoading, auth.user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show splash while Firebase checks for a saved session
  if (auth.authLoading) {
    return (
      <div className="app-frame" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0056D2' }}>Park Now</div>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E5EA', borderTopColor: '#0056D2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="app-frame">

      {/* GLOBAL IN-APP TOAST — replaces all browser alert() popups */}
      <Toast toast={toast} />

      {/* AUTH SCREENS */}
      {currentScreen === 'login' && (
        <LoginView
          email={auth.email} setEmail={auth.setEmail}
          password={auth.password} setPassword={auth.setPassword}
          onLogin={handleLoginSuccess}
          onGoogleSignIn={handleGoogleSuccess}
          onForgotPassword={() => navigate('forgotPassword')}
          onRegister={() => navigate('register')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterView
          email={auth.email} setEmail={auth.setEmail}
          password={auth.password} setPassword={auth.setPassword}
          regName={profile.regName} setRegName={profile.setRegName}
          regPlate={profile.regPlate} setRegPlate={profile.setRegPlate}
          onRegister={handleRegisterSuccess}
          onGoogleSignIn={handleGoogleSuccess}
          onBack={() => navigate('login')}
        />
      )}

      {currentScreen === 'forgotPassword' && (
        <ForgotPasswordView
          email={auth.email} setEmail={auth.setEmail}
          onSubmit={handleResetSuccess}
          onBack={() => navigate('login')}
        />
      )}

      {/* DRIVER SCREENS */}
      {currentScreen === 'driverDashboard' && (
        <DriverDashboardView
          isSessionActive={bookings.isSessionActive}
          myDriverBookings={bookings.myDriverBookings}
          currentScreen={currentScreen}
          onNavigate={navigate}
          onViewReceipt={(b) => { bookings.setViewingReceipt(b); navigate('pastBookingDetail'); }}
        />
      )}

      {currentScreen === 'map' && (
        <MapView
          onMapLoad={spots.onMapLoad}
          mapCenter={spots.mapCenter}
          mapZoom={spots.mapZoom}
          panTo={spots.panTo}
          spots={spots.spots}
          searchQuery={spots.searchQuery} setSearchQuery={spots.setSearchQuery}
          isSearchFocused={spots.isSearchFocused} setIsSearchFocused={spots.setIsSearchFocused}
          searchSuggestions={spots.searchSuggestions}
          selectSuggestion={spots.selectSuggestion}
          liveToastMessage={spots.liveToastMessage}
          selectedSpot={spots.selectedSpot} setSelectedSpot={spots.setSelectedSpot}
          driverLocation={spots.driverLocation}
          isSessionActive={bookings.isSessionActive}
          allBookings={bookings.bookings}
          onSearch={spots.handleSearch}
          onLocate={spots.findClosestSpot}
          isLocating={spots.isLocating}
          onBookSpot={() => navigate('checkout')}
          onViewActiveBooking={() => navigate('activeBooking')}
          onViewFullImage={(url) => setFullScreenImage(url)}
          currentScreen={currentScreen}
          onNavigate={navigate}
        />
      )}

      {currentScreen === 'checkout' && spots.selectedSpot && (
        <CheckoutView
          selectedSpot={spots.selectedSpot}
          bookingDuration={bookings.bookingDuration} setBookingDuration={bookings.setBookingDuration}
          hasInsurance={bookings.hasInsurance} setHasInsurance={bookings.setHasInsurance}
          onBack={() => navigate('map')}
          onPayment={handlePayment}
          onChangePaymentMethod={() => { setPaymentReturnScreen('checkout'); navigate('paymentMethods'); }}
        />
      )}

      {currentScreen === 'confirmation' && spots.selectedSpot && (
        <BookingConfirmationView
          selectedSpot={spots.selectedSpot}
          activeBooking={bookings.activeBooking}
          hasInsurance={bookings.hasInsurance}
          bookingDuration={bookings.bookingDuration}
          onStartSession={() => navigate('activeBooking')}
        />
      )}

      {currentScreen === 'activeBooking' && spots.selectedSpot && (
        <ActiveBookingView
          selectedSpot={spots.selectedSpot}
          hasInsurance={bookings.hasInsurance}
          extensionDuration={bookings.extensionDuration} setExtensionDuration={bookings.setExtensionDuration}
          onExtend={() => bookings.handleExtendSession(spots.selectedSpot)}
          onEndSession={handleEndSession}
          timeDisplay={session.timeDisplay}
          isWarning={session.isWarning}
          isExpired={session.isExpired}
          bookingId={bookings.activeBooking?.id ?? null}
          onReturnToMap={() => navigate('map')}
          onMessageHost={() => openChat(
            `Host (${spots.selectedSpot.address})`,
            'activeBooking',
            getChatId(auth.user?.uid, spots.selectedSpot?.hostId, spots.selectedSpot?.id)
          )}
        />
      )}

      {currentScreen === 'review' && spots.selectedSpot && (
        <ReviewView
          selectedSpot={spots.selectedSpot}
          rating={rating} setRating={setRating}
          reviewText={reviewText} setReviewText={setReviewText}
          onSubmit={handleSubmitReview}
        />
      )}

      {currentScreen === 'pastBookingDetail' && bookings.viewingReceipt && (
        <PastBookingDetailView
          viewingReceipt={bookings.viewingReceipt}
          onBack={() => navigate('driverDashboard')}
          onReport={() => openReport(
            'driver',
            'pastBookingDetail',
            bookings.viewingReceipt?.id,
            bookings.viewingReceipt?.address
          )}
          showToast={showToast}
        />
      )}

      {/* HOST SCREENS */}
      {currentScreen === 'hostDashboard' && (
        <HostDashboardView
          myHostEarnings={bookings.myHostEarnings}
          hostListings={host.hostListings}
          allBookings={bookings.bookings}
          activeHostBookings={bookings.bookings.filter(b =>
            b.hostId === auth.user?.uid &&
            b.status === 'confirmed' &&
            new Date(b.endTime) > new Date()
          )}
          pastHostBookings={bookings.bookings.filter(b =>
            b.hostId === auth.user?.uid &&
            (b.status === 'reviewed' || b.status === 'completed' ||
              (b.status === 'confirmed' && new Date(b.endTime) <= new Date()))
          ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))}
          currentScreen={currentScreen}
          onNavigate={navigate}
          onToggleListing={host.toggleHostListing}
          onEditSpot={handleOpenEditSpot}
          onMessageDriver={(booking) => openChat(
            `Driver • ${booking.address}`,
            'hostDashboard',
            getChatId(booking.driverId, booking.hostId, booking.spotId)
          )}
        />
      )}

      {currentScreen === 'addSpot' && (
        <AddSpotView
          newAddress={host.newAddress} setNewAddress={host.setNewAddress}
          newPrice={host.newPrice} setNewPrice={host.setNewPrice}
          newImage={host.newImage}
          fileInputRef={host.fileInputRef}
          onImageUpload={host.handleImageUpload}
          onSubmit={handlePublishSpot}
          onBack={() => { host.resetSpotForm(); navigate('hostDashboard'); }}
        />
      )}

      {currentScreen === 'editSpot' && (
        <EditSpotView
          newAddress={host.newAddress} setNewAddress={host.setNewAddress}
          newPrice={host.newPrice} setNewPrice={host.setNewPrice}
          newImage={host.newImage}
          fileInputRef={host.fileInputRef}
          onImageUpload={host.handleImageUpload}
          onSubmit={handleUpdateSpot}
          onBack={() => { host.resetSpotForm(); navigate('hostDashboard'); }}
        />
      )}

      {/* PROFILE SCREENS */}
      {currentScreen === 'profile' && (
        <ProfileView
          regName={profile.regName}
          email={auth.email}
          regPlate={profile.regPlate}
          userMode={profile.userMode}
          currentScreen={currentScreen}
          onNavigate={navigate}
          onSwitchMode={handleSwitchMode}
          onReport={() => openReport(profile.userMode, 'profile')}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'personalInfo' && (
        <PersonalInfoView
          regName={profile.regName} setRegName={profile.setRegName}
          email={auth.email} setEmail={auth.setEmail}
          onSubmit={handleUpdateProfile}
          onBack={() => navigate('profile')}
        />
      )}

      {currentScreen === 'manageVehicles' && (
        <ManageVehiclesView
          regPlate={profile.regPlate} setRegPlate={profile.setRegPlate}
          onSubmit={handleUpdateVehicle}
          onBack={() => navigate('profile')}
        />
      )}

      {currentScreen === 'paymentMethods' && (
        <PaymentMethodsView
          onBack={() => navigate(paymentReturnScreen)}
          onAddCard={() => navigate('addCard')}
        />
      )}

      {currentScreen === 'addCard' && (
        <AddCardView onBack={() => navigate('paymentMethods')} showToast={showToast} />
      )}

      {currentScreen === 'notifications' && (
        <NotificationsView
          notifBooking={profile.notifBooking}
          setNotifBooking={(v) => profile.handleToggleNotif('booking', v)}
          notifPromo={profile.notifPromo}
          setNotifPromo={(v) => profile.handleToggleNotif('promo', v)}
          onBack={() => navigate('profile')}
        />
      )}

      {/* COMMON SCREENS */}
      {currentScreen === 'chat' && (
        <ChatView
          chatContext={chatContext}
          userId={auth.user?.uid}
          messages={chat.messages}
          messageText={chat.messageText} setMessageText={chat.setMessageText}
          onSend={chat.handleSendMessage}
          isSending={chat.isSending}
          onBack={() => navigate(chatContext.returnScreen)}
          showToast={showToast}
        />
      )}

      {currentScreen === 'helpCenter' && (
        <HelpCenterView
          onBack={() => navigate('profile')}
          onContactSupport={() => openChat('Support Agent', 'helpCenter')}
          showToast={showToast}
        />
      )}

      {currentScreen === 'termsPrivacy' && (
        <TermsPrivacyView onBack={() => navigate('profile')} />
      )}

      {/* FULLSCREEN IMAGE OVERLAY */}
      {fullScreenImage && (
        <FullScreenImageView
          imageUrl={fullScreenImage}
          onClose={() => setFullScreenImage(null)}
        />
      )}
    </div>
  );
}

export default App;
