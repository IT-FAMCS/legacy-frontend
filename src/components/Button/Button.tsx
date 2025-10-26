import React from 'react';
import './Button.scss';
import clsx from 'clsx';
import Icon from "../Icon/Icon.tsx";

interface ButtonProps {
    className?: string;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    label: string;
    isLabelHidden?: boolean;
    iconSrc?: string;
    hasFillIcon?: boolean;
}

const Button: React.FC<ButtonProps> = ({
                                           className,
                                           href,
                                           type = 'button',
                                           label,
                                           isLabelHidden = false,
                                           iconSrc,
                                           hasFillIcon,
                                       }) => {
    const isLink = href !== undefined;
    const Component = isLink ? 'a' : 'button';
    const title = isLabelHidden ? label : undefined;

    return (
        <Component
            className={clsx(className, 'button')}
            title={title}
            aria-label={title}
            {...(isLink ? { href } : { type })}
        >
            {iconSrc &&
              <Icon
                className="button__icon"
                src={iconSrc}
                hasFill={hasFillIcon}
              />
            }
            {!isLabelHidden && <span className="button__label">{label}</span>}
        </Component>
    );
};

export default Button;