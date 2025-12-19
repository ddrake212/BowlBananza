import React, { useCallback, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import LoginWrapper from "./LoginWrapper";
import styles from "./Styles/Form.module.css";

export default function RegistrationForm() {
    const location = useLocation();
    const { email } = location.state || {};

    const [fError, setFError] = useState<string | undefined>(undefined);
    const [lError, setLError] = useState<string | undefined>(undefined);
    const [eError, setEError] = useState<string | undefined>(undefined);
    const [uError, setUError] = useState<string | undefined>(undefined);
    const [pError, setPError] = useState<string | undefined>(undefined);

    const [loginError, setLoginError] = useState<string | undefined>(undefined);

    const [submitting, setSubmitting] = useState<boolean>(false);

    const navigate = useNavigate();

    const parseUserName = (str: string | undefined) => {
        if (str) {
            const ind = str.indexOf('@');
            if (ind > -1) {
                return str.substring(0, ind);
            }
            return str;
        }
        return "";
    };

    const [user, setUser] = useState({
        FirstName: "",
        LastName: "",
        Username: parseUserName(email),
        Password: "",
        Email: email?.indexOf('@') > -1 ? email : "",
    });

    const [confirmPW, setConfirmPW] = useState<string>('');
    const [inputType, setInputype] = useState<string>('password');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUser({
            ...user,
            [e.target.id]: e.target.value
        });
    };

    const validate = useCallback(() => {
        let valid = user.FirstName && user.LastName && user.Username && user.Email && /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.Email) && user.Password && (confirmPW === user.Password);
        setFError(undefined);
        setLError(undefined);
        setUError(undefined);
        setEError(undefined);
        setPError(undefined);

        if (!user.FirstName) {
            setFError('First name is required');
        }

        if (!user.LastName) {
            setLError('Last name is required');
        }

        if (!user.Username) {
            setUError('User name is required');
        }

        if (!user.Email) {
            setEError('Email is required');
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(user.Email)) {
            setEError('Valid email address is required');
        }

        if (!user.Password) {
            setPError('Password is required');
        } else if (!confirmPW) {
            setPError('Confirm Password');
        } else if (confirmPW !== user.Password) {
            setPError('Passwords must match');
        }

        return valid;
    }, [user, confirmPW]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (validate() && !submitting) {
            setSubmitting(true);
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user)
            });
            
            if (res.ok) {
                const created = await res.json();
                navigate("/", { state: { email: created.email, logoAnimation: 0 } })
            } else {
                setSubmitting(false);
                setLoginError(await res.text());
            }
        }
    }, [navigate, user, submitting, setSubmitting, validate, setLoginError]);

    const goToLogin = useCallback(() => {
        navigate('/', { state: { logoAnimation: 0} });
    }, [navigate]);

    return (
        <LoginWrapper isRegister isForgotPW={false}>
            <div className={`${styles.form} ${styles.registerForm}`}>
                <div className={styles.miniLoginLogo} />
                {loginError && <label className={`${styles.inputError} ${styles.loginError}`}>{loginError}</label>}
                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <div className={styles.flexCol}>
                            <input placeholder="First Name" id="FirstName" className={styles.person} value={user.FirstName} onChange={handleChange} autoComplete={'given-name'} />
                            {fError && <label className={styles.inputError}>{fError}</label>}
                        </div>

                        <div className={styles.flexCol}>
                            <input placeholder="Last Name" id="LastName" value={user.LastName} className={styles.person} onChange={handleChange} autoComplete={'family-name'} />
                            {lError && <label className={styles.inputError}>{lError}</label>}
                        </div>
                    </div>
                    <hr className={styles.loginSplitter} />
                    <div>
                        <input placeholder="Email Address" id="Email" value={user.Email} className={styles.email} onChange={handleChange} autoComplete={'email'} />
                        {eError && <label className={styles.inputError}>{eError}</label>}
                    </div>

                    <div>
                        <input placeholder="User Name" id="Username" value={user.Username} className={styles.person} onChange={handleChange} />
                        {uError && <label className={styles.inputError}>{uError}</label>}
                    </div>

                    <hr className={styles.loginSplitter} />

                    <div className={styles.inputGroup}>
                        <div className={styles.flexCol}>
                            <input placeholder="PASSWORD" id="Password" type={inputType} className={styles.password} value={user.Password} onChange={handleChange} />
                            {pError && <label className={styles.inputError}>{pError}</label>}
                        </div>

                        <div>
                            <input placeholder="CONFIRM PASSWORD" id="ConfirmPassword" type={inputType} className={styles.password} value={confirmPW} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPW(e.target.value)} />
                        </div>
                    </div>
                    <button type="button" className={styles.link} onClick={() => setInputype(t => t === 'password' ? 'text' : 'password')}><span>{inputType === 'password' ? 'Show Password' : 'Hide Password'}</span></button>

                    <button type="submit"><span>Register</span></button>
                    <div className={styles.buttonGrp}>
                        <button onClick={goToLogin} className={styles.btnLink}><span>Back to Login</span></button>
                    </div>
                </form>
            </div>
        </LoginWrapper>
    );
}
