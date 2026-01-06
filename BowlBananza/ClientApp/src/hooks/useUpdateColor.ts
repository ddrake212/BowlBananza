import { useCallback } from 'react';

export const useUpdateColor = () => {
    return useCallback((color: string) => {
        document.documentElement.style.setProperty(`--background-border-color`, color === '#ffffff00' ? '#ccc' : color);
        document.documentElement.style.setProperty(`--glow-color`, color ?? 'rgb(253,99,39)');
        document.documentElement.style.setProperty(`--glow-color-background`, (color?.length === 9 ? 'transparent' : `${color}0D`));
    }, []);
}