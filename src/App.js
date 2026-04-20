// ============================================================================
//  App.js - the top-level React component for the whole Park Now app
// ============================================================================
//  What this file is:
//  ------------------
//  Think of this file as the "reception desk" of the whole application. It
//  doesn't do any of the heavy lifting itself, it just:
//
//    1. Gathers up every bit of business logic from the controllers
//       (things like "log in", "book a spot", "extend a session")
//    2. Keeps track of WHICH screen is currently showing
//    3. Renders the right screen component for that screen name
//
//  If someone asked "where does X happen in this app?", the answer is
//  almost never "in App.js". App.js just decides WHEN things happen and
//  WHICH screen to show next. The actual code for each feature lives
//  in either a controller (src/controllers/) or a view (src/views/).
//
//  Project structure (Model - View - Controller pattern):
//    - Models      : src/models/       talk to Firebase directly
//    - Controllers : src/controllers/  React hooks that hold business logic
//    - Views       : src/views/        dumb UI components that just render
//
//  This file is the glue that ties all three together.
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import './styles/app.css';

// --- CONTROLLERS ---
// Each of these is a custom React hook that owns one piece of the app's
// state and logic. Pulling them in here gives App.js access to every
// action the user can take.
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
import { useCards }         from './controllers/useCards';

// A couple of model imports used for chat id composition and the report
// subscription. Models directly talk to Firebase.
import { getChatId }        from './models/chatModel';
import { subscribeToReportsForHost } from './models/reportModel';


// --- VIEWS: Shared ---
// The in-app toast banner that replaces browser alert() popups.
import Toast from './views/shared/Toast';

// --- VIEWS: Auth ---
// Login, signup, forgot-password, and the first-launch onboarding carousel.
import LoginView         from './views/auth/LoginView';
import RegisterView      from './views/auth/RegisterView';
import ForgotPasswordView from './views/auth/ForgotPasswordView';
import OnboardingView    from './views/auth/OnboardingView';

// --- VIEWS: Driver ---
// Every screen a driver (person paying to park) sees.
import DriverDashboardView  from './views/driver/DriverDashboardView';
import MapView              from './views/driver/MapView';
import CheckoutView              from './views/driver/CheckoutView';
import BookingConfirmationView   from './views/driver/BookingConfirmationView';
import ActiveBookingView         from './views/driver/ActiveBookingView';
import ReviewView           from './views/driver/ReviewView';
import PastBookingDetailView from './views/driver/PastBookingDetailView';

// --- VIEWS: Host ---
// Every screen a host (person renting out a spot) sees.
import HostDashboardView from './views/host/HostDashboardView';
import AddSpotView       from './views/host/AddSpotView';
import EditSpotView      from './views/host/EditSpotView';
import PayoutView        from './views/host/PayoutView';

// --- VIEWS: Profile ---
// Settings, personal info, vehicle, saved cards, notifications.
import ProfileView        from './views/profile/ProfileView';
import PersonalInfoView   from './views/profile/PersonalInfoView';
import ManageVehiclesView from './views/profile/ManageVehiclesView';
import PaymentMethodsView from './views/profile/PaymentMethodsView';
import AddCardView        from './views/profile/AddCardView';
import NotificationsView  from './views/profile/NotificationsView';

// --- VIEWS: Common ---
// Screens that both drivers and hosts can reach (chat, help centre, report).
import ChatView           from './views/common/ChatView';
import HelpCenterView     from './views/common/HelpCenterView';
import TermsPrivacyView   from './views/common/TermsPrivacyView';
import FullScreenImageView from './views/common/FullScreenImageView';
import ReportView         from './views/common/ReportView';


