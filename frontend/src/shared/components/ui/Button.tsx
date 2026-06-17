import React from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#6D5DFE] hover:bg-[#5a4de0] text-white border border-[#6D5DFE] hover:border-[#5a4de0]",
  outline:
    "bg-transparent text-[#FFFDC] border border-[#2A3441] hover:border-[#6D5DFE] hover:text-[#6D5DFE]",
  ghost:
    "bg-transparent text-[#C5C7CB] border border-transparent hover:text-[#FFFDFC] hover:bg-[#161C23]",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        cursor-pointer select-none
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5DFE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0D0F]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
