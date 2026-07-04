import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = true,
}) => {
  return (
    <div
      className={`
        bg-surface border border-border rounded-xl p-6
        ${hover ? "hover:border-brand-purple/40 hover:bg-surface-hover transition-all duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
