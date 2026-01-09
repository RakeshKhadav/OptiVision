"use client";
import { useState, useRef, useEffect } from "react";
import { cameraService } from "@/services/cameraService";

interface CalibrationToolProps {
    cameraId: number;
    frame: string;
    existingCalibration?: { video: number[][], map: number[][] };
    onSave?: () => void;
}

export default function CalibrationTool({ cameraId, frame, existingCalibration, onSave }: CalibrationToolProps) {
    const [step, setStep] = useState<"VIDEO" | "MAP">("VIDEO");
    const [videoPoints, setVideoPoints] = useState<number[][]>(existingCalibration?.video || []);
    const [mapPoints, setMapPoints] = useState<number[][]>(existingCalibration?.map || []);
    const [isSaving, setIsSaving] = useState(false);

    const mapRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLImageElement>(null);

    const handleVideoClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (step !== "VIDEO" || videoPoints.length >= 4) return;

        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate coordinate relative to the image's natural size (assuming 1280x720 for now or scaling)
        // Ideally we should scale based on rendered vs natural size.
        // For this MVP, let's assume we want coordinates relative to the 1280x720 frame.

        const scaleX = 1280 / rect.width;
        const scaleY = 720 / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setVideoPoints([...videoPoints, [x, y]]);
    };

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (step !== "MAP" || mapPoints.length >= 4) return;

        const rect = e.currentTarget.getBoundingClientRect();
        // Map is 800x600 in our SVG
        const scaleX = 800 / rect.width;
        const scaleY = 600 / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setMapPoints([...mapPoints, [x, y]]);
    };

    const saveCalibration = async () => {
        setIsSaving(true);
        try {
            await cameraService.updateCamera(cameraId, {
                calibrationData: {
                    video: videoPoints,
                    map: mapPoints
                }
            });
            alert("Calibration saved successfully!");
            if (onSave) onSave();
        } catch (error) {
            console.error("Failed to save calibration", error);
            alert("Failed to save calibration.");
        } finally {
            setIsSaving(false);
        }
    };

    const reset = () => {
        setVideoPoints([]);
        setMapPoints([]);
        setStep("VIDEO");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Camera Calibration (Homography)</h3>
                <div className="space-x-2">
                    <button onClick={reset} className="px-3 py-1 text-xs bg-slate-800 rounded hover:bg-slate-700">Reset</button>
                    <button
                        onClick={saveCalibration}
                        disabled={videoPoints.length !== 4 || mapPoints.length !== 4 || isSaving}
                        className="px-3 py-1 text-xs bg-cyan-600 rounded hover:bg-cyan-500 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Save Calibration"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Video Step */}
                <div className={`space-y-2 ${step === "VIDEO" ? "opacity-100" : "opacity-50"}`}>
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Step 1: Click 4 points on Video</span>
                        <span>{videoPoints.length}/4</span>
                    </div>
                    <div
                        className="relative aspect-video bg-black rounded border border-slate-700 cursor-crosshair overflow-hidden"
                        onClick={handleVideoClick}
                    >
                        {frame && (
                            <img
                                ref={videoRef}
                                src={`data:image/jpeg;base64,${frame}`}
                                className="w-full h-full object-contain pointer-events-none"
                            />
                        )}
                        {videoPoints.map((pt, i) => (
                            <div
                                key={i}
                                className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-bold"
                                style={{
                                    left: `${(pt[0] / 1280) * 100}%`,
                                    top: `${(pt[1] / 720) * 100}%`
                                }}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    {videoPoints.length === 4 && step === "VIDEO" && (
                        <button onClick={() => setStep("MAP")} className="w-full py-2 bg-blue-600 rounded text-xs">Next: Map Points &rarr;</button>
                    )}
                </div>

                {/* Map Step */}
                <div className={`space-y-2 ${step === "MAP" ? "opacity-100" : "opacity-50"}`}>
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Step 2: Click matching 4 points on Map</span>
                        <span>{mapPoints.length}/4</span>
                    </div>
                    <div
                        className="relative aspect-4/3 bg-slate-900 rounded border border-slate-700 cursor-crosshair overflow-hidden"
                        onClick={handleMapClick}
                    >
                        <img
                            ref={mapRef}
                            src="/floorplan-base.svg"
                            className="w-full h-full object-cover pointer-events-none"
                        />
                        {mapPoints.map((pt, i) => (
                            <div
                                key={i}
                                className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-bold"
                                style={{
                                    left: `${(pt[0] / 800) * 100}%`,
                                    top: `${(pt[1] / 600) * 100}%`
                                }}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
