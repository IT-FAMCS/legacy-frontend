import React from 'react';

export interface IconProps {
    className?: string;
    src: string;
    ariaLabel?: string;
    size?: number; // px
    style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = (
    {
        className,
        src,
        ariaLabel,
        size = 40,
        style
    }) => {

    return (
        <span
            className={className}
            aria-label={ariaLabel}
            role={ariaLabel ? 'img' : undefined}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                ...style
            }}
        >
      <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
          }}
      />
    </span>
    );
};

export default Icon;