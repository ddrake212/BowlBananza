import React, { useState, useCallback } from 'react';
import LoginWrapper from './LoginWrapper';
import styles from './Styles/Form.module.css';
import { useNavigate } from 'react-router';

const ForgotPW = () => {
    const [email, setEmail] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [forgotPWError, setForgotPWError] = useState<string | undefined>(undefined);
    const [success, setSuccess] = useState<boolean>(false);
    const navigate = useNavigate();

    const validateForm = useCallback(() => {
        let valid = email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
        setForgotPWError(undefined);
        if (!email) {
            setForgotPWError('Email is required');
        } else if (!valid) {
            setForgotPWError('Valid email address is required');
        }
        return valid;
    }, [email]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!submitting && validateForm()) {
            setSubmitting(true);

            const res = await fetch(`/api/auth/forgotpw?email=${email}`);

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                setForgotPWError(undefined);
            } else {
                setForgotPWError("An error occurred");
            }
            setSubmitting(false);
        }
    }, [email, validateForm, setForgotPWError, submitting]);

    const goToLogin = useCallback(() => {
        navigate('/', { state: { logoAnimation: -2 } });
    }, [navigate]);

    return (
        <LoginWrapper isRegister={false} isForgotPW={true}>
            <div className={`${styles.form} ${styles.forgotpwForm}`}>
                <div className={styles.miniLoginLogo} />
                {success && <label>Request has been sent!</label>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <input value={email} className={styles.email} placeholder="Email" onChange={e => { setEmail(e.target.value); setForgotPWError(undefined) }} />
                        {forgotPWError && <label className={styles.inputError}>{forgotPWError}</label>}
                    </div>
                    <button type="submit" disabled={submitting}><span>Send Request</span></button>
                </form>
                <div className={styles.buttonGrp}>
                    <button onClick={goToLogin} className={styles.btnLink}><span>Back To Login</span></button>
                </div>
            </div>
        </LoginWrapper>
    );
};

export default ForgotPW;