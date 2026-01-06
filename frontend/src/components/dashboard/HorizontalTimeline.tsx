"use client";
import React, { useRef } from "react";

interface Alert {
    id: number;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
    [key: string]: any;
}

interface HorizontalTimelineProps {
    alerts: Alert[];
    onAlertClick: (alert: Alert) => void;
}

export default function HorizontalTimeline({ alerts, onAlertClick }: HorizontalTimelineProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const getSeverityColor = (severity: string) => {
        switch (severity?.toUpperCase()) {
            case "HIGH": return "bg-red-500 border-red-400";
            case "MEDIUM": return "bg-amber-500 border-amber-400";
            default: return "bg-emerald-500 border-emerald-400";
        }
    };

    return (
        <div className="w-full bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incident Timeline</h2>
                <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30">
                    {alerts.length} Events
                </span>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x"
            >
                {alerts.length === 0 ? (
                    <div className="w-full h-24 flex items-center justify-center border border-dashed border-slate-800 rounded-lg opacity-30">
                        <p className="text-xs">Awaiting real-time incident data stream...</p>
                    </div>
                ) : (
                    [...alerts].reverse().map((alert) => (
                        <div
                            key={alert.id}
                            onClick={() => onAlertClick(alert)}
                            className="shrink-0 w-48 bg-slate-950/50 border border-slate-800 rounded-lg p-3 cursor-pointer hover:border-slate-600 transition-all hover:scale-[1.02] snap-start"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)}`} />
                                <span className="text-[9px] text-slate-500 font-mono">
                                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                            <h3 className="text-[10px] font-bold text-white uppercase truncate mb-1">{alert.type.replace('_', ' ')}</h3>
                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                                {alert.message}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
