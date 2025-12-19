import React from 'react';
import styles from '../Shared.module.css';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from 'react-router';
import GlowOverlay from './GlowOverlay';
import { ColorContext } from '../../contexts/ColorContext';

const Background = () => {
    const { loggedIn } = useAuth();
    const { pathname } = useLocation();

    const { color } = React.useContext(ColorContext) ?? { color: '#00000000' };

    let pName = pathname;
    if (pName === '/') {
        pName = '/home';
    }
    return (
        <>
            <div className={`${styles.background} ${styles[pName.toLowerCase().substring(1) || (loggedIn ? 'home' : '')]}`} />
            {loggedIn && <GlowOverlay color={color} />}
        </>
    );
};

export default Background;
