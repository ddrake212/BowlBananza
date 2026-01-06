import React, { useState, useEffect } from "react";
import { useCallback } from 'react';
import { useLocation, useNavigate } from "react-router";
import GoogleLoginButton from "./GoogleLoginButton";
import styles from "./Styles/Form.module.css";
import LoginWrapper from "./LoginWrapper";
import { useCookies } from 'react-cookie';
import { useIsApp } from "../../hooks/useIsApp";

function getSearchParamsAsObject(queryString: string): { [key: string]: string } {
    // Create a URLSearchParams object from the query string
    const searchParams = new URLSearchParams(queryString);

    // Convert the URLSearchParams iterator to a plain object
    const paramsObject: { [key: string]: string } = Object.fromEntries(searchParams.entries());

    return paramsObject;
}

export default function LoginForm() {
    const [cookies, setCookie, removeCookie] = useCookies(['rememberMe', 'appUser']);
    const location = useLocation();
    const { email, rtnPage } = location.state || {};

    const navigateTo = getSearchParamsAsObject(location.search).nt ?? rtnPage;

    const [username, setUsername] = useState(email ?? (cookies.rememberMe ?? ""));
    const [password, setPassword] = useState("");
    const [usernameError, setUserNameError] = useState<string | undefined>(undefined);
    const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
    const [rememberMe, setRememberMe] = useState<boolean>(cookies.rememberMe ? true : false);

    const [loginError, setLoginError] = useState<string | undefined>(undefined);

    const [submitting, setSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();
    const isApp = useIsApp();

    useEffect(() => {
        if (!submitting && isApp && cookies.appUser) {
            setSubmitting(true);
            fetch(`/api/auth/applogin?userName=${cookies.appUser}`).then((resp) => {
                if (navigateTo) {
                    navigate(navigateTo);
                } else {
                    navigate("/home");
                }
            }).catch(() => {
                setSubmitting(false);
            });
        }
    }, [submitting, isApp, cookies.appUser, navigate, navigateTo]);

    const validateForm = useCallback(() => {
        let valid = username && password;

        if (!username) {
            setUserNameError('User is required');
        }

        if (!password) {
            setPasswordError('Password is required');
        }

        return valid;
    }, [username, password, setUserNameError, setPasswordError]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!submitting && validateForm()) {
            setSubmitting(true);
            const body = { Username: username, Password: password };

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                if (rememberMe) {
                    setCookie('rememberMe', username);
                } else {
                    removeCookie('rememberMe');
                }
                setLoginError(undefined);
                if (isApp) {
                    setCookie('appUser', username);
                }
                if (navigateTo) {
                    navigate(navigateTo);
                } else {
                    navigate("/home");
                }
            } else {
                setLoginError("Incorrect user or password");
                setSubmitting(false);
            }
        }
    }, [navigate, isApp, navigateTo, password, username, validateForm, setLoginError, submitting, setSubmitting, rememberMe, setCookie, removeCookie]);

    const onGoogleSubmit = useCallback((success: boolean, email?: string) => {
        if (success) {
            if (isApp) {
                setCookie('appUser', email);
            }
            if (rememberMe) {
                setCookie('rememberMe', email);
            } else {
                removeCookie('rememberMe');
            }
        } else {
            setSubmitting(false);
        }
    }, [setSubmitting, isApp, rememberMe, setCookie, removeCookie]);

    const register = useCallback(() => {
        navigate("/register", { state: { email: username, logoAnimation: 1 } });
    }, [navigate, username]);

    const forgotPW = useCallback(() => {
        navigate("/forgotpw", { state: { logoAnimation: -1 } });
    }, [navigate]);

    return (
        <LoginWrapper isRegister={false} isForgotPW={false}>
            <div className={`${styles.form} ${styles.loginForm}`}>
                <div className={styles.miniLoginLogo} />
                {loginError && <label className={`${styles.inputError} ${styles.loginError}`}>{loginError}</label>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <input value={username} className={styles.person} placeholder="User" onChange={e => { setUsername(e.target.value); setUserNameError(undefined) }} />
                        {usernameError && <label className={styles.inputError}>{usernameError}</label>}
                    </div>

                    <div>
                        <input
                            placeholder="Password"
                            value={password}
                            type="password"
                            className={styles.password}
                            onChange={e => { setPassword(e.target.value); setPasswordError(undefined) } }
                        />
                        {passwordError && <label className={styles.inputError}>{passwordError}</label>}
                    </div>
                    <div className={styles.textFlex}>
                        <div className={styles.rememberRow}>
                            <input type="checkbox" id="remember" className={styles.rememberCheckbox} checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                            <label htmlFor="remember">Remember Me</label>
                        </div>
                        <button type="button" className={`${styles.link} ${styles.forgotPW}`} onClick={forgotPW}><span>Forgot Password</span></button>
                    </div>
                    <button type="submit" disabled={submitting}><span>Login</span></button>
                </form>
                <div className={styles.buttonGrp}>
                    <GoogleLoginButton onSubmit={onGoogleSubmit} rtnPage={navigateTo} startSubmit={() => setSubmitting(true)} />
                    <button onClick={register} className={styles.btnLink}><span>Register</span></button>
                </div>
            </div>
        </LoginWrapper>
    );
}
