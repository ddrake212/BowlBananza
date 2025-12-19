import React from 'react';
import FormLogo from './Login/FormLogo';
import Loading from './Loading';

interface Props {
    showLogo?: boolean;
}

const MainLoading = ({ showLogo }: Props) => {
    return (
        <>
            {showLogo && <FormLogo isRegister={false} isForgotPW={false} />}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Loading />
            </div>
        </>
    )
};

export default MainLoading;