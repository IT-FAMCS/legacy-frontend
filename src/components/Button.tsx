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
  }: ButtonProps) => {
  const isLink = typeof href === 'string';
  const Component = isLink ? 'a' : 'button';
  const borderStyle = isLink ? 'none' : '1px solid #FFFFFF';

  const [isHovered, setIsHovered] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);


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
    
      {...interactionProps}
    >
      {buttonContent}
    </Component>
  );
};

export default Button;
