import React from "react";
import { GlassCard } from "./GlassCard";

interface MetricCardProps {
    label: string;
    value: string | number;
    trend?: {
        value: number; // percentage
        isPositive: boolean;
    };
    icon?: React.ReactNode;
    className?: string;
}

export function MetricCard({ label, value, trend, icon, className }: MetricCardProps) {
    return (
        <GlassCard className={`relative overflow-hidden ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-foreground-muted uppercase tracking-wider">{label}</span>
                {icon && <div className="text-accent opacity-80">{icon}</div>}
            </div>

            <div className="flex items-end gap-3">
                <span className="text-3xl font-light tracking-tight text-white font-mono">{value}</span>

                {trend && (
                    <div className={`flex items-center text-xs mb-1.5 px-2 py-0.5 rounded-full ${trend.isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                        <span>{trend.isPositive ? "+" : ""}{trend.value}%</span>
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
