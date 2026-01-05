"use client";
import { useEffect, useState, useRef } from "react";
import { applyHomography, computeHomography } from "@/lib/homography";

interface MinimapProps {
    detections: any[];
    calibrationData?: {
        video: number[][];
        map: number[][];
    };
}

export default function Minimap({ detections, calibrationData }: MinimapProps) {
    const [homographyMatrix, setHomographyMatrix] = useState<number[] | null>(null);

    // Calculate matrix when calibration data changes
    useEffect(() => {
        if (calibrationData && calibrationData.video && calibrationData.map) {
            const H = computeHomography(calibrationData.video, calibrationData.map);
            setHomographyMatrix(H);
        } else {
             // Default / Identity-ish backup if no calibration
             // (Assuming 1280x720 video maps roughly to 800x600 map for demo)
             setHomographyMatrix(null);
        }
    }, [calibrationData]);

    return (
        <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
             {/* Floor Plan SVG Background */}
            <img 
                src="/floorplan-base.svg" 
                alt="Floor Plan" 
                className="absolute inset-0 w-full h-full object-cover opacity-50"
            />

            {/* Mapped Detections Layer */}
            <div className="absolute inset-0 w-full h-full">
                {detections.map((det) => {
                    let mx = 0, my = 0;

                    if (homographyMatrix) {
                        // Use Homography
                        const pt = applyHomography(homographyMatrix, det.x + det.width/2, det.y + det.height);
                        // Scale to % of container (assuming map coords are 0-800, 0-600)
                        mx = (pt.x / 800) * 100;
                        my = (pt.y / 600) * 100;
                    } else {
                        // Fallback: Simple Linear Mapping (Video 1280x720 -> Map 100%x100%)
                        mx = ((det.x + det.width/2) / 1280) * 100;
                        my = ((det.y + det.height) / 720) * 100;
                    }

                    // Clamp to view
                    mx = Math.max(0, Math.min(100, mx));
                    my = Math.max(0, Math.min(100, my));

                    return (
                        <div 
                            key={det.workerId || Math.random()}
                            className="absolute w-3 h-3 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            style={{ 
                                left: `${mx}%`, 
                                top: `${my}%`,
                                backgroundColor: det.label === 'Forklift' ? '#ffaa00' : '#00f3ff'
                            }}
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] bg-black/80 px-1 rounded text-white whitespace-nowrap">
                                {det.workerId || det.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="absolute bottom-2 right-2 text-[10px] text-slate-500 bg-black/50 px-2 py-1 rounded">
                Digital Twin v1.0
            </div>
        </div>
    );
}
