import React from 'react';
import Icon from '../Icon/Icon';

export interface ButtonProps {
    className?: string;
    href?: string;
    type?: "button";
    label?: string;
    isLabelHidden?: boolean;
    iconSrc?: string;
    iconSize?: number;
    onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
    full?: boolean;
    fillColor?: boolean;
    style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = (
    {
        className,
        href,
        type = 'button',
        label,
        isLabelHidden = false,
        iconSrc,
        iconSize = 25,
        onClick,
        full,
        fillColor,
        style
    }) => {
    const isLink = typeof href === 'string';
    const borderStyle = !isLink ? 'none' : '1px solid #FFFFFF';
    const commonStyles: React.CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: full ? 'center' : 'flex-start',
        gap: 10,
        borderRadius: 10,
        border: borderStyle,
        padding: '0 16px',
        height: 40,
        color: fillColor ? '#2B2B2B' : '#FFFFFF',
        background: fillColor ? '#FFD54F' : 'transparent',
        fontFamily: 'Jost, sans-serif',
        fontWeight: 600,
        fontSize: 16,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        width: full ? '100%' : undefined,
        textDecoration: 'none',
        cursor: 'pointer',
        ...style
    };

    const buttonContent = (
        <>
            {iconSrc && (
                <Icon
                    src={iconSrc}
                    size={iconSize}
                    style={{ flex: '0 0 auto' }}
                />
            )}
            {!isLabelHidden && (
                <span>{label}</span>
            )}
        </>
    )

    if (isLink) {
        return (
            <a
                className={className}
                href={href}
                onClick={onClick as any}
                title={isLabelHidden ? label : undefined}
                aria-label={isLabelHidden ? label : undefined}
                style={commonStyles}
            >
                {buttonContent}
            </a>
        );
    }

    return (
        <button
            className={className}
            type={type}
            onClick={onClick}
            title={isLabelHidden ? label : undefined}
            aria-label={isLabelHidden ? label : undefined}
            style={commonStyles}
        >
            {buttonContent}
        </button>
    );
};

export default Button;