function App() {
  // ─── NAVIGATION STATE ──────────────────────────────────────────────────
  // Everything about "which screen is the user looking at".

  // Has the user completed the onboarding carousel already? If not, I
  // show it on first launch. The flag is saved to localStorage so it
  // survives a page refresh.
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('parkNowOnboarded'));

  // The name of the currently visible screen, e.g. "login", "map",
  // "checkout", "activeBooking". Switching this value rerenders App.js
  // which shows the matching <View /> at the bottom of this file.
  const [currentScreen, setCurrentScreen] = useState('login');

  // A history stack so the back button knows where to go. useRef instead
  // of useState because updating the history shouldn't cause a rerender.
  const navHistoryRef = useRef([]);

  // The URL of an image the user tapped to view fullscreen. Null = no
  // fullscreen showing. Acts as an overlay on top of any screen.
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Context passed to the chat screen: who am I talking to and where
  // should I go back to when I close the chat.
  const [chatContext, setChatContext] = useState({ name: '', returnScreen: '', chatId: null });

  // Context passed to the report screen. Same idea as chat.
  const [reportContext, setReportContext] = useState({ userType: 'driver', relatedId: null, relatedAddress: null, returnScreen: 'map', hostId: null });

  // Reports filed against listings belonging to the currently signed-in
  // host. Shown on the host dashboard so the host can see complaints.
  const [hostReports, setHostReports] = useState([]);

  // Star rating and freeform review text while the driver is writing
  // a review at the end of a booking.
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Loading flags for various async actions. Used to disable buttons and
  // show spinners while Firebase is thinking.
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [isPublishLoading, setIsPublishLoading] = useState(false);
  const [isExtendLoading, setIsExtendLoading] = useState(false);
  const [isSaveProfileLoading, setIsSaveProfileLoading] = useState(false);


  // ─── TOAST ──────────────────────────────────────────────────────────────
  // This has to be set up FIRST because other controllers take showToast
  // as an argument so they can trigger banners themselves.
  const { toast, showToast } = useToast();


  // ─── CONTROLLERS ────────────────────────────────────────────────────────
  // Each of these returns an object packed with state + action functions.
  // I hand each one whatever bits of the app it needs to do its job.
  const auth     = useAuth(showToast);
  const profile  = useProfile(auth.user, showToast);
  const spots    = useSpots(auth.user, currentScreen, showToast);
  const bookings = useBookings(auth.user, showToast);
  const host     = useHost(auth.user, spots.spots, spots.setSpots, showToast, spots.panTo);

  // Session timer watches the activeBooking's endTime and counts down.
  const session       = useSessionTimer(bookings.activeBooking?.endTime ?? null);

  // Chat subscribes to messages for the currently open chatId.
  const chat          = useChat(chatContext.chatId, auth.user?.uid, profile.userMode, showToast);

  // Push notifications and notification history.
  const notifications = useNotifications(auth.user);

  // Host's earnings balance and payout history.
  const payout        = usePayout(auth.user, bookings.myHostEarnings);

  // Saved payment cards.
  const cards         = useCards(auth.user, showToast);


  // ─── NAVIGATION HELPERS ─────────────────────────────────────────────────
  // Thin wrappers around setCurrentScreen that also maintain the history
  // stack so the back button works.

  // Go to a new screen, remembering where we came from.
  const navigate = (screen) => {
    navHistoryRef.current = [...navHistoryRef.current, currentScreen];
    // Cap history at 30 entries so memory doesn't grow forever if the
    // user taps around for ages.
    if (navHistoryRef.current.length > 30) {
      navHistoryRef.current = navHistoryRef.current.slice(-30);
    }
    setCurrentScreen(screen);
  };

  // Go back to the previous screen. If there isn't one, fall back to
  // whatever the caller specified (default: the map).
  const goBack = (fallback = 'map') => {
    const hist = navHistoryRef.current;
    if (!hist.length) { setCurrentScreen(fallback); return; }
    const newHist = [...hist];
    const prev = newHist.pop();
    navHistoryRef.current = newHist;
    setCurrentScreen(prev);
  };

  // Open the chat screen against a specific person + chat id.
  const openChat = (recipientName, returnScreen, chatId = null) => {
    setChatContext({ name: recipientName, returnScreen, chatId });
    navigate('chat');
  };

  // Open the report screen pre-populated with who/what is being reported.
  const openReport = (userType, returnScreen, relatedId = null, relatedAddress = null, hostId = null) => {
    setReportContext({ userType, returnScreen, relatedId, relatedAddress, hostId });
    navigate('report');
  };


  // ─── ACTION HANDLERS ────────────────────────────────────────────────────
  // These are the functions triggered by user actions. Most of them call
  // a controller, check the result, and then either navigate or toast.

  // Submit a new report (bad listing, bad host, etc).
  const handleSubmitReport = async ({ category, description }) => {
    try {
      // Lazy-import the model only when needed so it doesn't bloat the
      // main bundle. User hits Submit, then the import happens.
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

  // Handle the user pressing "Log in". Delegate to the auth controller,
  // flip a loading flag while it runs, and on success go to the map.
  const handleLoginSuccess = async (e) => {
    setIsAuthLoading(true);
    const success = await auth.handleLogin(e);
    setIsAuthLoading(false);
    if (success) navigate('map');
  };

  // Same pattern for Register. Takes extra args because registration
  // asks for name and licence plate upfront.
  const handleRegisterSuccess = async (e, regName, regPlate) => {
    setIsAuthLoading(true);
    const success = await auth.handleRegister(e, regName, regPlate);
    setIsAuthLoading(false);
    if (success) navigate('map');
  };

  // Password-reset submit. On success go back to the login screen.
  const handleResetSuccess = async (e) => {
    const success = await auth.handleResetPassword(e);
    if (success) navigate('login');
  };

  // Log out and send the user back to the login screen.
  const handleLogout = async () => {
    await auth.handleLogout();
    navigate('login');
  };

  // Switch between driver mode and host mode. Takes the user to whatever
  // home screen is appropriate for the new mode.
  const handleSwitchMode = async (newMode) => {
    const mode = await profile.handleSwitchMode(newMode);
    navigate(mode === 'host' ? 'hostDashboard' : 'map');
  };

  // ── Payment handler ────────────────────────────────────────────────────
  // Kicks off the booking transaction. If it succeeds, decides whether to
  // go straight into active-session mode (booking starts now) or show a
  // confirmation screen with a countdown (booking starts later).
  const handlePayment = async (bookingStartTime) => {
    setIsPaymentLoading(true);
    try {
      const success = await bookings.handlePayment(spots.selectedSpot, spots.setSpots, bookingStartTime);
      if (success) {
        // Fire a push notification for the host and a confirmation
        // notification for the driver.
        notifications.notifyBookingConfirmed(spots.selectedSpot?.address);

        // Decide: is this booking starting right now, or in the future?
        // "Now-ish" means no startTime provided, OR startTime is within
        // a 2-minute grace window of now (allows slight clock drift).
        const isImmediate = !bookingStartTime ||
          Date.now() >= new Date(bookingStartTime).getTime() - 120000;
        if (isImmediate) {
          // Skip confirmation, go straight to the active session UI.
          navigate('activeBooking');
        } else {
          // Future booking. Show a confirmation screen with a countdown.
          navigate('confirmation');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      showToast('Payment failed. Please try again.', 'error');
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Cancel the active booking. Mark it cancelled in Firestore, clear
  // in-memory state, toast the refund message, go back to map.
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
    showToast('Booking cancelled. Refund will be processed within 3-5 business days.', 'success');
    navigate('map');
  };

  // End the session early (driver leaves before their time runs out).
  // Takes them to the review screen.
  const handleEndSession = () => {
    bookings.handleEndSession();
    navigate('review');
  };

  // Driver submits their star rating + review text. Save to Firestore,
  // clear state, back to map.
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

  // Profile edit handlers. Delegate to the profile controller and
  // navigate back to the main profile screen on success.
  const handleUpdateProfile = async (e) => {
    const success = await profile.handleUpdateProfile(e, auth.email);
    if (success) navigate('profile');
  };

  const handleUpdateVehicle = async (e) => {
    const success = await profile.handleUpdateVehicle(e);
    if (success) navigate('profile');
  };

  // Host-side: open the edit form for a listing they already own.
  const handleOpenEditSpot = (id) => {
    const ok = host.openEditSpot(id);
    if (ok) navigate('editSpot');
  };

  const handleUpdateSpot = (e) => {
    const ok = host.handleUpdateSpot(e);
    if (ok) navigate('hostDashboard');
  };

  // Publish a brand new listing. Uses a loading flag because image
  // upload + Firestore write can take a few seconds.
  const handlePublishSpot = async (e) => {
    setIsPublishLoading(true);
    await host.handlePublishSpot(e, navigate, spots.setSearchQuery);
    setIsPublishLoading(false);
  };


  // ─── EFFECTS ────────────────────────────────────────────────────────────
  // These useEffect blocks run at specific moments to keep state in sync
  // across different parts of the app.

  // When the user comes back to the app and their active booking is
  // restored from Firestore but selectedSpot isn't populated yet, this
  // finds the matching spot (or synthesises a minimal one) so the active-
  // booking screen has data to render.
  useEffect(() => {
    if (!bookings.activeBooking || spots.selectedSpot) return;
    const booking = bookings.bookings.find(b => b.id === bookings.activeBooking.id);
    if (!booking) return;
    const spot = spots.spots.find(s => s.id === booking.spotId) || {
      id: booking.spotId,
      address: booking.address,
      price: booking.totalPaid / (booking.duration || 1),
      lat: 0, lng: 0,
      spotsLeft: 1,
    };
    spots.setSelectedSpot(spot);
  }, [bookings.activeBooking?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-route to the active-booking screen when a saved session is
  // restored and the user currently has nowhere important to be.
  useEffect(() => {
    if (!bookings.isSessionActive || !bookings.activeBooking) return;
    if (!['map', 'driverDashboard'].includes(currentScreen)) return;
    const startTime = bookings.activeBooking?.startTime;
    const hasStarted = !startTime || new Date() >= new Date(startTime);
    if (hasStarted) navigate('activeBooking');
  }, [bookings.isSessionActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer that fires once when a future booking's start time arrives.
  // Flips the session to active and jumps to the active-booking screen.
  useEffect(() => {
    const startTime = bookings.activeBooking?.startTime;
    if (!startTime) return;
    const delay = new Date(startTime).getTime() - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => {
      bookings.setIsSessionActive(true);
      navigate('activeBooking');
    }, delay);
    // Cleanup: cancel the timer if the dependencies change or the
    // component unmounts, so we don't fire a stale callback.
    return () => clearTimeout(timer);
  }, [bookings.activeBooking?.startTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // When the session timer enters "last 5 minutes" warning state, push
  // a notification reminding the driver to extend or leave.
  useEffect(() => {
    if (session.isWarning && bookings.activeBooking) {
      notifications.notifyExpiryWarning(spots.selectedSpot?.address, 15);
    }
  }, [session.isWarning]); // eslint-disable-line react-hooks/exhaustive-deps

  // When in host mode, notify on each new incoming booking. Count-based
  // trigger: increment of the count means a new booking just landed.
  const myHostBookings = bookings.bookings.filter(b => b.hostId === auth.user?.uid && b.status === 'confirmed');
  const hostBookingCount = myHostBookings.length;
  useEffect(() => {
    if (!auth.user || hostBookingCount === 0 || profile.userMode !== 'host') return;
    const latest = [...myHostBookings].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    notifications.notifyNewBooking(latest?.address);
  }, [hostBookingCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to reports filed against THIS host's listings. Auto-
  // unsubscribes when the user logs out or switches to driver mode.
  useEffect(() => {
    if (!auth.user || profile.userMode !== 'host') return;
    const unsub = subscribeToReportsForHost(auth.user.uid, setHostReports, (err) => console.warn('Reports sync error:', err));
    return () => unsub();
  }, [auth.user, profile.userMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // When Firebase finishes checking for a stored auth session and finds
  // one, jump the user straight to their home screen instead of making
  // them sit on the login page.
  useEffect(() => {
    if (!auth.authLoading && auth.user && currentScreen === 'login') {
      navigate(profile.userMode === 'host' ? 'hostDashboard' : 'map');
    }
  }, [auth.authLoading, auth.user]); // eslint-disable-line react-hooks/exhaustive-deps


  // ─── EARLY RETURNS (SPLASH / ONBOARDING) ────────────────────────────────

  // While Firebase is checking whether the user is already signed in,
  // show a simple branded splash with a spinner. Prevents a flash of
  // the login screen for returning users.
  if (auth.authLoading) {
    return (
      <div className="app-frame" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#0056D2' }}>Park Now</div>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E5EA', borderTopColor: '#0056D2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // On the user's very first ever launch, show the onboarding carousel.
  // When they finish, set the flag so they never see it again.
  if (showOnboarding) {
    return (
      <div className="app-frame">
        <OnboardingView onDone={() => { localStorage.setItem('parkNowOnboarded', '1'); setShowOnboarding(false); }} />
      </div>
    );
  }


  // ─── MAIN RENDER ────────────────────────────────────────────────────────
  // Below is one giant conditional block. Each `{currentScreen === 'x' &&`
  // line says: "if the current screen is x, show view X". Only one
  // matches at a time, so only one screen renders. The long prop lists
  // are where App.js hands down state + action functions to each view.
  return (
    <div className="app-frame">

      {/* Toast banner overlay, visible on every screen if a toast is set */}
      <Toast toast={toast} />

      {/* ── AUTH SCREENS ─────────────────────────────────────────────── */}
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

      {/* ── DRIVER SCREENS ───────────────────────────────────────────── */}
      {currentScreen === 'driverDashboard' && (
        <DriverDashboardView
          isSessionActive={bookings.isSessionActive}
          myDriverBookings={bookings.myDriverBookings}
          currentScreen={currentScreen}
          onNavigate={navigate}
          onViewReceipt={(b) => { bookings.setViewingReceipt(b); navigate('pastBookingDetail'); }}
          // Upcoming = confirmed future bookings for this driver. Sorted soonest first.
          upcomingBookings={bookings.bookings.filter(b =>
            b.driverId === auth.user?.uid &&
            b.status === 'confirmed' &&
            b.startTime &&
            new Date(b.startTime).getTime() > Date.now()
          ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))}
          onViewUpcoming={(b) => {
            // Restore selectedSpot so the confirmation screen can render.
            if (!spots.selectedSpot || spots.selectedSpot.id !== b.spotId) {
              const spot = spots.spots.find(s => s.id === b.spotId) || {
                id: b.spotId, address: b.address,
                price: b.totalPaid / (b.duration || 1),
                lat: 0, lng: 0, spotsLeft: 1,
                hostId: b.hostId,
              };
              spots.setSelectedSpot(spot);
            }
            // Also restore activeBooking so the countdown can render.
            if (!bookings.activeBooking || bookings.activeBooking.id !== b.id) {
              bookings.setActiveBooking({
                id: b.id, startTime: b.startTime,
                endTime: b.endTime, totalPaid: b.totalPaid,
              });
            }
            navigate('confirmation');
          }}
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
          onViewActiveBooking={() => {
            // Restore selectedSpot on the way to the active booking, same
            // pattern as the upcoming-booking handler above.
            if (!spots.selectedSpot && bookings.activeBooking) {
              const booking = bookings.bookings.find(b => b.id === bookings.activeBooking.id);
              if (booking) {
                const spot = spots.spots.find(s => s.id === booking.spotId) || {
                  id: booking.spotId, address: booking.address,
                  price: booking.totalPaid / (booking.duration || 1),
                  lat: 0, lng: 0, spotsLeft: 1,
                };
                spots.setSelectedSpot(spot);
              }
            }
            navigate('activeBooking');
          }}
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
          onChangePaymentMethod={() => navigate('paymentMethods')}
        />
      )}

      {currentScreen === 'confirmation' && spots.selectedSpot && (
        <BookingConfirmationView
          selectedSpot={spots.selectedSpot}
          activeBooking={bookings.activeBooking}
          hasInsurance={bookings.hasInsurance}
          bookingDuration={bookings.bookingDuration}
          onStartSession={() => { bookings.setIsSessionActive(true); navigate('activeBooking'); }}
          onCancel={handleCancelBooking}
          onBack={() => navigate('driverDashboard')}
        />
      )}

      {currentScreen === 'activeBooking' && spots.selectedSpot && (
        <ActiveBookingView
          selectedSpot={spots.selectedSpot}
          hasInsurance={bookings.hasInsurance}
          extensionDuration={bookings.extensionDuration} setExtensionDuration={bookings.setExtensionDuration}
          // Extend handler wraps the controller call with its own loading flag
          // so the Extend button can show a spinner.
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
          // Message the host: open chat with a composed chatId.
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
          onBack={() => goBack('driverDashboard')}
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

      {/* ── HOST SCREENS ─────────────────────────────────────────────── */}
      {currentScreen === 'hostDashboard' && (
        <HostDashboardView
          myHostEarnings={bookings.myHostEarnings}
          availableBalance={payout.availableBalance}
          hostListings={host.hostListings}
          allBookings={bookings.bookings}
          hostReports={hostReports}
          // Active host bookings = confirmed, started, not yet ended.
          activeHostBookings={bookings.bookings.filter(b =>
            b.hostId === auth.user?.uid &&
            b.status === 'confirmed' &&
            b.startTime && new Date(b.startTime) <= new Date() &&
            new Date(b.endTime) > new Date()
          )}
          // Upcoming host bookings = confirmed, not yet started.
          upcomingHostBookings={bookings.bookings.filter(b =>
            b.hostId === auth.user?.uid &&
            b.status === 'confirmed' &&
            b.startTime && new Date(b.startTime) > new Date()
          ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))}
          pendingEarnings={bookings.myPendingEarnings}
          // Past host bookings = reviewed, completed, or ended (for history).
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
          availableBalance={payout.availableBalance}
          totalEarnings={bookings.myHostEarnings}
          // Host bookings that have actually finished, for the payout history.
          hostBookings={bookings.bookings.filter(b =>
            b.hostId === auth.user?.uid &&
            b.status !== 'cancelled' &&
            b.endTime &&
            new Date(b.endTime) <= new Date()
          )}
          payouts={payout.payouts}
          onRequestPayout={() => payout.handleRequestPayout(showToast)}
          isRequesting={payout.isRequesting}
          onBack={() => goBack('hostDashboard')}
        />
      )}

      {/* ── PROFILE SCREENS ──────────────────────────────────────────── */}
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
          onBack={() => goBack('profile')}
        />
      )}

      {currentScreen === 'manageVehicles' && (
        <ManageVehiclesView
          regPlate={profile.regPlate} setRegPlate={profile.setRegPlate}
          onSubmit={handleUpdateVehicle}
          onBack={() => goBack('profile')}
        />
      )}

      {currentScreen === 'paymentMethods' && (
        <PaymentMethodsView
          cards={cards.cards}
          onBack={() => goBack('profile')}
          onAddCard={() => navigate('addCard')}
          onDeleteCard={cards.removeCard}
          onSetDefault={cards.setDefaultCard}
        />
      )}

      {currentScreen === 'addCard' && (
        <AddCardView
          onBack={() => goBack('paymentMethods')}
          onSave={cards.addCard}
        />
      )}

      {currentScreen === 'notifications' && (
        <NotificationsView
          notifBooking={profile.notifBooking}
          setNotifBooking={(v) => profile.handleToggleNotif('booking', v)}
          notifPromo={profile.notifPromo}
          setNotifPromo={(v) => profile.handleToggleNotif('promo', v)}
          notifHistory={notifications.notifHistory}
          onClearHistory={notifications.clearHistory}
          onBack={() => goBack('profile')}
        />
      )}

      {/* ── COMMON SCREENS ───────────────────────────────────────────── */}
      {currentScreen === 'chat' && (
        <ChatView
          chatContext={chatContext}
          userId={auth.user?.uid}
          userMode={profile.userMode}
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
          onBack={() => goBack('profile')}
          userMode={profile.userMode}
        />
      )}

      {currentScreen === 'termsPrivacy' && (
        <TermsPrivacyView onBack={() => goBack('profile')} />
      )}

      {/* ── REPORT SCREEN ────────────────────────────────────────────── */}
      {currentScreen === 'report' && (
        <ReportView
          reportContext={reportContext}
          userId={auth.user?.uid}
          onSubmit={handleSubmitReport}
          onBack={() => navigate(reportContext.returnScreen)}
        />
      )}

      {/* ── FULLSCREEN IMAGE OVERLAY ─────────────────────────────────── */}
      {/* Rendered on top of any screen when the user taps a thumbnail. */}
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
