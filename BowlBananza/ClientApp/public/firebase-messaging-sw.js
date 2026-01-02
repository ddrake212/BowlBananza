/* eslint-disable no-undef */
/* global importScripts, firebase, self */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBpizOJChJI1xQ60EDblvPhljtkcoLZ_Os",
    authDomain: "bowl-bananza.firebaseapp.com",
    projectId: "bowl-bananza",
    storageBucket: "bowl-bananza.firebasestorage.app",
    messagingSenderId: "622633370400",
    appId: "1:622633370400:web:82991b2443bbda6c214d45",
    measurementId: "G-0D4RL09WCZ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "Notification";
    const options = {
        body: payload?.notification?.body || "",
        icon: payload?.notification?.icon || "/faveIcon.png",
        data: payload?.data
    };

    // eslint-disable-next-line no-restricted-globals
    self.registration.showNotification(title, options);
});
