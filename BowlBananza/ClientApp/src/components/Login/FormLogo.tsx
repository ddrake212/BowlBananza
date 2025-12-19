import React, { useEffect } from 'react';
import styles from "./Styles/Form.module.css";
import { useLocation } from 'react-router';

interface Props {
    isRegister: boolean;
    isForgotPW: boolean;
}

const FormLogo = ({ isRegister, isForgotPW }: Props) => {
    const location = useLocation();
    const { logoAnimation } = location.state || {};
    useEffect(() => {
        const newState = { ...location.state, logoAnimation: false };

        // Replace the current history state without navigating
        window.history.replaceState(newState, '', location.pathname + location.search);
    }, [location]);

    let logoStyle = ''
    switch (true) {
        case logoAnimation === -2:
            logoStyle = styles.loginFormLogoPW;
            break;
        case logoAnimation === 0:
            logoStyle = styles.loginFormLogo;
            break;
        case logoAnimation === 1 || isRegister:
            logoStyle = styles.registerFormLogo;
            break;
        case logoAnimation === -1 || isForgotPW:
            logoStyle = styles.forgortPWFormLogo;
            break;
    }
    return (
        <div className={styles.loginLogoHolder}>
            <div className={`${styles.loginLogo} ${logoStyle}`} />
        </div>
    );
};

export default FormLogo;