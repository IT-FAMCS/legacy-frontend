export interface ButtonProps {
  className?: string;
  href?: string;
  type?: "button";
  label?: string;
  isLabelHidden?: boolean;
  iconSrc?: string;
  iconSize?: number;
  ariaLabel?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  full?: boolean;
  fillColor?: boolean;
  style?: React.CSSProperties;
  textStyle?: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  activeStyle?: React.CSSProperties;
}
