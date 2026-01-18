import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    depth?: 'sm' | 'md' | 'lg';
    as?: React.ElementType;
}

export const GlassCard = ({
    children,
    className = '',
    depth = 'md',
    as: Component = 'div',
    ...props
}: GlassCardProps) => {

    return (
        <Component
            className={`
                relative overflow-hidden
                rounded-3xl border border-white/10
                bg-white/[0.02] backdrop-blur-3xl
                shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                transition-all duration-500
                group hover:bg-white/[0.05] hover:border-white/20
                ${className}
            `}
            {...props}
        >
            {/* Subtle Top Highlight */}
            <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent opacity-50" />

            {/* Soft Ambient Glow */}
            <div className="absolute -inset-full bg-radial-gradient from-white/10 to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none blur-2xl" />

            {/* Content Container */}
            <div className="relative z-10 p-8 md:p-10">
                {children}
            </div>
        </Component>
    );
};
