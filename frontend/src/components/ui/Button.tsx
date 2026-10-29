import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "teal"
    | "purple"
    | "glass";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]";

  const sizeStyles = {
    xs: "text-[11px] px-2.5 py-1 gap-1 rounded-lg",
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-xs font-semibold px-4 py-2 gap-2 shadow-sm",
    lg: "text-sm font-semibold px-5 py-2.5 gap-2.5 shadow-md",
  };

  const variantStyles = {
    primary:
      "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 focus:ring-indigo-500 border border-white/20",
    secondary:
      "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:active:bg-slate-700 dark:text-slate-200 dark:border-white/10 dark:hover:border-white/20 focus:ring-slate-400",
    outline:
      "border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/25 text-slate-700 dark:text-slate-200 shadow-xs focus:ring-indigo-500",
    ghost:
      "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white focus:ring-slate-300 dark:focus:ring-white/20",
    destructive:
      "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-500/25 focus:ring-rose-500 border border-rose-500/30",
    teal:
      "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:via-emerald-400 hover:to-cyan-400 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 focus:ring-teal-500 border border-white/20",
    purple:
      "bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 hover:from-purple-500 hover:via-violet-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 focus:ring-purple-500 border border-white/20",
    glass:
      "bg-white/70 hover:bg-white/90 active:bg-white text-slate-800 border border-slate-200/80 dark:bg-white/10 dark:hover:bg-white/20 dark:active:bg-white/25 dark:text-white backdrop-blur-md dark:border-white/20 shadow-sm focus:ring-slate-300 dark:focus:ring-white/50",
  };

  return (
    <button
      className={cn(base, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
