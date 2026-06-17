import Link from "next/link";
import type { ReactNode } from "react";

type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  children: ReactNode;
  size?: ButtonSize;
  /** Show the bronze accent dot (brand device). On by default. */
  dot?: boolean;
  className?: string;
}

/**
 * Either a link (`href`) or an action (`onClick`).
 *
 * This is the main interactivity seam: today every CTA is an anchor to a
 * `#hash`. To make a button *do* something later (open the scan flow, push a
 * route, fire analytics), pass `onClick` instead of / in addition to `href`
 * — no markup or styling changes needed.
 */
type ButtonProps =
  | (BaseProps & {
      href: string;
      onClick?: () => void;
      type?: never;
    })
  | (BaseProps & {
      href?: undefined;
      onClick: () => void;
      type?: "button" | "submit";
    });

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export default function Button({
  children,
  size = "md",
  dot = true,
  className,
  href,
  onClick,
  ...rest
}: ButtonProps) {
  const classes = ["btn", sizeClass[size], className].filter(Boolean).join(" ");
  const inner = (
    <>
      {dot && <span className="btn-dot" />}
      {children}
    </>
  );

  if (href) {
    // Internal hash/route links use next/link; it still accepts onClick.
    return (
      <Link href={href} className={classes} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  const type = "type" in rest && rest.type ? rest.type : "button";
  return (
    <button className={classes} onClick={onClick} type={type}>
      {inner}
    </button>
  );
}
