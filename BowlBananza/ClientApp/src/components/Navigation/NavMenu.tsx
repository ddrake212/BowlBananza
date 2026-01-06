import React, { useState, useCallback } from 'react';
import { Collapse, Container, Navbar, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './NavMenu.css';
import { useAuth } from '../../hooks/useAuth';
import { useCookies } from 'react-cookie';

const NavMenu = () => {
    const [collapsed, setCollapsed] = useState(true);
    const [, , removeCookie] = useCookies(['appUser']);
    const { isCommish, isInactive, isBowlActive } = useAuth();

    const navigate = useNavigate();
    const { pathname } = useLocation();

    const toggleNavbar = useCallback(() => {
        setCollapsed(c => !c);
    }, [setCollapsed]);


    const logout = useCallback(async () => {
        setCollapsed(true);
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (res.ok) {
            removeCookie("appUser");
            navigate('/login');
        }
    }, [navigate, removeCookie]);

    let pName = pathname.toLowerCase().substring(1);
    if (pName === '' || pName === 'index.html') {
        pName = 'home';
    }

    return (
        <header style={{ position: 'sticky', left: 0, zIndex: 99999, height: '56px' }}>
            <Navbar className="navbar-expand-sm navbar-toggleable-sm ng-white mb-3" color="dark" dark>
                <Container className="full-container">
                    <NavbarToggler onClick={toggleNavbar} className="mr-2"/>
                    <Collapse className="d-sm-inline-flex flex-sm-row-reverse" isOpen={!collapsed} navbar>
                        <ul className="navbar-nav flex-grow">
                            <NavItem onClick={() => setCollapsed(true) }>
                                <NavLink tag={Link} className={`text-light ${pName === 'home' ? 'selected-nav' : ''}`} to="/"><span>Home</span></NavLink>
                            </NavItem>
                            {
                                !isInactive && isBowlActive && 
                                <NavItem onClick={() => setCollapsed(true)}>
                                    <NavLink tag={Link} className={`text-light ${pName === 'games' ? 'selected-nav' : ''}`} to="/games"><span>Games</span></NavLink>
                                </NavItem>
                            }
                            {
                                isCommish &&  
                                <NavItem onClick={() => setCollapsed(true)}>
                                    <NavLink tag={Link} className={`text-light ${pName === 'commish' ? 'selected-nav' : ''}`} to="/commish"><span>Commish</span></NavLink>
                                </NavItem>
                            }
                            <NavItem onClick={() => setCollapsed(true)}>
                                <NavLink tag={Link} className={`text-light ${pName === 'preferences' ? 'selected-nav' : ''}`} to="/preferences"><span>Preferences</span></NavLink>
                            </NavItem>
                            <NavItem onClick={() => setCollapsed(true)}>
                                <NavLink tag={Link} className={`text-light ${pName === 'history' ? 'selected-nav' : ''}`} to="/history"><span>History</span></NavLink>
                            </NavItem>
                            <span className="divider">|</span>
                            <hr className="smlDivider" />
                            <button className="logoutBtn" onClick={logout}>Log Out</button>
                        </ul>
                    </Collapse>
                </Container>
            </Navbar>
        </header>
    );
};

export default NavMenu;