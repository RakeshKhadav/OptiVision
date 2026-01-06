"use client";
import { useRef, useEffect } from "react";

interface Detection {
    workerId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    confidence: number;
}

interface LiveFeedProps {
    frame: string;
    detections: Detection[];
    showTrails?: boolean;
    isPrivacyMode?: boolean;
    trails?: Record<string, { x: number; y: number }[]>;
}

export default function LiveFeed({ frame, detections, showTrails, isPrivacyMode, trails }: LiveFeedProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear previous frame
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Live Trails (if enabled)
        if (showTrails && trails) {
            Object.values(trails).forEach((path) => {
                if (path.length < 2) return;

                ctx.beginPath();
                ctx.moveTo(path[0].x, path[0].y);

                for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                }

                ctx.strokeStyle = "rgba(0, 243, 255, 0.5)";
                ctx.lineWidth = 2;
                ctx.stroke();
            });
        }

        // 2. Draw YOLO Bounding Boxes
        detections.forEach((box) => {
            // Color based on label
            ctx.strokeStyle = box.label === "Forklift" ? "#ffaa00" : "#00f3ff";
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);

            // Label background
            ctx.fillStyle = box.label === "Forklift" ? "#ffaa00" : "#00f3ff";
            const label = `${box.label} ${Math.round(box.confidence * 100)}%`;
            const textWidth = ctx.measureText(label).width;
            ctx.fillRect(box.x, box.y - 20, textWidth + 10, 20);

            // Label text
            ctx.fillStyle = "#000000";
            ctx.font = "12px Inter, sans-serif";
            ctx.fillText(label, box.x + 5, box.y - 5);
        });
    }, [detections, showTrails, trails]);

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {/* The AI Video Frame */}
            {frame && (
                <img
                    src={`data:image/jpeg;base64,${frame}`}
                    className="absolute inset-0 w-full h-full object-contain"
                    alt="Live Feed"
                />
            )}

            {/* The Bounding Box Layer */}
            <canvas
                ref={canvasRef}
                width={1280} // Match your YOLO input resolution
                height={720}
                className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Privacy Mode Overlay */}
            {isPrivacyMode && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center">
                    <div className="bg-amber-500/20 border border-amber-500/50 px-6 py-3 rounded-xl flex flex-col items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,1)]" />
                        <span className="text-amber-500 font-bold text-xs uppercase tracking-[0.2em]">Privacy Masking Active</span>
                        <p className="text-[10px] text-amber-500/70 font-medium">PII is being redacted at the edge</p>
                    </div>
                </div>
            )}
        </div>
    );
}