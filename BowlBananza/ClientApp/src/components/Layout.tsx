import React, { useEffect } from 'react';
import NavMenu from "./Navigation/NavMenu";
import { useAuth } from '../hooks/useAuth';
import styles from "./Shared.module.css";
import { CookiesProvider } from 'react-cookie';
import Background from './Background/Background';
import { ColorContext } from '../contexts/ColorContext';
import { useLocation } from 'react-router';
interface LayoutProps {
    children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
    const { loggedIn } = useAuth();

    const { setColor } = React.useContext(ColorContext) ?? { setColor: () => { } };

    const { pathname } = useLocation();

    useEffect(() => {
        setColor('#00000000');
    }, [setColor, pathname]);

    return (
        <CookiesProvider>            
            <Background />
            <div className={styles.contentHolder}>
                {loggedIn && <NavMenu />}
                <div className={styles.AppContainer}>
                    {children}
                </div>
            </div>
        </CookiesProvider>
    );
};

export default Layout;