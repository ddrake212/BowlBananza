import React, { useState } from 'react';

export const DialogBox = ({ onClose, styling, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    const onClick = () => {
        setIsOpen(false);
        onClose();
    }

    const backgroundClick = (e) => {
        if (e.target.className === 'dialogBackground') {
            onClick();
        }
    };
    return (<>
        {isOpen &&
            <div className="dialogBackground" style={{ ...(styling ?? {}) }} onClick={backgroundClick}>
                <div className="dialogBox">
                    <div className="dialogHeader"><div onClick={onClick}></div></div>
                    <div>
                        {children}
                    </div>
                </div>
            </div>
            }
        </>
    );
};