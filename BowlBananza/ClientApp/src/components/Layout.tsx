import React, { useEffect, useMemo } from 'react';
import NavMenu from "./Navigation/NavMenu";
import { useAuth } from '../hooks/useAuth';
import styles from "./Shared.module.css";
import { CookiesProvider } from 'react-cookie';
import Background from './Background/Background';
import { useLocation } from 'react-router';
import { useIsApp } from '../hooks/useIsApp';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
import { useUpdateColor } from '../hooks/useUpdateColor';
interface LayoutProps {
    children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const { loggedIn, permissionRequired } = useAuth();

    const isApp = useIsApp();

    const firebaseConfig = {
        apiKey: "AIzaSyBpizOJChJI1xQ60EDblvPhljtkcoLZ_Os",
        authDomain: "bowl-bananza.firebaseapp.com",
        projectId: "bowl-bananza",
        storageBucket: "bowl-bananza.firebasestorage.app",
        messagingSenderId: "622633370400",
        appId: "1:622633370400:web:82991b2443bbda6c214d45",
        measurementId: "G-0D4RL09WCZ"
    };

    const app = useMemo(() => initializeApp(firebaseConfig), [firebaseConfig]);

    const updateColor = useUpdateColor();

    const { pathname } = useLocation();

    useEffect(() => {
        if (isApp && loggedIn && permissionRequired) {
            Notification.requestPermission().then(permission => {
                if (permission !== "granted") {
                    return;
                }
                navigator.serviceWorker.ready.then(swReg => {
                    
                    const messaging = getMessaging(app);

                    getToken(messaging, {
                        vapidKey: 'BMx0Ab1UA-YyhaDpk5lhbaG9RNRSCX3F8RPP_hkKW3LqtqcXSL6iY7Q0T8r3Qj0_G1pPIyAU6bQq7GA-LjEqrWY',
                        serviceWorkerRegistration: swReg,
                    }).then(token => {
                        if (!token) {
                            return;
                        }
                        const ua = navigator.userAgent || "";
                        let platform = 'web';
                        const isIOS =
                            /iPad|iPhone|iPod/.test(ua) ||
                            // iPadOS reports as Mac sometimes
                            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

                        if (isIOS) {
                            platform = "ios";
                        } else if (/Android/.test(ua)) {
                            platform = "android";
                        }

                        const url = `/api/auth/logNotificationKey?key=${encodeURIComponent(token)}&platform=${platform}`;

                        fetch(url, {
                            method: "POST",
                            // Include cookies if your auth relies on them
                            credentials: "include",
                            headers: {
                                "Content-Type": "application/json",
                            },
                        });
                    });
                });
            });
        }
    }, [isApp, loggedIn, permissionRequired, app]);

    useEffect(() => {
        updateColor('#00000000');
    }, [updateColor, pathname]);

    let pName = pathname;
    if (pName === '/' || pName === '/index.html') {
        pName = '/home';
    }

    return (
        <CookiesProvider>            
            <Background />
            <div className={styles.contentHolder}>
                {loggedIn && <NavMenu />}
                <div className={`${styles.AppContainer} ${styles[pName.toLowerCase().substring(1) +'Container']}`}>
                    {children}
                </div>
            </div>
        </CookiesProvider>
    );
};

export default Layout;