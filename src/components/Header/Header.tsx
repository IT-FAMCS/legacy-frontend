import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';
import '../../styles/variables.scss';

const useIsDesktop = (bp = 768) => {
    const [isDesk, setIsDesk] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= bp : true
    );
    useEffect(() => {
        const onResize = () => setIsDesk(window.innerWidth >= bp);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [bp]);
    return isDesk;
};

const containerStyle: React.CSSProperties = {
    width: '100%',
    margin: '0 auto',
    paddingInline: 25,
    paddingBlock: 10,
    boxSizing: 'border-box'
};

const buttonHoverStyle: React.CSSProperties = {
    background: '#FFFFFF',
    color: '#686ACF',
    border: '1px solid #FFFFFF'
};

const buttonActiveStyle: React.CSSProperties = {
    background: '#F0F0F0',
    color: '#686ACF',
    border: '1px solid #FFFFFF',
    transform: 'scale(0.98)'
};

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isDesktop = useIsDesktop(768);

    useEffect(() => {
        const html = document.documentElement;
        if (isMenuOpen) {
            html.style.overflow = 'hidden';
        } else {
            html.style.overflow = '';
        }
        return () => { html.style.overflow = ''; };
    }, [isMenuOpen]);

    const headerBarStyle = useMemo<React.CSSProperties>(() => ({
        position: 'sticky',
        top: 0,
        width: '100%',
        backgroundColor: '#686ACF',
        color: '#FFFFFF',
        zIndex: 1
    }), []);

    const headerInnerStyle = useMemo<React.CSSProperties>(() => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
    }), []);

    const brandStyle = useMemo<React.CSSProperties>(() => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        color: '#FFFFFF',
        textDecoration: 'none'
    }), []);

    const titleStyle = useMemo<React.CSSProperties>(() => ({
        margin: 0,
        color: '#FFFFFF',
        letterSpacing: '0.02em',
        fontSize: 35,
        fontWeight: 700,
        fontFamily: 'Jost, sans-serif',
    }), []);

    const burgerStyle = useMemo<React.CSSProperties>(() => ({
        position: 'relative',
        width: 25,
        height: 40,
        display: isDesktop ? 'none' : 'inline-flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        gap: 4,
        background: 'transparent',
        border: 0,
        padding: 0,
        cursor: 'pointer'
    }), [isDesktop]);

    const burgerLineStyle: React.CSSProperties = {
        display: 'block',
        width: '100%',
        height: 2,
        background: '#FFFFFF',
        borderRadius: 2,
        transition: 'all 0.2s ease'
    };

    const burgerMenuStyle = useMemo<React.CSSProperties>(() => ({
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100dvh',
        width: 'min(70vw, 340px)',
        background: 'rgba(18,18,18,0.8)',
        color: '#FFFFFF',
        transform: isMenuOpen ? 'translateX(0%)' : 'translateX(100%)',
        transition: 'transform 200ms ease',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column' as const
    }), [isMenuOpen]);

    const burgerMenuInnerStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: 16,
        gap: 12,
        boxSizing: 'border-box'
    };

    const burgerMenuHeadStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 10,
        marginTop: 10,
    };

    const closeBtnStyle: React.CSSProperties = {
        position: 'relative',
        width: 32,
        height: 32,
        border: 0,
        background: 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    };

    const closeLineBase: React.CSSProperties = {
        position: 'absolute',
        left: 4,
        right: 4,
        top: '50%',
        height: 2,
        background: '#FFFFFF',
        borderRadius: 2,
        transition: 'all 0.2s ease'
    };

    return (
        <header>
            <div style={headerBarStyle}>
                <div style={{ ...headerInnerStyle, ...containerStyle }}>
                    <a href="/" aria-label="На главную" style={brandStyle}>
                        <Icon
                            src="/src/assets/icons/famcs.svg"
                            size={60}
                        />
                        <h1 style={titleStyle}>LEGACY</h1>
                    </a>

                    {isDesktop ? (
                        <nav style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                            <Button
                                href="/"
                                label="НА ГЛАВНУЮ"
                                hoverStyle={buttonHoverStyle}
                                activeStyle={buttonActiveStyle}
                            />
                            <Button
                                href="#"
                                isLabelHidden
                                iconSrc="/src/assets/icons/profile.svg"
                                style={{
                                    border: 'none',
                                }}
                            />
                        </nav>
                    ) : (
                        <button
                            type="button"
                            aria-label="Открыть меню"
                            onClick={() => setIsMenuOpen(true)}
                            style={burgerStyle}
                            onMouseEnter={(e) => {
                                const target = e.currentTarget;
                                target.style.gap = '5px';
                            }}
                            onMouseLeave={(e) => {
                                const target = e.currentTarget;
                                target.style.gap = '4px';
                            }}
                        >
                            <span style={burgerLineStyle} />
                            <span style={burgerLineStyle} />
                            <span style={burgerLineStyle} />
                        </button>
                    )}
                </div>
            </div>

            <aside aria-hidden={!isMenuOpen} style={burgerMenuStyle}>
                <div style={burgerMenuInnerStyle}>
                    <div style={burgerMenuHeadStyle}>
                        <a href="/" style={brandStyle} onClick={() => setIsMenuOpen(false)}>
                            <Icon
                                src="/src/assets/icons/famcs.svg"
                                size={45}
                            />
                        </a>
                        <button
                            type="button"
                            aria-label="Закрыть меню"
                            onClick={() => setIsMenuOpen(false)}
                            style={closeBtnStyle}
                            onMouseEnter={(e) => {
                                const target = e.currentTarget;
                                target.style.transform = 'rotate(90deg)';
                                const lines = target.querySelectorAll('span');
                                lines.forEach(line => {
                                    (line as HTMLElement).style.background = '#686ACF';
                                });
                            }}
                            onMouseLeave={(e) => {
                                const target = e.currentTarget;
                                target.style.transform = 'rotate(0deg)';
                                const lines = target.querySelectorAll('span');
                                lines.forEach(line => {
                                    (line as HTMLElement).style.background = '#FFFFFF';
                                });
                            }}
                        >
                            <span style={{ ...closeLineBase, transform: 'translateY(-50%) rotate(45deg)' }} />
                            <span style={{ ...closeLineBase, transform: 'translateY(-50%) rotate(-45deg)' }} />
                        </button>
                    </div>
                    <nav style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                        <Button
                            full
                            href="/"
                            label="На главную"
                            hoverStyle={buttonHoverStyle}
                            activeStyle={buttonActiveStyle}
                        />
                        <Button
                            full
                            href="#"
                            label="Раздел 1"
                            hoverStyle={buttonHoverStyle}
                            activeStyle={buttonActiveStyle}
                        />
                        <Button
                            full
                            href="#"
                            label="Раздел 2"
                            hoverStyle={buttonHoverStyle}
                            activeStyle={buttonActiveStyle}
                        />
                        <Button
                            full
                            href="#"
                            label="Раздел 3"
                            hoverStyle={buttonHoverStyle}
                            activeStyle={buttonActiveStyle}
                        />
                    </nav>
                    <div style={{ marginTop: 10, marginInline: 'auto' }}>
                        <Button
                            href="#"
                            isLabelHidden
                            iconSrc="/src/assets/icons/profile.svg"
                            iconSize={35}
                            style={{
                                border: 'none',
                            }}
                        />
                    </div>
                </div>
            </aside>
        </header>
    );
};

export default Header;