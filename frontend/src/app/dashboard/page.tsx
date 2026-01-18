"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { GlassButton } from "@/components/ui/GlassButton";
import { LogOut, Radar, ShieldCheck, Activity } from "lucide-react";
import LiveFeed from "@/components/dashboard/LiveFeed";
import HorizontalTimeline from "@/components/dashboard/HorizontalTimeline";
import SnapshotModal from "@/components/dashboard/SnapshotModal";
import { socket } from "@/lib/socket";
import ProductivityChart from "@/components/dashboard/ProductivityChart";
import { Detection, Alert } from "@/types";
import BackgroundElements from "@/components/landing/BackgroundElements";
import Minimap from "@/components/dashboard/Minimap";
import RecentActivity from "@/components/dashboard/RecentActivity";
import SafetyGauge from "@/components/dashboard/stats/SafetyGauge";
import ComplianceTracker from "@/components/dashboard/stats/ComplianceTracker";
import { usePPEStats } from "@/hooks/usePPEStats";

export default function Dashboard() {
    const router = useRouter();
    const { logout } = useAuthStore();

    // Essential hooks for Navbar state
    const { showTrails, isPrivacyMode, alerts, addAlert, fetchAlertHistory } = useDashboardStore();

    // Local state for live feed
    const [frame, setFrame] = useState<string>("");
    const [detections, setDetections] = useState<Detection[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    // State for incident timeline modal
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

    useEffect(() => {
        // Connect socket
        if (!socket.connected) {
            socket.connect();
        }

        function onConnect() {
            setIsConnected(true);
            console.log("Socket connected");
        }

        function onDisconnect() {
            setIsConnected(false);
            console.log("Socket disconnected");
        }

        function onStreamFeed(data: { image: string, boxes: any[] }) {
            setFrame(data.image);
            setDetections(data.boxes || []);
        }

        // Real-time alert listener
        function onAlert(data: Alert) {
            addAlert(data);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("stream_feed", onStreamFeed);
        socket.on("alert", onAlert);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("stream_feed", onStreamFeed);
            socket.off("alert", onAlert);
            socket.disconnect();
        };
    }, [addAlert]);

    // Fetch historical alerts on mount
    useEffect(() => {
        fetchAlertHistory();
    }, [fetchAlertHistory]);

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // --- DERIVED METRICS ---
    const safetyScore = useMemo(() => {
        const recentAlerts = alerts.slice(0, 50);
        let penalty = 0;
        recentAlerts.forEach(a => {
            if (a.severity === 'HIGH') penalty += 5;
            if (a.severity === 'MEDIUM') penalty += 2;
        });
        return Math.max(0, 100 - penalty);
    }, [alerts]);

    const zoneViolations = useMemo(() => {
        return alerts.filter(a => a.type === 'ZONE_INTRUSION' && !a.isResolved).length;
    }, [alerts]);

    const ppeStats = usePPEStats(detections);

    return (
        <main className="h-screen bg-base-950 text-foreground font-sans selection:bg-accent selection:text-black overflow-hidden relative flex flex-row">
            <BackgroundElements />
            {/* Darker overlay for better contrast */}
            <div className="absolute inset-0 bg-base-950/20 backdrop-blur-[2px] pointer-events-none" />

            {/* 1. SIDEBAR NAVIGATION */}
            <Sidebar onLogout={handleLogout} />

            {/* Content Area - Adjusted for Sidebar layout */}
            <div className="flex-1 h-full min-h-0 relative z-10 p-3 pl-0">
                <div className="grid grid-cols-12 gap-3 h-full">

                    {/* LEFT COLUMN: LIVE FEED + TIMELINE (Span 8) */}
                    <div className="col-span-8 flex flex-col gap-3 h-full min-h-0">
                        {/* Live Feed Container (Flex-1) */}
                        <div className="flex-1 rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-2xl relative flex flex-col group min-h-0">
                            {/* Inner Highlight */}
                            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                            {/* Feed Header */}
                            <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent pointer-events-none">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'} transition-all`} />
                                    <span className="text-xs font-medium text-white/90 tracking-wide font-mono">
                                        LIVE FEED_01
                                    </span>
                                </div>
                                <div className="px-2 py-0.5 bg-black/40 rounded border border-white/10 text-[9px] font-mono text-white/60">
                                    {detections.length} DETECTED
                                </div>
                            </div>

                            {/* Live Feed Component */}
                            <div className="flex-1 relative bg-black/20">
                                <LiveFeed
                                    frame={frame}
                                    detections={detections}
                                    showTrails={showTrails}
                                    isPrivacyMode={isPrivacyMode}
                                    trails={{}}
                                />
                            </div>
                        </div>

                        {/* Incident Timeline (Fixed Small Height: 140px) */}
                        <div className="h-[140px] shrink-0 rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-2xl relative flex flex-col">
                            {/* Inner Highlight */}
                            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                            <HorizontalTimeline
                                alerts={alerts}
                                onAlertClick={setSelectedAlert}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: COMMAND CENTER (Span 4) */}
                    <div className="col-span-4 flex flex-col gap-3 h-full min-h-0">

                        {/* 1. MINIMAP (Height ~22%) */}
                        <div className="h-[22%] rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-2xl relative flex flex-col min-h-0">
                            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                            <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
                                <Radar className="w-3.5 h-3.5 text-white/40" />
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Floor Plan</span>
                            </div>

                            <div className="flex-1 p-2 mt-4 relative">
                                <Minimap detections={detections} />
                            </div>
                        </div>

                        {/* 2. STATS GRID (Height ~18%) */}
                        <div className="h-[18%] grid grid-cols-2 gap-3 min-h-0">
                            {/* Productivity (Compact) */}
                            <div className="rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-xl relative p-1 flex flex-col justify-center">
                                <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                                <ProductivityChart />
                            </div>

                            {/* Safety Gauge */}
                            <div className="rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-xl relative p-2 flex flex-col items-center justify-center">
                                <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                                <SafetyGauge score={safetyScore} />
                            </div>
                        </div>

                        {/* 3. COMPLIANCE TRACKER (Height ~20%) */}
                        <div className="h-[20%] rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-xl relative p-3 flex flex-col min-h-0">
                            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                            <div className="flex items-center gap-2 mb-1 absolute top-3 right-3 opacity-30">
                                <ShieldCheck className="w-3.5 h-3.5" />
                            </div>
                            <ComplianceTracker zoneViolations={zoneViolations} ppeViolations={ppeStats} />
                        </div>

                        {/* 4. ACTIVITY FEED (Flex Fill) */}
                        <div className="flex-1 rounded-2xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-xl relative p-2 flex flex-col min-h-0">
                            <div className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                            <div className="flex items-center gap-2 mb-1 absolute top-3 right-3 opacity-30">
                                <Activity className="w-3.5 h-3.5" />
                            </div>
                            <RecentActivity alerts={alerts} />
                        </div>

                    </div>
                </div>
            </div>

            {/* Snapshot Modal for Alert Details */}
            {selectedAlert && (
                <SnapshotModal
                    alert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                />
            )}
        </main>
    );
}
