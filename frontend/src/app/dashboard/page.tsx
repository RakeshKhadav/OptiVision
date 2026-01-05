"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useTrails } from "@/hooks/useTrails";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useAuthStore } from "@/store/useAuthStore";
import LiveFeed from "@/components/dashboard/LiveFeed";
import Minimap from "@/components/dashboard/Minimap";
import ProductivityChart from "@/components/dashboard/ProductivityChart";
import SnapshotModal from "@/components/dashboard/SnapshotModal";

export default function Dashboard() {
    const router = useRouter();
    const { token, user, logout, hydrateFromStorage } = useAuthStore();
    const { activeCameraId, showTrails, toggleTrails, isPrivacyMode, setPrivacyMode, alerts } = useDashboardStore();
    const { isConnected, frame, detections } = useSocket(activeCameraId);
    const trails = useTrails(detections);
    const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white font-sans">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        OptiVision <span className="text-cyan-500">AI</span> Command Center
                    </h1>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'} text-[10px] font-bold uppercase tracking-wider`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? "System Live" : "System Offline"}
                    </div>
                </div>

                <div className="flex items-center gap-6">

                    <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                        <button
                            onClick={toggleTrails}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${showTrails ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            Trails: {showTrails ? 'ON' : 'OFF'}
                        </button>
                        <button
                            onClick={() => setPrivacyMode(!isPrivacyMode)}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${isPrivacyMode ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            Privacy: {isPrivacyMode ? 'ENABLED' : 'DISABLED'}
                        </button>
                    </div>

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-3">
                        {user && (
                            <span className="text-xs text-slate-400">
                                {user.name}
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
                        <LiveFeed
                            frame={frame}
                            detections={detections}
                            showTrails={showTrails}
                            trails={trails}
                        />
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    {/* Minimap Widget */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Digital Twin</h2>
                        <Minimap detections={detections} />
                    </div>

                    {/* Productivity Widget */}
                    <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Worker Activity</h2>
                        </div>
                        <ProductivityChart />
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Incident Timeline</h2>
                            <span className="bg-red-500/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30">
                                {alerts.length} New
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                            {alerts.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20">
                                    <p className="text-xs text-center mt-2">Awaiting AI events...</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        onClick={() => setSelectedAlert(alert)}
                                        className={`p-3 rounded-lg border bg-slate-950/50 transition-all hover:translate-x-1 cursor-pointer ${alert.severity === 'HIGH' ? 'border-red-500/30 hover:border-red-500' : 'border-slate-800 hover:border-slate-700'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${alert.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                {alert.type}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(alert.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed truncate">{alert.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <SnapshotModal
                alert={selectedAlert}
                onClose={() => setSelectedAlert(null)}
            />
        </main>
    );
}
