"use client";
import { Alert } from "@/types";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface RecentActivityProps {
    alerts: Alert[];
}

export default function RecentActivity({ alerts }: RecentActivityProps) {
    // Take last 20
    const processed = alerts.slice().reverse().slice(0, 50);

    const getIcon = (severity: string) => {
        switch (severity) {
            case "HIGH": return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
            case "MEDIUM": return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
            case "NORMAL": return <Info className="w-3.5 h-3.5 text-blue-500" />;
            default: return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
        }
    };

    return (
        <div className="w-full h-full flex flex-col font-mono text-[10px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-1 mb-2">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">System Log / Activity</div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-white/40">LIVE</span>
                    </div>
                </div>
            </div>

            {/* Terminal Feed */}
            <div className="flex-1 overflow-y-auto space-y-1 relative pr-1 custom-scrollbar">
                {processed.map((alert, i) => (
                    <div key={alert.id || i} className="group flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-white/20">
                        {/* Time Column */}
                        <div className="w-12 shrink-0 text-white/30 font-medium">
                            {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>

                        {/* Icon Indicator */}
                        <div className="mt-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                            {getIcon(alert.severity)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className={`font-bold tracking-tight ${alert.severity === 'HIGH' ? 'text-red-400' :
                                        alert.severity === 'MEDIUM' ? 'text-amber-400' : 'text-blue-400'
                                    }`}>
                                    {alert.type}
                                </span>
                                <span className="text-white/20 text-[9px]">ID::{alert.id}</span>
                            </div>
                            <div className="text-white/60 truncate group-hover:whitespace-normal group-hover:text-white/80 transition-colors">
                                {alert.message}
                            </div>
                        </div>
                    </div>
                ))}

                {processed.length === 0 && (
                    <div className="text-center py-8 text-white/20 italic">No recent activity logged...</div>
                )}
            </div>
        </div>
    );
}
