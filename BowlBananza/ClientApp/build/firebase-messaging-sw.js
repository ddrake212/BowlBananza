/* eslint-disable no-undef */
/* global importScripts, firebase, self, clients */

importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBpizOJChJI1xQ60EDblvPhljtkcoLZ_Os",
  authDomain: "bowl-bananza.firebaseapp.com",
  projectId: "bowl-bananza",
  storageBucket: "bowl-bananza.firebasestorage.app",
  messagingSenderId: "622633370400",
  appId: "1:622633370400:web:82991b2443bbda6c214d45",
  measurementId: "G-0D4RL09WCZ",
});

const messaging = firebase.messaging();

/**
 * ✅ BACKGROUND PUSH
 * Expect DATA-ONLY payloads:
 * payload.data.title
 * payload.data.body
 * payload.data.url   (relative, e.g. "/picks")
 * payload.data.icon
 * payload.data.badge
 */
messaging.onBackgroundMessage((payload) => {
  const data = payload?.data || {};

  const title = data.title || "BowlBananza";
  const body = data.body || "";

  // Android behavior:
  // - icon  = expanded notification image
  // - badge = collapsed / status-bar monochrome icon
  const icon = data.icon || "/favIcon.png";
  const badge = data.badge || "/pushBadge.png";

  // IMPORTANT: relative URL keeps it inside the installed PWA
  const url = data.url || "/";

  const options = {
    body,
    icon,
    badge,
    data: {
      url,
      ...data,
    },
  };
    // eslint-disable-next-line no-restricted-globals
  self.registration.showNotification(title, options);
});

/**
 * ✅ CLICK HANDLER
 * Focus existing app window if open,
 * otherwise open the installed PWA at the route.
 */
// eslint-disable-next-line no-restricted-globals
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
          // eslint-disable-next-line no-restricted-globals
      const targetUrl = new URL(url, self.location.origin).href;

      // Prefer focusing an existing BowlBananza window
          for (const client of allClients) {
              // eslint-disable-next-line no-restricted-globals
        if (client.url && client.url.startsWith(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) await client.navigate(targetUrl);
          return;
        }
      }

      // Otherwise open the app window
      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })()
  );
});
