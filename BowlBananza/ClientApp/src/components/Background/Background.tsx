import React from 'react';
import styles from '../Shared.module.css';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router';
import GlowOverlay from './GlowOverlay';

const Background = () => {
    const { loggedIn } = useAuth();
    const { pathname } = useLocation();

    let pName = pathname;
    if (pName === '/' || pName === '/index.html') {
        pName = '/home';
    }
    return (
        <>
            <div className={`${styles.background} ${styles[pName.toLowerCase().substring(1) || (loggedIn ? 'home' : '')]}`} />
            {loggedIn && <GlowOverlay />}
        </>
    );
};

export default Background;
