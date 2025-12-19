import React from 'react';
import styles from "./Styles/Form.module.css";
import FormLogo from './FormLogo';
interface LoginWrapperProps {
    isRegister: boolean;
    isForgotPW: boolean;
    children: React.ReactNode;
}

const LoginWrapper = ({ isRegister, isForgotPW, children }: LoginWrapperProps) => {
    return (
        <div style={{ height: '100%', width: '100%' }}>
            <FormLogo isRegister={isRegister} isForgotPW={isForgotPW} />
            <div className={`${styles.formHolder} ${isRegister ? styles.registerHolder : ''}`}>
                {children}
            </div>
        </div>
    );
};

export default LoginWrapper;