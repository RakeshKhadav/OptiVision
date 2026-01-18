"use client";
import { useRef, useEffect, useState, memo } from "react";
import { X, ShieldAlert, Crosshair } from "lucide-react";
import { Detection } from "@/types";

interface LiveFeedProps {
    frame: string;
    detections: Detection[];
    showTrails?: boolean;
    isPrivacyMode?: boolean;
    trails?: Record<string, { x: number; y: number }[]>;
}

// Use memo to prevent unnecessary re-renders from parent
const LiveFeed = memo(function LiveFeed({ frame, detections, showTrails, isPrivacyMode, trails }: LiveFeedProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const [zonePoints, setZonePoints] = useState<{ x: number, y: number }[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const hoveredDetectionRef = useRef<string | null>(null);
    const detectionsRef = useRef<Detection[]>(detections);

    // Keep detections ref updated for mouse move handler
    detectionsRef.current = detections;

    // Update image source directly via ref - bypasses React reconciliation
    useEffect(() => {
        if (imgRef.current && frame) {
            imgRef.current.src = `data:image/jpeg;base64,${frame}`;
        }
    }, [frame]);

    // Coordinate conversion helper
    const getCanvasCoords = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        const scaleX = 1280 / rect.width;
        const scaleY = 720 / rect.height;
        return { x: x * scaleX, y: y * scaleY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getCanvasCoords(e);
        const dets = detectionsRef.current;

        let found = null;
        for (const det of dets) {
            if (x >= det.x && x <= det.x + det.width && y >= det.y && y <= det.y + det.height) {
                found = det.workerId || `${det.label}-${det.x}`;
                break;
            }
        }
        hoveredDetectionRef.current = found;
    };

    const handleCheckClick = (e: React.MouseEvent) => {
        if (!isDrawing || zonePoints.length >= 4) return;
        const { x, y } = getCanvasCoords(e);
        setZonePoints([...zonePoints, { x, y }]);
    };

    const resetZone = () => {
        setZonePoints([]);
        setIsDrawing(true);
    };

    // Canvas drawing with requestAnimationFrame for smooth updates
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Live Trails
            if (showTrails && trails) {
                ctx.save();
                Object.values(trails).forEach((path) => {
                    if (path.length < 2) return;
                    ctx.beginPath();
                    ctx.moveTo(path[0].x, path[0].y);
                    for (let i = 1; i < path.length; i++) {
                        ctx.lineTo(path[i].x, path[i].y);
                    }
                    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 4]);
                    ctx.stroke();
                });
                ctx.restore();
            }

            // 2. Draw Zone Polygon
            if (zonePoints.length > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(zonePoints[0].x, zonePoints[0].y);
                for (let i = 1; i < zonePoints.length; i++) {
                    ctx.lineTo(zonePoints[i].x, zonePoints[i].y);
                }
                if (zonePoints.length === 4) {
                    ctx.closePath();
                    ctx.fillStyle = isDrawing ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.02)";
                    ctx.fill();
                }
                ctx.strokeStyle = "#f59e0b";
                ctx.lineWidth = 1;
                ctx.stroke();

                zonePoints.forEach((p) => {
                    ctx.fillStyle = "#f59e0b";
                    ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
                });
                ctx.restore();
            }

            // 3. Draw Detections
            const hoveredDetection = hoveredDetectionRef.current;
            detections.forEach((box) => {
                const isHovered = (box.workerId || `${box.label}-${box.x}`) === hoveredDetection;
                const isMachinery = box.label === "Forklift";
                const baseColor = isMachinery ? "#f59e0b" : "#e4e4e7";

                const scale = isHovered ? 1.02 : 1;
                const w = box.width * scale;
                const h = box.height * scale;
                const x = box.x - (w - box.width) / 2;
                const y = box.y - (h - box.height) / 2;

                ctx.save();
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = isHovered ? 2 : Math.max(0.5, box.confidence * 1.5);

                ctx.strokeRect(x, y, w, h);

                if (box.confidence > 0.8) {
                    const len = Math.min(w, h) * 0.2;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
                    ctx.moveTo(x + w - len, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + len);
                    ctx.moveTo(x + w, y + h - len); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - len, y + h);
                    ctx.moveTo(x + len, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - len);
                    ctx.stroke();
                }

                if (isHovered || box.confidence > 0.9) {
                    const label = `${box.label.toUpperCase()} [${(box.confidence * 100).toFixed(1)}%]`;
                    ctx.font = "500 11px 'JetBrains Mono'";
                    const tm = ctx.measureText(label);

                    ctx.fillStyle = baseColor;
                    ctx.fillRect(x, y - 16, tm.width + 8, 16);

                    ctx.fillStyle = "#09090b";
                    ctx.fillText(label, x + 4, y - 4);
                }
                ctx.restore();
            });
        };

        // Draw once immediately
        draw();

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [detections, showTrails, trails, zonePoints, isDrawing]);

    return (
        <div className="relative w-full h-full bg-transparent group overflow-hidden select-none">

            {/* Top Right Controls */}
            <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                <button
                    onClick={() => setIsDrawing(!isDrawing)}
                    className={`
                        p-2 rounded-sm border transition-all duration-200
                        ${isDrawing
                            ? 'bg-foreground text-base-950 border-foreground shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                            : 'bg-base-900/90 border-base-700 text-foreground-muted hover:text-foreground hover:border-base-600'
                        }
                    `}
                    title="Define Exclusion Zone"
                >
                    <Crosshair className="w-4 h-4" />
                </button>

                {isDrawing && zonePoints.length > 0 && (
                    <button
                        onClick={resetZone}
                        className="p-2 rounded-sm bg-danger/10 border border-danger/50 text-danger hover:bg-danger/20 transition-colors"
                        title="Clear Zone Points"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Interaction Layer */}
            <div
                className={`absolute inset-0 z-10 ${isDrawing ? 'cursor-crosshair' : 'cursor-default'}`}
                onMouseMove={handleMouseMove}
                onClick={handleCheckClick}
            >
                {/* Video Frame - using ref for direct DOM updates */}
                <img
                    ref={imgRef}
                    className="w-full h-full object-contain pointer-events-none opacity-90"
                    alt="Live Feed"
                    style={{ display: frame ? 'block' : 'none' }}
                />
            </div>

            {/* Canvas Overlay for Graphics */}
            <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                className="absolute inset-0 w-full h-full pointer-events-none z-20 mix-blend-screen"
            />

            {/* Privacy Shield */}
            {isPrivacyMode && (
                <div className="absolute inset-0 z-40 bg-base-950/95 flex flex-col items-center justify-center backdrop-blur-sm">
                    <ShieldAlert className="w-12 h-12 text-base-700 mb-4" />
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-foreground-muted tracking-widest uppercase">Privacy Shield Active</span>
                        <span className="text-[10px] font-mono text-base-700">VIDEO_FEED_OBSCURED</span>
                    </div>
                </div>
            )}

            {/* Empty State / Loading */}
            {!frame && !isPrivacyMode && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-foreground-muted rounded-full" />
                        <span className="text-[10px] font-mono text-foreground-muted uppercase">Waiting for Stream...</span>
                    </div>
                </div>
            )}
        </div>
    );
});

export default LiveFeed;