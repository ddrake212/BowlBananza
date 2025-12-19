import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

type RequireAuthProps = {
    children: JSX.Element;
};

export function RequireAuth({ children }: RequireAuthProps) {
    const { loggedIn, checked } = useAuth();
    const location = useLocation();

    // still checking /api/auth/me
    if (!checked) {
        return null; // or a simple "Loading..." if you want
    }

    if (!loggedIn) {
        // send them to /login, remember where they were going
        return (
            <Navigate
                to="/"
                state={{ from: location }}
                replace
            />
        );
    }

    return children;
}
