import React from 'react';
import './Header.scss';
import Button from "../Button";

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header__inner container">
                <Button
                    className="header__logo"
                    loading="eager"
                    iconSrc="/src/assets/icons/famcs.svg"
                    isLabelHidden
                />
                <h1 className="header__label h3">
                    {"Legacy".toUpperCase()}
                </h1>
            </div>
        </header>
    );
};

export default Header;