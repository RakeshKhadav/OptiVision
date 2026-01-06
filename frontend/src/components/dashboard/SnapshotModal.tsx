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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{alert.type}</h3>
                            <p className="text-xs text-slate-400">
                                {new Date(alert.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Snapshot Image */}
                    <div className="relative aspect-video bg-black rounded-lg border border-slate-800 overflow-hidden mb-4 group">
                        {alert.snapshot ? (
                            <img
                                src={alert.snapshot}
                                alt="Incident Snapshot"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                                No snapshot available
                            </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                            ID: #{alert.id}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Incident Report</h4>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            {alert.message}
                        </p>
                        <div className="mt-4 flex gap-4 text-xs text-slate-400">
                            <div>
                                <span className="block font-bold text-slate-500 uppercase">Severity</span>
                                <span className={alert.severity === 'HIGH' ? 'text-red-400' : 'text-amber-400'}>
                                    {alert.severity}
                                </span>
                            </div>
                            <div>
                                <span className="block font-bold text-slate-500 uppercase">Status</span>
                                <span className="text-cyan-400">
                                    PENDING REVIEW
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
