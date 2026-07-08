import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "danger-outline"
  | "accent";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-semibold whitespace-nowrap leading-none [transition:background_var(--t-fast),border-color_var(--t-fast),color_var(--t-fast),opacity_var(--t-fast)] focus-visible:outline-none focus-visible:[box-shadow:var(--shadow-glow-purple)] disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--brand-purple)] text-white hover:bg-[var(--brand-purple-dark)]",
  secondary:
    "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-hover)]",
  outline:
    "border-[var(--border-strong)] bg-transparent text-[var(--text)] hover:bg-[var(--surface-hover)]",
  ghost: "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]",
  danger: "border-transparent bg-[var(--danger)] text-white hover:opacity-90",
  "danger-outline":
    "border-[var(--danger)] bg-transparent text-[var(--danger)] hover:bg-[var(--danger-bg-dark)]",
  accent: "border-transparent bg-[var(--brand-cyan)] text-[#04201d] hover:opacity-90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[length:var(--fs-xs)] gap-1.5 [&_svg]:h-3.5 [&_svg]:w-3.5",
  md: "h-10 px-4 text-[length:var(--fs-sm)] [&_svg]:h-4 [&_svg]:w-4",
  lg: "h-12 px-5 text-[length:var(--fs-md)] [&_svg]:h-[18px] [&_svg]:w-[18px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
        {...rest}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70"
          />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";
