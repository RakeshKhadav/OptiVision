"use client";
import { useEffect, useState, useRef } from "react";

interface Metric {
    label: string;
    value: number;
    unit: string;
    trend: number; // + or -
}

interface ProductivityChartProps {
    initialData: any[];
}

export default function ProductivityChart({ initialData }: ProductivityChartProps) {
    // We are repurposing this component to be a "Live Metrics Engine"
    // Instead of a chart, we show raw, tabular data with deterministic updates.

    // We are repurposing this component to be a "Live Metrics Engine"
    // Instead of a chart, we show raw, tabular data with deterministic updates.

    // Transform initialData (which is now strictly chartData {name, value}) into Metrics
    // If no data, use placeholders
    const metrics: Metric[] = initialData.length > 0 ? initialData.map(d => ({
        label: d.name,
        value: d.value,
        unit: 's', // Assuming seconds/duration from backend
        trend: 0
    })) : [
        { label: "Efficiency", value: 92.4, unit: "%", trend: 0.1 },
        { label: "Cycle Time", value: 145, unit: "ms", trend: -12 },
        { label: "Throughput", value: 840, unit: "/hr", trend: 5 },
        { label: "Idle State", value: 4.2, unit: "%", trend: -0.5 },
    ];

    return (
        <div className="w-full flex flex-col gap-1">
            {metrics.map((metric) => (
                <div key={metric.label} className="group flex items-center justify-between py-2 border-b border-base-800/50 last:border-0 hover:bg-base-900/50 px-2 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider group-hover:text-foreground transition-colors">
                            {metric.label}
                        </span>
                        <div className="h-0.5 w-8 bg-base-800 mt-1 overflow-hidden">
                            <div
                                className="h-full bg-accent transition-all duration-1000 ease-linear"
                                style={{ width: `${Math.min(100, (metric.value / 100) * 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-mono font-medium text-foreground tabular-nums">
                                {metric.value}
                            </span>
                            <span className="text-[9px] text-foreground-muted">{metric.unit}</span>
                        </div>
                        {/* Delta Indicator */}
                        <span className={`text-[9px] font-mono ${metric.trend >= 0 ? 'text-success' : 'text-accent'}`}>
                            {metric.trend >= 0 ? '+' : ''}{metric.trend}%
                        </span>
                    </div>
                </div>
            ))}

            {/* Footer / Status */}
            <div className="mt-2 text-[9px] font-mono text-foreground-dark flex justify-between">
                <span>AGGREGATION: 5m</span>
                <span>σ: 0.04</span>
            </div>
        </div>
    );
}
