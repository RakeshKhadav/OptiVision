"use client";
import { useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Camera as CameraIcon, ChevronDown } from "lucide-react";
import { Camera } from "@/types";

interface CameraSelectorProps {
    initialCameras: Camera[];
}

export default function CameraSelector({ initialCameras }: CameraSelectorProps) {
    const { cameras, setCameras, activeCameraId, setActiveCamera } = useDashboardStore();

    // Sync initial data with store on mount
    useEffect(() => {
        if (initialCameras.length > 0 && cameras.length === 0) {
            setCameras(initialCameras);
        }
    }, [initialCameras, cameras.length, setCameras]);

    const activeCamera = cameras.find(c => c.id === activeCameraId);

    return (
        <div className="relative group">
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-lg px-4 py-2 cursor-pointer hover:bg-slate-800 transition-all">
                <CameraIcon className="w-4 h-4 text-cyan-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Active Source</span>
                    <span className="text-sm font-semibold text-white leading-none">
                        {activeCamera ? activeCamera.name : "Select Camera..."}
                    </span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 ml-2" />
            </div>

            {/* Dropdown */}
            <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-slate-800 rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                {cameras.map((camera) => (
                    <div
                        key={camera.id}
                        onClick={() => setActiveCamera(camera.id)}
                        className={`px-4 py-3 text-sm cursor-pointer hover:bg-slate-800 transition-colors flex items-center justify-between ${camera.id === activeCameraId ? "text-cyan-400 bg-slate-800/50" : "text-slate-300"}`}
                    >
                        {camera.name}
                        {camera.status === "ONLINE" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                        )}
                    </div>
                ))}
                {cameras.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-500 italic">No cameras found</div>
                )}
            </div>
        </div>
    );
}
