import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Styles/Form.module.css";

interface GoogleProps {
    onSubmit: (success: boolean, email?: string) => void;
    startSubmit: () => void;
}
export default function GoogleLoginButton({ onSubmit, startSubmit }: GoogleProps) {
    const navigate = useNavigate();

    const handleGoogleLogin = useCallback(() => {
        // 1. Make sure Google script is loaded
        if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
            console.error("Google Identity script not loaded or google.accounts.id undefined");
            alert("Google login is not ready yet. Check script tag & client ID config.");
            return;
        }
        startSubmit();
        try {
            google.accounts.id.initialize({
                client_id: "288341684974-etnkhsa9vjsnhhmutk2ih3drglitghju.apps.googleusercontent.com",
                callback: async (res: any) => {
                    if (!res || !res.credential) {
                        console.error("No credential in Google response:", res);
                        alert("Google didn't return a credential. Check console for details.");
                        onSubmit(false);
                        return;
                    }

                    const profile = parseJwt(res.credential);

                    const body = {
                        Email: profile.email,
                        FirstName: profile.given_name,
                        LastName: profile.family_name,
                        GoogleId: profile.sub
                    };

                    let apiRes: Response;

                    try {
                        apiRes = await fetch("/api/auth/google", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(body)
                        });
                    } catch (err) {
                        console.error("Network error calling /api/auth/google:", err);
                        alert("Network error calling /api/auth/google. See console.");
                        onSubmit(false);
                        return;
                    }


                    if (apiRes.status === 404 || apiRes.status === 401) {
                        onSubmit(true, profile.email);
                        navigate("/register", { state: { email: profile.email, logoAnimation: 1 } });
                        return;
                    }

                    if (apiRes.ok) {
                        onSubmit(true, profile.email);
                        navigate("/home");
                    } else {
                        onSubmit(false);
                        navigate("/register", { state: { email: profile.email, logoAnimation: 1 } });
                    }
                }
            });

            google.accounts.id.prompt((notification: any) => {
                if (notification.getSkippedReason()) {
                    onSubmit(false);
                }
            });
        } catch (err) {
            console.error("Error during google.accounts.id.initialize/prompt:", err);
            alert("Error initializing Google login – see console.");
            onSubmit(false);
        }
    }, [navigate, onSubmit, startSubmit]);

    return (
        <button onClick={handleGoogleLogin} className={styles.btnLink}>
            <div className={styles.googleLogo} />
            <span>Login with Google</span>
        </button>
    );
}

// helper to decode Google JWT
function parseJwt(token: string) {
    const base64 = token.split('.')[1];
    const json = atob(base64);
    return JSON.parse(json);
}
