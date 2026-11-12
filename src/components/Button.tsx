import type React from 'react';
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
    disabled = false,
    full,
    fillColor,
    style,
    hoverStyle,
    activeStyle
  }: ButtonProps) => {
  const isLink = typeof href === 'string';
  const Component = isLink ? 'a' : 'button';
  const borderStyle = isLink ? 'none' : '1px solid #FFFFFF';

  // Limit interaction overrides to paint properties so controls keep their bounds.
  const interactionStyles: Record<string, string | number> = {};
  for (const [state, overrides] of [['hover', hoverStyle], ['active', activeStyle]] as const) {
    for (const property of ['color', 'background', 'backgroundColor', 'borderColor', 'opacity', 'boxShadow'] as const) {
      const value = overrides?.[property];
      if (value !== undefined) interactionStyles[`--button-${state}-${property}`] = value;
    }
  }

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
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...style,
    ...interactionStyles
  };

  Object.assign(commonStyles, {
    '--button-base-color': commonStyles.color,
    '--button-base-background': style?.background ?? style?.backgroundColor ?? commonStyles.background ?? 'transparent',
    '--button-base-borderColor': commonStyles.borderColor ?? (isLink ? 'transparent' : '#FFFFFF'),
    '--button-base-boxShadow': commonStyles.boxShadow ?? 'none',
  });

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

  return (
    <Component
      className={['ui-button', className].filter(Boolean).join(' ')}
      {...(Component === 'button' ? {type, disabled} : {href: disabled ? undefined : href, tabIndex: disabled ? -1 : undefined})}
      onClick={disabled ? undefined : onClick}
      title={isLabelHidden ? label : undefined}
      aria-label={ariaLabel ?? (isLabelHidden ? label : undefined)}
      aria-disabled={disabled || undefined}
      style={commonStyles}
    >
      {buttonContent}
    </Component>
  );
};

export default Button;
