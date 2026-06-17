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
        bg-[#161C23] border border-[#2A3441] rounded-xl p-6
        ${hover ? "hover:border-[#6D5DFE]/40 hover:bg-[#1D2530] transition-all duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
