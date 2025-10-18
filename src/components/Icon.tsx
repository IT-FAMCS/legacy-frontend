import type {IconProps} from "../interfaces/Icon.tsx";

const Icon = (
  {
    className,
    src,
    ariaLabel,
    size = 40,
    style
  }: IconProps) => {

  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel ? ariaLabel : undefined}
      aria-hidden={ariaLabel ? undefined : "true"}
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
          alt={ariaLabel ? ariaLabel : ""}
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
