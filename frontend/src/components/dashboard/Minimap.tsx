"use client";
import { useMemo } from "react";
import { applyHomography, computeHomography } from "@/lib/homography";
import { CalibrationData, Detection } from "@/types";

interface MinimapProps {
    detections: Detection[]; // Use strict type or any[] if Detection is too strict
    calibrationData?: CalibrationData;
}

export default function Minimap({ detections, calibrationData }: MinimapProps) {
    const homographyMatrix = useMemo(() => {
        if (calibrationData && calibrationData.video && calibrationData.map) {
            return computeHomography(calibrationData.video, calibrationData.map);
        }
        return null;
    }, [calibrationData]);

    return (
        <div className="relative w-full h-full">
            {/* 
              FLOOR PLAN SVG
              High-fidelity, themed technical drawing.
            */}
            <div className="absolute inset-0 z-0 flex items-center justify-center p-4">
                <img
                    src="/warehouse_minimap.svg"
                    alt="Warehouse Floor Plan"
                    className="max-w-full max-h-full opacity-60 select-none"
                    draggable={false}
                />
            </div>

            {/* Mapped Detections - Pure geometry keys */}
            <div className="absolute inset-0 z-10 m-4">
                {detections.map((det) => {
                    let mx = 0, my = 0;

                    // Priority 1: AI-provided 1:1 coordinates
                    if (typeof det.minimapX === 'number' && typeof det.minimapY === 'number') {
                        mx = det.minimapX;
                        my = det.minimapY;
                    }
                    // Priority 2: Client-side homography (legacy/fallback)
                    else if (homographyMatrix) {
                        const pt = applyHomography(homographyMatrix, det.x + det.width / 2, det.y + det.height);
                        mx = (pt.x / 800) * 100;
                        my = (pt.y / 600) * 100;
                    }
                    // Priority 3: Crude Fallback
                    else {
                        mx = ((det.x + det.width / 2) / 1280) * 100;
                        my = ((det.y + det.height) / 720) * 100;
                    }
                    mx = Math.max(0, Math.min(100, mx));
                    my = Math.max(0, Math.min(100, my));

                    const isMachinery = det.label === 'Forklift';

                    return (
                        <div
                            key={det.workerId || Math.random()}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-linear"
                            style={{ left: `${mx}%`, top: `${my}%` }}
                        >
                            {/* Pulse effect for visibility */}
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isMachinery ? 'bg-warning' : 'bg-accent'}`} />

                            {/* Core Dot */}
                            <div className={`
                                shadow-[0_0_0_1px_rgba(0,0,0,1)] 
                                ${isMachinery ? 'w-2 h-2 bg-warning rounded-sm' : 'w-1.5 h-1.5 bg-white rounded-full'}
                            `} />
                        </div>
                    );
                })}
            </div>

            {/* Scale Marker (Decorative Engineering Touch) */}
            <div className="absolute bottom-2 right-2 border-b border-r border-foreground-muted/30 w-4 h-4" />
            <div className="absolute top-2 left-2 border-t border-l border-foreground-muted/30 w-4 h-4" />
        </div>
    );
}
