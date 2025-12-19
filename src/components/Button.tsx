import React, {useState} from 'react';
import Icon from './Icon.tsx';
import type {ButtonProps} from "../types/Button.tsx";

const Button = (
  {
    className,
    href,
    type = 'button',
    label,
    isLabelHidden = false,
    iconSrc,
    iconSize = 25,
    ariaLabel,
    onClick,
    full,
    fillColor,
    style,
    hoverStyle,
    activeStyle
  }: ButtonProps) => {
  const Component = type === 'button' ? 'button' : 'a';
  const borderStyle = Component === 'a' ? 'none' : '1px solid #FFFFFF';

  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const commonStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: full ? 'center' : 'flex-start',
    gap: 10,
    borderRadius: 15,
    border: borderStyle,
    padding: '0 10px',
    height: 35,
    color: fillColor ? '#2B2B2B' : '#FFFFFF',
    background: fillColor ? '#FFD54F' : 'transparent',
    fontSize: 16,
    fontFamily: "Jost, sans-serif", // почему-то общие стили не работают
    lineHeight: 1,
    whiteSpace: 'nowrap',
    width: full ? '100%' : undefined,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ...style,
    ...(isHovered && hoverStyle),
    ...(isActive && activeStyle)
  };

  const buttonContent = (
    <>
      {iconSrc && (
        <Icon
          src={iconSrc}
          size={iconSize}
          ariaLabel={ariaLabel}
          style={{flex: '0 0 auto'}}
        />
      )}
      {!isLabelHidden && (
        <span>{label}</span>
      )}
    </>
  )

  const interactionProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsActive(false);
    },
    onMouseDown: () => setIsActive(true),
    onMouseUp: () => setIsActive(false),
    onTouchStart: () => setIsActive(true),
    onTouchEnd: () => setIsActive(false),
  };

  return (
    <a href={href}>
      <Component
        className={className}
        {...(Component === 'button' ? {type} : {})}
        onClick={onClick}
        title={isLabelHidden ? label : undefined}
        aria-label={isLabelHidden ? label : undefined}
        style={commonStyles}
        {...interactionProps}
      >
        {buttonContent}
      </Component>
    </a>
  );
};

export default Button;
