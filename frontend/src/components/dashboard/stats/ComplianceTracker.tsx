"use client";
import { AlertTriangle, HardHat, ShieldAlert, Ban } from "lucide-react";

interface ComplianceTrackerProps {
    zoneViolations: number;
    // Future API Hook: Pre-defining prop structure for PPE integration
    ppeViolations?: {
        helmet?: number;
        vest?: number;
    };
}

export default function ComplianceTracker({ zoneViolations, ppeViolations }: ComplianceTrackerProps) {
    // Real Data Only - No Mocks
    const helmetCount = ppeViolations?.helmet ?? 0;
    const vestCount = ppeViolations?.vest ?? 0;

    return (
        <div className="w-full h-full flex flex-col gap-2 overflow-y-auto pr-1">
            {/* Header */}
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 pl-1">
                Active Violations
            </div>

            {/* List Items */}
            <div className="space-y-2">

                {/* Real Data: Zone Intrusions */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-red-500/20 rounded-lg text-red-500">
                            <Ban className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-medium text-red-200">Restricted Zone</span>
                    </div>
                    <span className="text-sm font-bold text-red-500">{zoneViolations}</span>
                </div>

                {/* Mock Data: PPE - Helmet */}
                <div className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all
                    ${helmetCount > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5 opacity-50'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${helmetCount > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-white/40'}`}>
                            <HardHat className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-medium ${helmetCount > 0 ? 'text-amber-200' : 'text-white/40'}`}>
                            No Helmet Detected
                        </span>
                    </div>
                    <span className={`text-sm font-bold ${helmetCount > 0 ? 'text-amber-500' : 'text-white/20'}`}>
                        {helmetCount}
                    </span>
                </div>

                {/* Mock Data: PPE - Vest */}
                <div className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all
                    ${vestCount > 0 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/5 opacity-50'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${vestCount > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-white/40'}`}>
                            <ShieldAlert className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-medium ${vestCount > 0 ? 'text-amber-200' : 'text-white/40'}`}>
                            Safety Vest Missing
                        </span>
                    </div>
                    <span className={`text-sm font-bold ${vestCount > 0 ? 'text-amber-500' : 'text-white/20'}`}>
                        {vestCount}
                    </span>
                </div>

            </div>
        </div>
    );
}
