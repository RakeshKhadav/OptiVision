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
              Ideally this is a clean SVG. Using the image for now but applying filters 
              to make it look like a CAD drawing.
            */}
            <div className="absolute inset-0 z-0 flex items-center justify-center p-4">
                <img
                    src="/floorplan-base.svg"
                    alt="Floor Plan"
                    className="max-w-full max-h-full opacity-40 grayscale invert brightness-150 contrast-125 select-none"
                />
            </div>

            {/* Mapped Detections - Pure geometry keys */}
            <div className="absolute inset-0 z-10 m-4">
                {detections.map((det) => {
                    let mx = 0, my = 0;
                    if (homographyMatrix) {
                        const pt = applyHomography(homographyMatrix, det.x + det.width / 2, det.y + det.height);
                        mx = (pt.x / 800) * 100;
                        my = (pt.y / 600) * 100;
                    } else {
                        // Crude Fallback for dev
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
