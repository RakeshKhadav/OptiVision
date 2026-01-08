"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useTrails } from "@/hooks/useTrails";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cameraService, Camera } from "@/services/cameraService";
import { activityService } from "@/services/activityService";
import LiveFeed from "@/components/dashboard/LiveFeed";
import Minimap from "@/components/dashboard/Minimap";
import ProductivityChart from "@/components/dashboard/ProductivityChart"; // Will replace later
import SnapshotModal from "@/components/dashboard/SnapshotModal";
import CameraSelector from "@/components/dashboard/CameraSelector";
import HorizontalTimeline from "@/components/dashboard/HorizontalTimeline";
import SystemLog from "@/components/dashboard/SystemLog";
import { Eye, EyeOff, Activity, Shield, LogOut, Settings, Cpu } from "lucide-react";

export default function Dashboard() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const { activeCameraId, showTrails, toggleTrails, isPrivacyMode, setPrivacyMode, alerts } = useDashboardStore();
    const { isConnected, frame, detections } = useSocket(activeCameraId);
    const trails = useTrails(detections);
    const [selectedAlert, setSelectedAlert] = useState<any | null>(null);

    // Initial data
    const [initialCameras, setInitialCameras] = useState<Camera[]>([]);
    const [initialChartData, setInitialChartData] = useState<any[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const camerasData = await cameraService.getCameras();
                if (camerasData.success) {
                    setInitialCameras(camerasData.data);
                    useDashboardStore.getState().setCameras(camerasData.data);
                }
                const statsData = await activityService.getActivityStats();
                if (statsData.success && statsData.data.activityStats) {
                    const chartData = statsData.data.activityStats.map((stat: any) => ({
                        name: stat.action,
                        value: stat._sum.duration || 0
                    }));
                    setInitialChartData(chartData);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    const activeCamera = useDashboardStore((state) =>
        state.cameras.find(c => c.id === state.activeCameraId) || initialCameras.find(c => c.id === state.activeCameraId)
    );

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <main className="h-screen w-full bg-base-950 text-foreground overflow-hidden flex flex-col font-sans select-none">
            {/* 
              HEADER: STATUS STRIP 
              No decoration, pure utility.
            */}
            <header className="h-12 shrink-0 border-b border-base-800 bg-base-950 flex items-center justify-between px-4 z-50">
                {/* Left: Identity & Primary Context */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 bg-foreground/10 rounded-[1px] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-foreground rounded-[0.5px]" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight text-foreground">OPTIVISION</span>
                    </div>

                    <div className="h-4 w-px bg-base-800" />

                    <div className="flex items-center">
                        <CameraSelector initialCameras={initialCameras} />
                    </div>
                </div>

                {/* Right: System Status & Controls */}
                <div className="flex items-center gap-6">
                    {/* System Metrics (Ambient) */}
                    <div className="group flex items-center gap-2 cursor-help" title="System Latency: 42ms | FPS: 30">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`} />
                        <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider group-hover:text-foreground transition-colors">
                            {isConnected ? "Connected" : "Offline"}
                        </span>
                    </div>

                    <div className="h-4 w-px bg-base-800" />

                    {/* Operational Toggles - Icon Based, Latched */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleTrails}
                            className={`p-2 rounded-[2px] transition-all ${showTrails
                                ? 'bg-base-800 text-accent'
                                : 'text-foreground-muted hover:text-foreground hover:bg-base-900'
                                }`}
                            title="Toggle Motion Trails"
                        >
                            <Activity className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setPrivacyMode(!isPrivacyMode)}
                            className={`p-2 rounded-[2px] transition-all ${isPrivacyMode
                                ? 'bg-base-800 text-warning'
                                : 'text-foreground-muted hover:text-foreground hover:bg-base-900'
                                }`}
                            title="Toggle Privacy Mask"
                        >
                            {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="h-4 w-px bg-base-800" />

                    {/* Minimal User Menu */}
                    <div className="flex items-center gap-4">
                        <button
                            className="text-foreground-muted hover:text-foreground transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-foreground-muted hover:text-danger transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </header>

            {/* MAIN WORKSPACE GRID */}
            <div className="flex-1 flex overflow-hidden">

                {/* PRIMARY VIEWPORT: Video & Timeline */}
                <div className="flex-1 flex flex-col min-w-0 bg-base-900/50">

                    {/* Video Canvas */}
                    <div className="flex-1 relative bg-[#050505] flex items-center justify-center overflow-hidden border-b border-base-800">
                        {/* Subtle corner markers for "Canvas" feel */}
                        <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-base-700 opacity-50" />
                        <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-base-700 opacity-50" />
                        <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-base-700 opacity-50" />
                        <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-base-700 opacity-50" />

                        <LiveFeed
                            frame={frame}
                            detections={detections}
                            showTrails={showTrails}
                            isPrivacyMode={isPrivacyMode}
                            trails={trails}
                        />
                    </div>

                    {/* Timeline Interaction Area */}
                    <div className="h-40 shrink-0 bg-base-950 border-r border-base-800 flex flex-col relative z-20">
                        {/* Header strictly for scale context */}
                        <div className="absolute top-0 left-0 px-2 py-1 bg-base-950/80 backdrop-blur text-[9px] font-mono text-foreground-muted z-10 border-b border-r border-base-800 rounded-br-sm">
                            T_DOMAIN: REALTIME
                        </div>

                        <HorizontalTimeline
                            alerts={alerts}
                            onAlertClick={setSelectedAlert}
                        />
                    </div>
                </div>

                {/* INSTRUMENT SIDEBAR */}
                <aside className="w-80 shrink-0 bg-base-950 border-l border-base-800 flex flex-col">

                    {/* Widget: Minimap */}
                    <div className="flex flex-col border-b border-base-800">
                        <div className="px-3 py-2 bg-base-950 flex items-center gap-2">
                            <div className="p-0.5 rounded-[1px] bg-base-900 border border-base-800">
                                <Cpu className="w-3 h-3 text-foreground-muted" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Spatial Awareness</span>
                        </div>
                        <div className="aspect-video w-full bg-[#050505] relative overflow-hidden group">
                            {/* Minimap to be refactored for flat SVG feel */}
                            <Minimap
                                detections={detections}
                                calibrationData={activeCamera?.calibrationData}
                            />
                        </div>
                    </div>

                    {/* Widget: Performance (To be replaced with non-chart metrics) */}
                    <div className="flex-1 flex flex-col min-h-0 border-b border-base-800">
                        <div className="px-3 py-2 bg-base-950 flex items-center gap-2 border-b border-base-800/50">
                            <Activity className="w-3 h-3 text-foreground-muted" />
                            <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">Productivity Indexes</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            {/* Placeholder for new linear metrics component */}
                            <ProductivityChart initialData={initialChartData} />
                        </div>
                    </div>

                    {/* Widget: System Log */}
                    <div className="h-1/3 flex flex-col bg-base-950">
                        <div className="px-3 py-2 border-y border-base-800 flex items-center justify-between bg-base-900/30">
                            <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">System Event Log</span>
                            <span className="text-[9px] font-mono text-accent">LIVE</span>
                        </div>
                        <SystemLog />
                    </div>

                </aside>
            </div>

            {/* Modal Layer */}
            <SnapshotModal
                alert={selectedAlert}
                onClose={() => setSelectedAlert(null)}
            />
        </main>
    );
}
