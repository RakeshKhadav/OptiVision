"use client";
import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useDashboardStore } from "@/store/useDashboardStore";
import CalibrationTool from "@/components/settings/CalibrationTool";
import ZoneEditor from "@/components/settings/ZoneEditor";
import CameraSelector from "@/components/dashboard/CameraSelector";

export default function Settings() {
    const { activeCameraId } = useDashboardStore();
    const { isConnected, frame } = useSocket(activeCameraId);
    // Get calibration data from the active camera in the store
    const activeCamera = useDashboardStore((state) =>
        state.cameras.find(c => c.id === activeCameraId)
    );
    const calibrationData = activeCamera?.calibrationData;

    const [activeTab, setActiveTab] = useState<"CALIBRATION" | "ZONES">("CALIBRATION");

    if (!activeCameraId) {
        return (
            <main className="min-h-screen bg-slate-950 p-6 text-white flex flex-col items-center justify-center">
                <p className="text-slate-400 mb-4">No camera selected or available.</p>
                <div className="w-64">
                    <CameraSelector initialCameras={[]} />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 p-6 text-white font-sans">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        System <span className="text-cyan-500">Configuration</span>
                    </h1>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-red-500/10 border-red-500/50 text-red-500'} text-[10px] font-bold uppercase tracking-wider`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? "Camera Feed Active" : "Camera Feed Offline"}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <CameraSelector initialCameras={[]} />
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl min-h-[80vh] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab("CALIBRATION")}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === "CALIBRATION" ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}
                    >
                        Camera Calibration
                    </button>
                    <button
                        onClick={() => setActiveTab("ZONES")}
                        className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === "ZONES" ? "text-cyan-400 border-b-2 border-cyan-400 bg-slate-800/50" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}
                    >
                        Zone Management
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1">
                    {activeTab === "CALIBRATION" && (
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white mb-2">Digital Twin Calibration</h2>
                                <p className="text-sm text-slate-400">
                                    Map the camera's perspective to the top-down floor plan. This enables accurate positioning of workers on the Minimap.
                                </p>
                            </div>
                            <CalibrationTool
                                cameraId={activeCameraId}
                                frame={frame}
                                existingCalibration={calibrationData}
                            />
                        </div>
                    )}

                    {activeTab === "ZONES" && (
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6">
                                <h2 className="text-xl font-bold text-white mb-2">Security Zones</h2>
                                <p className="text-sm text-slate-400">
                                    Define areas of interest within the camera's view. These zones will trigger specific alerts when entered.
                                </p>
                            </div>
                            <ZoneEditor
                                cameraId={activeCameraId}
                                frame={frame}
                            />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}