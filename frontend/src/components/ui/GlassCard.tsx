import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    intensity?: "low" | "medium" | "high";
    interactive?: boolean;
}

export function GlassCard({
    children,
    className = "",
    intensity = "medium",
    interactive = false,
    ...props
}: GlassCardProps) {
    return (
        <div
            className={`
        glass-panel rounded-2xl p-6
        ${interactive ? "glass-panel-hover cursor-pointer" : ""}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}
