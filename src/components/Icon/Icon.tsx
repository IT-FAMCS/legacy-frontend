import React from 'react';
import './Icon.scss';
import clsx from 'clsx';

interface IconProps {
    className?: string;
    src: string;
    hasFill?: boolean;
    ariaLabel?: string;
}

const Icon: React.FC<IconProps> = (
    {
        className,
        src,
        ariaLabel
    }) => {
    return (
        <span className={clsx(className, 'icon')} aria-label={ariaLabel}>
            <img
                className={clsx(className, 'icon')}
                src={src}
                alt=""
                loading="lazy"
            />
        </span>
    );
};

export default Icon;