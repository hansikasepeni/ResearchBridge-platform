import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "success"
    | "warning"
    | "destructive"
    | "outline"
    | "teal"
    | "purple"
    | "cyan"
    | "indigo";
  withDot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  withDot = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-blue-50 text-blue-700 border-blue-200/80 shadow-xs dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30 dark:shadow-[0_0_12px_rgba(59,130,246,0.15)]",
    secondary:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/80",
    success:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    warning:
      "bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 dark:shadow-[0_0_12px_rgba(245,158,11,0.15)]",
    destructive:
      "bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 dark:shadow-[0_0_12px_rgba(244,63,94,0.15)]",
    outline:
      "bg-white/60 text-slate-700 border-slate-200/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/15",
    teal:
      "bg-teal-50 text-teal-700 border-teal-200/80 shadow-xs dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30 dark:shadow-[0_0_12px_rgba(20,184,166,0.15)]",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200/80 shadow-xs dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 dark:shadow-[0_0_12px_rgba(168,85,247,0.15)]",
    cyan:
      "bg-cyan-50 text-cyan-700 border-cyan-200/80 shadow-xs dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30 dark:shadow-[0_0_12px_rgba(6,182,212,0.15)]",
    indigo:
      "bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-xs dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30 dark:shadow-[0_0_12px_rgba(99,102,241,0.15)]",
  };

  const dotColors = {
    default: "bg-blue-400 shadow-[0_0_6px_#60a5fa]",
    secondary: "bg-slate-400",
    success: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
    warning: "bg-amber-400 shadow-[0_0_6px_#fbbf24]",
    destructive: "bg-rose-400 shadow-[0_0_6px_#fb7185]",
    outline: "bg-slate-400",
    teal: "bg-teal-400 shadow-[0_0_6px_#2dd4bf]",
    purple: "bg-purple-400 shadow-[0_0_6px_#c084fc]",
    cyan: "bg-cyan-400 shadow-[0_0_6px_#22d3ee]",
    indigo: "bg-indigo-400 shadow-[0_0_6px_#818cf8]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all duration-200 backdrop-blur-md select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {withDot && (
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
