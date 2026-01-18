import React from "react";
import { Loader2 } from "lucide-react";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}

export function GlassButton({
    children,
    className = "",
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled,
    ...props
}: GlassButtonProps) {
    const baseStyles = "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-accent/10 text-accent hover:bg-accent hover:text-white border border-accent/20",
        secondary: "bg-white/5 text-foreground hover:bg-white/10 border border-white/10",
        danger: "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20",
        ghost: "text-foreground-muted hover:text-foreground hover:bg-white/5",
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}
