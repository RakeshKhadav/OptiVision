"use client";
import { useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";

interface Alert {
    id: number;
    type: string;
    severity: "HIGH" | "MEDIUM" | "NORMAL";
    message: string;
    snapshot: string;
    createdAt: string;
}

interface SnapshotModalProps {
    alert: Alert | null;
    onClose: () => void;
}

export default function SnapshotModal({ alert, onClose }: SnapshotModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!alert) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-950/90 p-4">
            <div className="bg-base-900 border border-base-800 rounded-none shadow-none max-w-4xl w-full overflow-hidden flex flex-col md:flex-row">

                {/* Snapshot Image Area */}
                <div className="md:w-2/3 bg-black flex items-center justify-center relative border-b md:border-b-0 md:border-r border-base-800 aspect-video md:aspect-auto">
                    {alert.snapshot ? (
                        <img
                            src={alert.snapshot}
                            alt="Incident Snapshot"
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <div className="text-foreground-muted text-sm font-mono">No image available</div>
                    )}
                    <div className="absolute top-3 left-3 bg-base-950/80 px-2 py-1 rounded-sm text-xs text-foreground font-mono border border-base-700">
                        CAM-01
                    </div>
                </div>

                {/* Details Panel */}
                <div className="md:w-1/3 flex flex-col bg-base-900 text-foreground">
                    {/* Header */}
                    <div className="p-4 border-b border-base-800 flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-sm leading-tight uppercase tracking-tight">{alert.message}</h3>
                            <span className="text-[10px] text-foreground-muted font-mono mt-1 block">ID: {alert.id}</span>
                        </div>
                        <button onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors p-1 hover:bg-base-800 rounded-sm">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Metadata List */}
                    <div className="p-4 space-y-4 flex-1">
                        <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-foreground-muted tracking-widest">Severity</span>
                            <div className={`flex items-center gap-2 text-xs font-medium ${alert.severity === 'HIGH' ? 'text-danger' : 'text-warning'}`}>
                                <AlertTriangle size={14} />
                                {alert.severity}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-foreground-muted tracking-widest">Detection Type</span>
                            <div className="text-xs text-foreground font-mono bg-base-950 border border-base-800 inline-block px-2 py-1 rounded-sm">
                                {alert.type}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[9px] uppercase font-bold text-foreground-muted tracking-widest">Timestamp</span>
                            <div className="text-xs text-foreground font-mono tabular-nums">
                                {new Date(alert.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-base-800 bg-base-950/30">
                        <button className="w-full py-2 bg-foreground text-base-950 text-xs font-bold uppercase tracking-wide rounded-sm hover:bg-white transition-colors">
                            Acknowledge Incident
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
