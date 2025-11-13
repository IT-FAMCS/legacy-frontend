import React from 'react';
import Icon from './Icon.tsx';
import type {ButtonProps} from "../interfaces/Button.tsx";

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
    hoverStyle,
    activeStyle
  }: ButtonProps) => {
  const isLink = typeof href === 'string';
  const Component = isLink ? 'a' : 'button';
  const borderStyle = isLink ? 'none' : '1px solid #FFFFFF';

  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);

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
    fontWeight: 600,
    fontSize: 16,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    width: full ? '100%' : undefined,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
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
  );
};

export default Button;