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

import React, { useState } from 'react';
import './styles/app.css';

// --- CONTROLLERS ---
import { useAuth }     from './controllers/useAuth';
import { useProfile }  from './controllers/useProfile';
import { useSpots }    from './controllers/useSpots';
import { useBookings } from './controllers/useBookings';
import { useHost }     from './controllers/useHost';
import { useSessionTimer } from './controllers/useSessionTimer';

// --- VIEWS: Auth ---
import LoginView         from './views/auth/LoginView';
import RegisterView      from './views/auth/RegisterView';
import ForgotPasswordView from './views/auth/ForgotPasswordView';

// --- VIEWS: Driver ---
import DriverDashboardView  from './views/driver/DriverDashboardView';
import MapView              from './views/driver/MapView';
import CheckoutView         from './views/driver/CheckoutView';
import ActiveBookingView    from './views/driver/ActiveBookingView';
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
  const [chatContext, setChatContext] = useState({ name: '', returnScreen: '' });
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifPromo, setNotifPromo] = useState(false);
  const [rating, setRating] = useState(0);

  // --- CONTROLLERS ---
  const auth = useAuth();
  const profile = useProfile(auth.user);
  const spots = useSpots(auth.user, currentScreen);
  const bookings = useBookings(auth.user);
  const host = useHost(auth.user, spots.spots, spots.setSpots);
  const session = useSessionTimer(bookings.activeBooking?.endTime ?? null);

  // --- NAVIGATION HELPERS ---
  const navigate = (screen) => setCurrentScreen(screen);

  const openChat = (recipientName, returnScreen) => {
    setChatContext({ name: recipientName, returnScreen });
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
    if (success) navigate('activeBooking');
  };

  const handleEndSession = () => {
    bookings.handleEndSession();
    navigate('review');
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    alert(`Thank you! Your ${rating}-star review for ${spots.selectedSpot.address} has been saved.`);
    setRating(0);
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

  return (
    <div className="app-frame">

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
          mapContainerRef={spots.mapContainerRef}
          searchQuery={spots.searchQuery} setSearchQuery={spots.setSearchQuery}
          isSearchFocused={spots.isSearchFocused} setIsSearchFocused={spots.setIsSearchFocused}
          searchSuggestions={spots.searchSuggestions}
          liveToastMessage={spots.liveToastMessage}
          selectedSpot={spots.selectedSpot} setSelectedSpot={spots.setSelectedSpot}
          isSessionActive={bookings.isSessionActive}
          onSearch={spots.handleSearch}
          onLocate={spots.findClosestSpot}
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
          onMessageHost={() => openChat(`Host (${spots.selectedSpot.address})`, 'activeBooking')}
        />
      )}

      {currentScreen === 'review' && spots.selectedSpot && (
        <ReviewView
          selectedSpot={spots.selectedSpot}
          rating={rating} setRating={setRating}
          onSubmit={handleSubmitReview}
        />
      )}

      {currentScreen === 'pastBookingDetail' && bookings.viewingReceipt && (
        <PastBookingDetailView
          viewingReceipt={bookings.viewingReceipt}
          onBack={() => navigate('driverDashboard')}
        />
      )}

      {/* HOST SCREENS */}
      {currentScreen === 'hostDashboard' && (
        <HostDashboardView
          myHostEarnings={bookings.myHostEarnings}
          hostListings={host.hostListings}
          currentScreen={currentScreen}
          onNavigate={navigate}
          onToggleListing={host.toggleHostListing}
          onEditSpot={handleOpenEditSpot}
          onMessageDriver={() => openChat('Driver (Jane D.)', 'hostDashboard')}
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
        <AddCardView onBack={() => navigate('paymentMethods')} />
      )}

      {currentScreen === 'notifications' && (
        <NotificationsView
          notifBooking={notifBooking} setNotifBooking={setNotifBooking}
          notifPromo={notifPromo} setNotifPromo={setNotifPromo}
          onBack={() => navigate('profile')}
        />
      )}

      {/* COMMON SCREENS */}
      {currentScreen === 'chat' && (
        <ChatView
          chatContext={chatContext}
          userMode={profile.userMode}
          onBack={() => navigate(chatContext.returnScreen)}
        />
      )}

      {currentScreen === 'helpCenter' && (
        <HelpCenterView
          onBack={() => navigate('profile')}
          onContactSupport={() => openChat('Support Agent', 'helpCenter')}
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
