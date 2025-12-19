import React, { useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import LoginWrapper from "./LoginWrapper";
import styles from "./Styles/Form.module.css";
import MainLoading from "../MainLoading";

export default function ChangePW() {
    const [pError, setPError] = useState<string | undefined>(undefined);
    const [cpError, setCPError] = useState<string | undefined>(undefined);

    const [changePWError, setChangePWError] = useState<string | undefined>(undefined);

    const [submitting, setSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();

    const { search } = useLocation();

    const [password, setPassword] = useState<string>('');

    const [confirmPW, setConfirmPW] = useState<string>('');
    const [inputType, setInputype] = useState<string>('password');

    const [success, setSuccess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const [userId, setUserId] = useState<number>(-1);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/auth/checkchagepw${search}`)
            .then(resp => resp.text())
            .then(result => setUserId(parseInt(result)))
            .catch(e => setChangePWError(e.message))
            .finally(() => setLoading(false))
    }, [search]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleCPWChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPW(e.target.value);
    };

    const validate = useCallback(() => {
        let valid = password && (confirmPW === password);
        setPError(undefined);
        setCPError(undefined);
        if (!password) {
            setPError('Password is required');
        } else if (!confirmPW) {
            setCPError('Confirm Password');
        } else if (confirmPW !== password) {
            setCPError('Passwords must match');
        }

        return valid;
    }, [password, confirmPW]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (success) {
            return;
        }
        if (validate() && !submitting) {
            setSubmitting(true);
            const res = await fetch(`/api/auth/changepw?pw=${password}&userId=${userId}&${search.substring(1)}`);

            if (res.ok) {
                setSuccess(true);
                setChangePWError(undefined);
            } else {
                setSubmitting(false);
                setChangePWError(await res.text());
            }
        }
    }, [password, submitting, userId, setSuccess, search, success, setSubmitting, validate, setChangePWError]);

    const goToLogin = useCallback(() => {
        navigate('/', { state: { logoAnimation: -2 } });
    }, [navigate]);

    if (loading) {
        return <MainLoading />
    }

    return (
        <LoginWrapper isRegister={false} isForgotPW={true}>
            <div className={`${styles.form} ${styles.forgotpwForm}`}>
                <div className={styles.miniLoginLogo} />
                {success && <label>Password Updated!</label>}
                {changePWError && <label className={`${styles.inputError} ${styles.loginError}`}>{changePWError}</label>}
                <form onSubmit={handleSubmit}>
                    {(!success || changePWError) &&
                        <>
                            <div>
                                <input placeholder="NEW PASSWORD" id="Password" type={inputType} className={styles.password} value={password} onChange={handleChange} />
                                {pError && <label className={styles.inputError}>{pError}</label>}
                            </div>

                            <div>
                                <input placeholder="CONFIRM PASSWORD" id="ConfirmPassword" type={inputType} className={styles.password} value={confirmPW} onChange={handleCPWChange} />
                                {cpError && <label className={styles.inputError}>{cpError}</label>}
                            </div>

                            <button type="button" className={styles.link} onClick={() => setInputype(t => t === 'password' ? 'text' : 'password')}><span>{inputType === 'password' ? 'Show Password' : 'Hide Password'}</span></button>

                            <button type="submit"><span>Change Password</span></button>
                        </>
                    }
                    <div className={styles.buttonGrp}>
                        <button onClick={goToLogin} className={styles.btnLink}><span>Go to Login</span></button>
                    </div>
                </form>
            </div>
        </LoginWrapper>
    );
}
