// App.tsx
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home/Home';
import Games from './components/Games/Games'
import { RequireAuth } from './components/RequireAuth';
import LoginForm from './components/Login/LoginForm';
import { useAuth } from './hooks/useAuth';
import RegistrationForm from './components/Login/RegistrationForm';
import ForgotPW from './components/Login/forgotpw';
import ChangePW from './components/Login/changepw';
import MainLoading from './components/MainLoading';
import { ColorContext } from './contexts/ColorContext';
import Commish from './components/Commish/Commish';
import Settings from './components/Settings/Settings';
import History from './components/History/History';

const App: React.FC = () => {
    const { loggedIn, checked } = useAuth();
    const [color, setColor] = useState<string>('#00000000');
    return (
        <ColorContext.Provider value={{ setColor, color }}>
            <Layout>
                <Routes>
                    <Route path="/" element={!checked ? <MainLoading showLogo /> : (!loggedIn ? <LoginForm /> : <Home />)} />
                    <Route path="/index.html" element={!checked ? <MainLoading showLogo /> : (!loggedIn ? <LoginForm /> : <Home />)} />
                    <Route path="/login" element={<LoginForm />} />
                    <Route path="/register" element={<RegistrationForm />} />
                    <Route path="/forgotpw" element={<ForgotPW />} />
                    <Route path="/changepw" element={<ChangePW />} />
                    <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />
                    <Route path="/games" element={<RequireAuth><Games /></RequireAuth>} />
                    <Route path="/commish" element={<RequireAuth><Commish /></RequireAuth>} />
                    <Route path="/preferences" element={<RequireAuth><Settings /></RequireAuth>} />
                    <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
                </Routes>
            </Layout>
        </ColorContext.Provider>
    );
};

export default App;
