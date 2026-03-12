import { HTMLAttributes, forwardRef } from "react";

type BadgeVariant =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "ac"
  | "wa"
  | "ce"
  | "tle"
  | "re";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]",
  brand:
    "bg-[var(--color-brand-900)] text-[var(--color-brand-200)] border border-[var(--color-brand-700)]",
  success:
    "bg-green-950 text-green-300 border border-green-800",
  warning:
    "bg-yellow-950 text-yellow-300 border border-yellow-800",
  error:
    "bg-red-950 text-red-300 border border-red-800",
  info:
    "bg-blue-950 text-blue-300 border border-blue-800",
  ac: "bg-green-950 text-green-300 border border-green-700 font-mono font-bold",
  wa: "bg-red-950 text-red-300 border border-red-700 font-mono font-bold",
  ce: "bg-orange-950 text-orange-300 border border-orange-700 font-mono font-bold",
  tle: "bg-purple-950 text-purple-300 border border-purple-700 font-mono font-bold",
  re: "bg-pink-950 text-pink-300 border border-pink-700 font-mono font-bold",
};

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "default", size = "sm", className = "", children, ...props },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center rounded-full font-medium whitespace-nowrap
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
export type { BadgeProps, BadgeVariant };
