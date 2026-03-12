import { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "bordered" | "glass" | "elevated";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-[var(--bg-surface)] border border-[var(--border-primary)]",
  bordered: "bg-transparent border border-[var(--border-secondary)]",
  glass: "glass",
  elevated:
    "bg-[var(--bg-elevated)] border border-[var(--border-primary)] shadow-lg",
};

const paddingStyles: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      hoverable = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`
          rounded-xl transition-all duration-[var(--transition-fast)]
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverable ? "hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-glow)] cursor-pointer" : ""}
          ${className}
        `.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export { Card };
export type { CardProps, CardVariant };
