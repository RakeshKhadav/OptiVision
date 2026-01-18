"use client";
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Alert } from "@/types";

/**
 * ==============================================================================
 * INCIDENT TIMELINE — TEMPORAL INSTRUMENT (V3: High Performance)
 * ==============================================================================
 * Changes: 
 * - Pixel-based tick generation (prevents over-rendering)
 * - Optimized DOM structure
 * - Strict virtualization
 */

interface HorizontalTimelineProps {
    alerts: Alert[];
    onAlertClick: (alert: Alert) => void;
}

const LANE_CONFIG: Record<string, { lane: number; label: string }> = {
    "ZONE_INTRUSION": { lane: 0, label: "ZONE" },
    "IDLE_WORKER": { lane: 1, label: "IDLE" },
    "PPE_VIOLATION": { lane: 2, label: "PPE" },
    "SAFETY_ALERT": { lane: 3, label: "SAFETY" },
    "DEFAULT": { lane: 4, label: "OTHER" },
};

const SEVERITY_COLORS = {
    HIGH: { fill: "#dc2626", edge: "#ef4444" },
    MEDIUM: { fill: "#d97706", edge: "#f59e0b" },
    NORMAL: { fill: "#2563eb", edge: "#3b82f6" },
    RESOLVED: { fill: "#3f3f46", edge: "#52525b" },
};

const LANE_COLORS = ["rgba(99, 102, 241, 0.08)", "rgba(168, 85, 247, 0.08)", "rgba(6, 182, 212, 0.08)", "rgba(16, 185, 129, 0.06)", "rgba(107, 114, 128, 0.05)"];
const LANE_HEIGHT = 28;
const LANE_GAP = 2;
const MIN_TICK_SPACING_PX = 80; // Minimum pixels between ticks to prevent clutter

