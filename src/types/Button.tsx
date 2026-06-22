export type ButtonProps = {
  className?: string;
  href?: string;
  type?: "button" | "submit";
  label?: string;
  isLabelHidden?: boolean;
  iconSrc?: string;
  iconSize?: number;
  ariaLabel?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  full?: boolean;
  fillColor?: boolean;
  style?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
}
