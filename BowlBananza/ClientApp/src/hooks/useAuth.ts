import { useEffect, useState } from "react";
import { useLocation } from "react-router";

type MeResponse = {
    userId: number;
    username: string;
    isCommish: boolean;
    isSubmitted: boolean;
    isLocked: boolean;
    isInactive: boolean;
    isBowlActive: boolean;
    permissionRequired: boolean;
};

export function useAuth() {
    const { pathname } = useLocation();
    const [user, setUser] = useState<MeResponse | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;

        fetch("/api/auth/me")
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (cancelled) return;
                setUser(data);
                setChecked(true);
            })
            .catch(() => {
                if (cancelled) return;
                setUser(null);
                setChecked(true);
            });

        return () => {
            cancelled = true;
        };
    }, [pathname]);

    return {
        user,
        loggedIn: !!user,
        checked,
        isCommish: user?.isCommish,
        isSubmitted: user?.isSubmitted,
        isLocked: user?.isLocked,
        isInactive: user?.isInactive,
        isBowlActive: user?.isBowlActive,
        permissionRequired: user?.permissionRequired
    };
}
