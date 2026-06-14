// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          size === "sm" && "text-xs px-3 py-1.5",
          size === "md" && "text-sm px-4 py-2",
          variant === "primary" && "bg-[var(--accent)] text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]",
          variant === "ghost" && "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-panel)] hover:text-[var(--text)]",
          variant === "danger" && "bg-transparent text-red-500 hover:bg-red-50",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
