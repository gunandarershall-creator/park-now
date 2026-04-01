importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA7iaKO86Pbx02BJeA0SulWqpAfB1qs7NU",
  authDomain: "fyp-backend-parknow.firebaseapp.com",
  projectId: "fyp-backend-parknow",
  storageBucket: "fyp-backend-parknow.firebasestorage.app",
  messagingSenderId: "762323405309",
  appId: "1:762323405309:web:cca5363efc85606b807194"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Park Now', {
    body: body ?? '',
    icon: icon ?? '/logo192.png',
  });
});