export default function HorizontalTimeline({ alerts, onAlertClick }: HorizontalTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(800);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState(0);
    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [cursorX, setCursorX] = useState<number | null>(null);
    const [playheadTime, setPlayheadTime] = useState<number | null>(null);

    // Measure container
    useEffect(() => {
        if (!containerRef.current) return;
        setContainerWidth(containerRef.current.offsetWidth);

        const observer = new ResizeObserver(entries => {
            if (entries[0]) setContainerWidth(entries[0].contentRect.width);
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 1. Stable Data Processing
    // Calculate time range based on data, but ensure a sensible minimum window
    const { processedAlerts, timeRange } = useMemo(() => {
        const sorted = (alerts ?? []).map(a => ({
            ...a,
            timestamp: new Date(a.createdAt).getTime(),
            lane: LANE_CONFIG[a.type]?.lane ?? LANE_CONFIG.DEFAULT.lane,
            // Visual props pre-calculated
            color: a.isResolved ? SEVERITY_COLORS.RESOLVED : (SEVERITY_COLORS[a.severity as keyof typeof SEVERITY_COLORS] || SEVERITY_COLORS.NORMAL),
            width: 40 + (a.id * 13) % 40 // Deterministic visual width
        })).sort((a, b) => a.timestamp - b.timestamp);

        if (sorted.length === 0) {
            const now = Date.now();
            return { processedAlerts: [], timeRange: { start: now - 3600000, end: now, span: 3600000 } };
        }

        const stats = sorted.reduce((acc, curr) => ({
            min: Math.min(acc.min, curr.timestamp),
            max: Math.max(acc.max, curr.timestamp)
        }), { min: Infinity, max: -Infinity });

        // Ensure at least 1-hour window if points are close
        const minSpan = 3600000;
        let start = stats.min;
        let end = stats.max;
        if (end - start < minSpan) {
            const diff = minSpan - (end - start);
            start -= diff / 2;
            end += diff / 2;
        }

        // Add 10% padding
        const span = end - start;
        return {
            processedAlerts: sorted,
            timeRange: {
                start: start - span * 0.1,
                end: end + span * 0.1,
                span: span * 1.2
            }
        };
    }, [alerts]);

    // 2. Active Lanes
    const activeLanes = useMemo(() => {
        const lanes = new Set(processedAlerts.map(a => a.lane));
        return Array.from(lanes).sort();
    }, [processedAlerts]);

    const totalHeight = Math.max(3, activeLanes.length) * (LANE_HEIGHT + LANE_GAP);
    const virtualTotalWidth = containerWidth * zoomLevel;

    // 3. Coordinate Systems
    const timeToX = useCallback((t: number) => {
        return ((t - timeRange.start) / timeRange.span) * virtualTotalWidth + panOffset;
    }, [timeRange, virtualTotalWidth, panOffset]);

    const xToTime = useCallback((x: number) => {
        return timeRange.start + ((x - panOffset) / virtualTotalWidth) * timeRange.span;
    }, [timeRange, virtualTotalWidth, panOffset]);

    // 4. Optimized Tick Generation (The Fix)
    const ticks = useMemo(() => {
        // Calculate milliseconds per pixel
        const msPerPixel = timeRange.span / virtualTotalWidth;
        const minMsSpacing = MIN_TICK_SPACING_PX * msPerPixel;

        // Find standard interval that fits > MIN_TICK_SPACING_PX
        // Available steps: 1s, 5s, 15s, 30s, 1m, 5m, 15m, 30m, 1h, ...
        const steps = [
            1000, 5000, 15000, 30000,
            60000, 300000, 900000, 1800000,
            3600000, 10800000, 21600000, 43200000, 86400000
        ];

        let interval = steps[0];
        for (const step of steps) {
            if (step >= minMsSpacing) {
                interval = step;
                break;
            }
        }
        // Fallback for huge ranges
        if (interval < minMsSpacing) interval = Math.ceil(minMsSpacing / 3600000) * 3600000;

        // Generate visible ticks only
        const visibleStartMs = xToTime(0);
        const visibleEndMs = xToTime(containerWidth);

        // Align to interval
        const startTick = Math.ceil(visibleStartMs / interval) * interval;
        const endTick = Math.floor(visibleEndMs / interval) * interval;

        const generated = [];
        // Safety cap: max 50 ticks to prevent loop freeze
        let count = 0;
        for (let t = startTick; t <= endTick; t += interval) {
            if (count++ > 50) break;
            generated.push({ time: t, x: timeToX(t), major: true });
        }
        return generated;

    }, [timeRange, virtualTotalWidth, xToTime, timeToX, containerWidth]);

    // 5. Renderable Bars (Memoized & Virtualized)
    const renderBars = useMemo(() => {
        return processedAlerts
            .map(a => {
                const x = timeToX(a.timestamp);
                // Simple Viewport Culling
                if (x + a.width < 0 || x > containerWidth) return null;

                const laneIdx = activeLanes.indexOf(a.lane);
                const y = laneIdx * (LANE_HEIGHT + LANE_GAP) + LANE_GAP;
                return { ...a, x, y };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
    }, [processedAlerts, timeToX, activeLanes, containerWidth]);


    // Handlers
    const handleWheel = (e: React.WheelEvent) => {
        // Native event listener not needed if we keep it simple
        // Using native handling via ref effect to avoid passive issue if needed, 
        // but React 18 usually handles this. If error persists, we use passive: false ref.
    };

    // Use ref for wheel to ensure non-passive
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.ctrlKey || e.metaKey) {
                const delta = -e.deltaY * 0.001;
                setZoomLevel(z => Math.max(0.1, Math.min(20, z + delta * z)));
            } else {
                setPanOffset(p => p - e.deltaY);
            }
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        setCursorX(x);
        setPlayheadTime(xToTime(x));

        if (isDragging) {
            const delta = e.clientX - rect.left - dragStart;
            // setDragStart inside effect/up would be better but simplified here:
            // Actually panning logic usually needs state delta. 
            // Simplified: Pan is absolute offset.
            setPanOffset(prev => prev + (e.movementX));
        }
    }

    return (
        <div className="w-full h-full flex flex-col bg-transparent text-white/60 select-none overflow-hidden font-mono text-[10px]">
            {/* Header */}
            <div className="h-6 flex items-center justify-between px-3 border-b border-white/10 bg-white/5">
                <div className="flex gap-4">
                    <span className="text-white/80 font-bold tracking-wider">TRACE_LOG</span>
                    <span className="text-white/60">{processedAlerts.length} EVENTS</span>
                    <span className="text-white/60">x{zoomLevel.toFixed(2)}</span>
                    <span className="text-white/60">{(timeRange.span / 3600000).toFixed(1)}h SPAN</span>
                </div>
                <button onClick={() => { setPanOffset(0); setZoomLevel(1); }} className="hover:text-white transition-colors">RESET</button>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Visual Grid Container */}
                <div
                    ref={containerRef}
                    className="flex-1 relative cursor-crosshair active:cursor-grabbing"
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => { setIsDragging(false); setCursorX(null); }}
                    onMouseMove={handleMouseMove}
                >
                    {/* Tick Grid (Underlay) */}
                    {ticks.map(tick => (
                        <div
                            key={tick.time}
                            className="absolute top-0 bottom-0 border-l border-white/10 pointer-events-none"
                            style={{ left: tick.x }}
                        >
                            <span className="absolute top-full mt-1 left-1 text-[9px] text-zinc-600 whitespace-nowrap">
                                {new Date(tick.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {/* Lane Rows */}
                    {activeLanes.map((lane, i) => (
                        <div
                            key={lane}
                            className="absolute left-0 right-0 border-b border-white/5 flex items-center"
                            style={{
                                top: i * (LANE_HEIGHT + LANE_GAP) + LANE_GAP,
                                height: LANE_HEIGHT,
                                backgroundColor: LANE_COLORS[i % LANE_COLORS.length]
                            }}
                        >
                            {/* Sticky Lane Label */}
                            <div className="sticky left-0 w-12 text-right pr-2 text-[9px] font-bold opacity-40 shrink-0 z-10">
                                {Object.values(LANE_CONFIG).find(c => c.lane === lane)?.label || "RAW"}
                            </div>
                        </div>
                    ))}

                    {/* Bars */}
                    {renderBars.map(bar => (
                        <div
                            key={bar.id}
                            onClick={(e) => { e.stopPropagation(); onAlertClick(bar); }}
                            className="absolute h-5 rounded-[2px] cursor-pointer hover:brightness-125 hover:scale-[1.02] transition-all group z-20 flex items-center px-1.5 overflow-hidden"
                            style={{
                                left: bar.x,
                                top: bar.y + 4, // Center in lane
                                width: Math.max(6, bar.width),
                                backgroundColor: bar.color.fill,
                                boxShadow: `inset 0 1px 0 ${bar.color.edge}, 0 2px 4px rgba(0,0,0,0.3)`
                            }}
                        >
                            {/* Bar Label - Only show if width > 30px */}
                            {bar.width > 30 && (
                                <span className="text-[9px] font-bold text-white/90 truncate uppercase tracking-tight mix-blend-screen select-none">
                                    {bar.type.replace(/_/g, " ")} <span className="opacity-50 font-normal">#{bar.id}</span>
                                </span>
                            )}

                            {/* Hover Tooltip - Quick Implementation */}
                            <div className="hidden group-hover:block absolute bottom-full mb-2 left-0 min-w-[120px] bg-zinc-900 border border-zinc-700 p-2 rounded shadow-xl z-50 pointer-events-none">
                                <div className="text-white font-bold">{bar.type}</div>
                                <div className="text-zinc-400 text-[9px]">{new Date(bar.timestamp).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}

                    {/* Playhead */}
                    {cursorX !== null && (
                        <div className="absolute top-0 bottom-0 w-px bg-cyan-500/50 pointer-events-none z-30" style={{ left: cursorX }}>
                            <div className="absolute top-0 -translate-x-1/2 bg-cyan-900/90 text-cyan-200 px-1 rounded text-[9px] border border-cyan-500/30">
                                {playheadTime && new Date(playheadTime).toLocaleTimeString()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
