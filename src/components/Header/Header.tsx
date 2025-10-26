import React from 'react';
import './Header.scss';
import Icon from "../Icon";
import Button from "../Button";

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header__inner container">
                <a href="/">
                    <Icon
                        className="header__icon"
                        loading="eager"
                        src="/src/assets/icons/famcs.svg"
                        isLabelHidden
                    />
                </a>
                <h1 className="header__label h3">
                    {"Legacy".toUpperCase()}
                </h1>
            </div>
        </header>
    );
};

export default Header;