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
import { useChat }          from './controllers/useChat';
import { useNotifications } from './controllers/useNotifications';
import { usePayout }        from './controllers/usePayout';
import { getChatId }        from './models/chatModel';
import { subscribeToReportsForHost } from './models/reportModel';

// --- VIEWS: Shared ---
import Toast from './views/shared/Toast';

// --- VIEWS: Auth ---
import LoginView         from './views/auth/LoginView';
import RegisterView      from './views/auth/RegisterView';
import ForgotPasswordView from './views/auth/ForgotPasswordView';
import OnboardingView    from './views/auth/OnboardingView';

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
import PayoutView        from './views/host/PayoutView';

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
import ReportView         from './views/common/ReportView';

function App() {
  // --- NAVIGATION STATE ---
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('parkNowOnboarded'));
  const [currentScreen, setCurrentScreen] = useState('login');
  const [paymentReturnScreen, setPaymentReturnScreen] = useState('profile');
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [chatContext, setChatContext] = useState({ name: '', returnScreen: '', chatId: null });
  const [reportContext, setReportContext] = useState({ userType: 'driver', relatedId: null, relatedAddress: null, returnScreen: 'map', hostId: null });
  const [hostReports, setHostReports] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isPublishLoading, setIsPublishLoading] = useState(false);
  const [isExtendLoading, setIsExtendLoading] = useState(false);
  const [isSaveProfileLoading, setIsSaveProfileLoading] = useState(false);

  // --- TOAST (must come first — passed into all controllers) ---
  const { toast, showToast } = useToast();

  // --- CONTROLLERS ---
  const auth     = useAuth(showToast);
  const profile  = useProfile(auth.user, showToast);
  const spots    = useSpots(auth.user, currentScreen, showToast);
  const bookings = useBookings(auth.user, showToast);
  const host     = useHost(auth.user, spots.spots, spots.setSpots, showToast, spots.panTo);
  const session       = useSessionTimer(bookings.activeBooking?.endTime ?? null);
  const chat          = useChat(chatContext.chatId, auth.user?.uid, showToast);
  const notifications = useNotifications(auth.user);
  const payout        = usePayout(auth.user, bookings.myHostEarnings);

  // --- NAVIGATION HELPERS ---
  const navigate = (screen) => setCurrentScreen(screen);

  const openChat = (recipientName, returnScreen, chatId = null) => {
    setChatContext({ name: recipientName, returnScreen, chatId });
    navigate('chat');
  };

  const openReport = (userType, returnScreen, relatedId = null, relatedAddress = null, hostId = null) => {
    setReportContext({ userType, returnScreen, relatedId, relatedAddress, hostId });
    navigate('report');
  };

  const handleSubmitReport = async ({ category, description }) => {
    try {
      const { submitReport } = await import('./models/reportModel');
      await submitReport({
        userId: auth.user?.uid,
        userType: reportContext.userType,
        category,
        description,
        relatedId: reportContext.relatedId,
        relatedAddress: reportContext.relatedAddress,
        hostId: reportContext.hostId,
      });
      showToast('Report submitted. Our team will review it within 24 hours.', 'success');
    } catch (err) {
      console.error('Report error:', err);
      showToast('Could not submit report. Please try again.', 'error');
    }
    navigate(reportContext.returnScreen);
  };

  const handleLoginSuccess = async (e) => {
    setIsAuthLoading(true);
    const success = await auth.handleLogin(e);
    setIsAuthLoading(false);
    if (success) navigate('map');
  };

  const handleRegisterSuccess = async (e, regName, regPlate) => {
    setIsAuthLoading(true);
    const success = await auth.handleRegister(e, regName, regPlate);
    setIsAuthLoading(false);
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

  const handlePayment = async (bookingStartTime) => {
    setIsPaymentLoading(true);
    try {
      const success = await bookings.handlePayment(spots.selectedSpot, spots.setSpots, bookingStartTime);
      if (success) {
        navigate('confirmation');
        notifications.notifyBookingConfirmed(spots.selectedSpot?.address);
      }
    } catch (err) {
      console.error('Payment error:', err);
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      if (bookings.activeBooking?.id) {
        const { updateBooking } = await import('./models/bookingModel');
        await updateBooking(bookings.activeBooking.id, { status: 'cancelled' });
      }
    } catch (err) {
      console.warn('Could not update booking status:', err);
    }
    bookings.setActiveBooking(null);
    bookings.setIsSessionActive(false);
    spots.setSelectedSpot(null);
    showToast('Booking cancelled. Refund will be processed within 3–5 business days.', 'success');
    navigate('map');
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

  const handlePublishSpot = async (e) => {
    setIsPublishLoading(true);
    await host.handlePublishSpot(e, navigate, spots.setSearchQuery);
    setIsPublishLoading(false);
  };

  // Restore selectedSpot and navigate to active session after refresh
  useEffect(() => {
    if (!bookings.activeBooking) return;
    const booking = bookings.bookings.find(b => b.id === bookings.activeBooking.id);
    if (!booking) return;
    if (!spots.selectedSpot) {
      const spot = spots.spots.find(s => s.id === booking.spotId);
      if (spot) {
        spots.setSelectedSpot(spot);
      } else {
        spots.setSelectedSpot({
          id: booking.spotId,
          address: booking.address,
          price: booking.totalPaid / (booking.duration || 1),
          lat: 0, lng: 0,
          spotsLeft: 1,
        });
      }
    }
    // Auto-navigate to active session only once the booking's start time has arrived
    if (currentScreen === 'map' || currentScreen === 'driverDashboard') {
      const startTime = bookings.activeBooking?.startTime;
      const hasStarted = !startTime || new Date() >= new Date(startTime);
      if (hasStarted) navigate('activeBooking');
    }
  }, [bookings.activeBooking]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify driver when session is about to expire (fires once when warning trips)
  useEffect(() => {
    if (session.isWarning && bookings.activeBooking) {
      notifications.notifyExpiryWarning(spots.selectedSpot?.address, 15);
    }
  }, [session.isWarning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify host when a new booking comes in for their spot — only fires in host mode
  const myHostBookings = bookings.bookings.filter(b => b.hostId === auth.user?.uid && b.status === 'confirmed');
  const hostBookingCount = myHostBookings.length;
  useEffect(() => {
    if (!auth.user || hostBookingCount === 0 || profile.userMode !== 'host') return;
    const latest = [...myHostBookings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    notifications.notifyNewBooking(latest?.address);
  }, [hostBookingCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to reports filed against this host's listings
  useEffect(() => {
    if (!auth.user || profile.userMode !== 'host') return;
    const unsub = subscribeToReportsForHost(auth.user.uid, setHostReports, (err) => console.warn('Reports sync error:', err));
    return () => unsub();
  }, [auth.user, profile.userMode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Show onboarding slides on first ever launch
  if (showOnboarding) {
    return (
      <div className="app-frame">
        <OnboardingView onDone={() => { localStorage.setItem('parkNowOnboarded', '1'); setShowOnboarding(false); }} />
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
          onForgotPassword={() => navigate('forgotPassword')}
          onRegister={() => navigate('register')}
          isLoading={isAuthLoading}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterView
          email={auth.email} setEmail={auth.setEmail}
          password={auth.password} setPassword={auth.setPassword}
          regName={profile.regName} setRegName={profile.setRegName}
          regPlate={profile.regPlate} setRegPlate={profile.setRegPlate}
          onRegister={handleRegisterSuccess}
          onBack={() => navigate('login')}
          isLoading={isAuthLoading}
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
          isLoading={isPaymentLoading}
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
          onCancel={handleCancelBooking}
        />
      )}

      {currentScreen === 'activeBooking' && spots.selectedSpot && (
        <ActiveBookingView
          selectedSpot={spots.selectedSpot}
          hasInsurance={bookings.hasInsurance}
          extensionDuration={bookings.extensionDuration} setExtensionDuration={bookings.setExtensionDuration}
          onExtend={async () => { setIsExtendLoading(true); try { await bookings.handleExtendSession(spots.selectedSpot); } finally { setIsExtendLoading(false); } }}
          isExtendLoading={isExtendLoading}
          onEndSession={handleEndSession}
          onCancel={handleCancelBooking}
          timeDisplay={session.timeDisplay}
          isWarning={session.isWarning}
          isExpired={session.isExpired}
          bookingId={bookings.activeBooking?.id ?? null}
          endTime={bookings.activeBooking?.endTime ?? null}
          onReturnToMap={() => navigate('map')}
          onMessageHost={() => openChat(
            `Host (${spots.selectedSpot.address})`,
            'activeBooking',
            getChatId(auth.user?.uid, spots.selectedSpot?.hostId, spots.selectedSpot?.id)
          )}
          onReport={() => openReport('driver', 'activeBooking', spots.selectedSpot?.id, spots.selectedSpot?.address, spots.selectedSpot?.hostId)}
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
            bookings.viewingReceipt?.address,
            bookings.viewingReceipt?.hostId
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
          hostReports={hostReports}
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
          onReport={(booking) => openReport('host', 'hostDashboard', booking?.id, booking?.address)}
          onRequestPayout={() => navigate('payout')}
        />
      )}

      {currentScreen === 'addSpot' && (
        <AddSpotView
          newAddress={host.newAddress} setNewAddress={host.setNewAddress}
          setNewCoords={host.setNewCoords}
          newPrice={host.newPrice} setNewPrice={host.setNewPrice}
          newImage={host.newImage}
          fileInputRef={host.fileInputRef}
          onImageUpload={host.handleImageUpload}
          onSubmit={handlePublishSpot}
          isLoading={isPublishLoading}
          availFrom={host.availFrom} setAvailFrom={host.setAvailFrom}
          availTo={host.availTo} setAvailTo={host.setAvailTo}
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

      {currentScreen === 'payout' && (
        <PayoutView
          earnings={bookings.myHostEarnings}
          payouts={payout.payouts}
          onRequestPayout={() => payout.handleRequestPayout(showToast)}
          isRequesting={payout.isRequesting}
          onBack={() => navigate('hostDashboard')}
        />
      )}

      {/* PROFILE SCREENS */}
      {currentScreen === 'profile' && (
        <ProfileView
          regName={profile.regName}
          email={auth.email}
          regPlate={profile.regPlate}
          userMode={profile.userMode}
          photoUrl={profile.photoUrl}
          onUpdatePhoto={profile.handleUpdatePhoto}
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
          onSubmit={async (e) => { setIsSaveProfileLoading(true); try { await handleUpdateProfile(e); } finally { setIsSaveProfileLoading(false); } }}
          isLoading={isSaveProfileLoading}
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
          notifHistory={notifications.notifHistory}
          onClearHistory={notifications.clearHistory}
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
          userMode={profile.userMode}
        />
      )}

      {currentScreen === 'termsPrivacy' && (
        <TermsPrivacyView onBack={() => navigate('profile')} />
      )}

      {/* REPORT SCREEN */}
      {currentScreen === 'report' && (
        <ReportView
          reportContext={reportContext}
          userId={auth.user?.uid}
          onSubmit={handleSubmitReport}
          onBack={() => navigate(reportContext.returnScreen)}
        />
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
