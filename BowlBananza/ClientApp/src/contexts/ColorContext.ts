import React from 'react';
interface ColorContextType {
    color: string;
    setColor: React.Dispatch<React.SetStateAction<string>>;
}

export const ColorContext = React.createContext<ColorContextType | null>(null);