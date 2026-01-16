"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Play } from "lucide-react";

import { Alert } from "@/types";

interface HorizontalTimelineProps {
    alerts: Alert[];
    onAlertClick: (alert: Alert) => void;
}

export default function HorizontalTimeline({ alerts, onAlertClick }: HorizontalTimelineProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState(1); // 1 = standard density
    const [scrollPos, setScrollPos] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [cursorX, setCursorX] = useState<number>(0);

    // Sort alerts by time
    const sortedAlerts = useMemo(() => {
        return [...alerts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [alerts]);

    // Calculate time range
    const timeRange = useMemo(() => {
        if (sortedAlerts.length === 0) return { start: Date.now() - 3600000, end: Date.now(), span: 3600000 };
        const start = new Date(sortedAlerts[0].createdAt).getTime();
        const end = Date.now(); // Always anchor to now
        const span = Math.max(end - start, 3600000);
        return { start: end - span - (span * 0.1), end: end + (span * 0.05), span: span * 1.15 };
    }, [sortedAlerts]);

    // Pixels per millisecond
    const pixelsPerMs = (1000 / timeRange.span) * zoomLevel;

    // Conversion Helpers
    const msToPx = (ms: number) => (ms - timeRange.start) * pixelsPerMs;
    const pxToMs = (px: number) => (px / pixelsPerMs) + timeRange.start;

    // Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setLastX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const relativeX = e.clientX - rect.left;
        setCursorX(relativeX);

        // Calculate hover time based on scroll and cursor position
        // Current View Start Time = timeRange.start + (scrollPos / pixelsPerMs)? 
        // Wait, scrollPos is transform translateX. 
        // Let's invert the logic: 
        // Canvas is infinite. translateX moves the viewport.
        // Actually, let's keep it simple: scrollPos modifies the render offset.
        // If we translate by scrollPos, then x=0 is visually at scrollPos.
        // It's cleaner to view scrollPos as "Viewport Offset". 
        // Let's assume scrollPos is negative (moving content left).

        const contentX = relativeX - scrollPos;
        setHoverTime(pxToMs(contentX));

        if (isDragging) {
            const delta = e.clientX - lastX;
            setScrollPos(prev => Math.min(0, prev + delta)); // Prevent scrolling into future empty space too much
            setLastX(e.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
            // Zoom centered on cursor? For now simple zoom.
            const delta = -e.deltaY * 0.001;
            const newZoom = Math.max(0.1, Math.min(50, zoomLevel + delta));
            // Todo: Center zoom.
            setZoomLevel(newZoom);
        } else {
            // Pan
            setScrollPos(prev => Math.min(0, prev - e.deltaY));
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-base-950 select-none border-t border-base-800">
            {/* Control Strip - Strictly Functional */}
            <div className="h-6 shrink-0 flex items-center justify-between px-2 bg-base-900 border-b border-base-800">
                <div className="flex items-center gap-4">
                    <span className="text-[9px] font-mono text-foreground-muted tracking-tight">
                        SPAN: {(timeRange.span / 60000).toFixed(0)}m
                    </span>
                    <div className="h-3 w-px bg-base-800"></div>
                    <span className="text-[9px] font-mono text-accent">
                        SCALE: x{zoomLevel.toFixed(1)}
                    </span>
                </div>

                <div className="flex items-center gap-0.5">
                    <button onClick={() => setZoomLevel(1)} className="px-2 py-0.5 text-[9px] uppercase hover:bg-base-800 text-foreground-muted">Reset</button>
                </div>
            </div>

            {/* Timeline Track */}
            <div
                ref={containerRef}
                className={`flex-1 relative overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-default'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { handleMouseUp(); setHoverTime(null); }}
                onWheel={handleWheel}
            >
                {/* Time Grid (Infinite) */}
                <div
                    className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none"
                    style={{ transform: `translateX(${scrollPos}px)` }}
                >
                    {/* Render Ticks - Optimized: Only render visible range? For now, render enough. */}
                    {/* Simplified for demo: Render 100 ticks covering the span */}
                    {Array.from({ length: 100 }).map((_, i) => {
                        const time = timeRange.start + (i * (timeRange.span / 100));
                        const px = msToPx(time);
                        const isHour = new Date(time).getMinutes() === 0;

                        return (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0 border-l border-base-800/50"
                                style={{ left: px, height: '100%' }}
                            >
                                {/* Tick Head */}
                                <div className={`w-px absolute top-0 left-0 ${isHour ? 'bg-base-600 h-3' : 'bg-base-700 h-1.5'}`}></div>
                                {isHour && (
                                    <span className="absolute top-4 left-1 text-[9px] font-mono text-foreground-muted opacity-50">
                                        {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        );
                    })}

                    {/* Alerts Layer */}
                    {sortedAlerts.map((alert) => {
                        const px = msToPx(new Date(alert.createdAt).getTime());
                        const isHighSev = alert.severity === 'HIGH';

                        return (
                            <div
                                key={alert.id}
                                className="absolute top-0 bottom-0 group"
                                style={{ left: px }}
                                onClick={(e) => { e.stopPropagation(); onAlertClick(alert); }}
                            >
                                {/* The Event Marker: A precise line + block */}
                                <div className={`
                                    w-[2px] h-full opacity-60 transition-all hover:opacity-100 hover:w-[3px] 
                                    ${isHighSev ? 'bg-danger' : 'bg-warning'}
                                `}></div>

                                {/* Flag (Only shows on zoom or hover) */}
                                <div className={`
                                    absolute top-8 left-0 w-max px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider
                                    opacity-0 group-hover:opacity-100 transition-opacity z-20
                                    ${isHighSev ? 'bg-danger text-white' : 'bg-warning text-black'}
                                `}>
                                    {alert.type.replace('_', ' ')}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Ghost Cursor (The "Time Engine" Interaction) */}
                {hoverTime && (
                    <div
                        className="absolute top-0 bottom-0 w-px bg-foreground/20 pointer-events-none z-30"
                        style={{ left: cursorX }}
                    >
                        <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-base-950 border border-base-700 text-[9px] font-mono text-foreground">
                            {new Date(hoverTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                        </div>
                    </div>
                )}

                {/* Current Time Indicator (Static reference) */}
                <div
                    className="absolute top-0 bottom-0 w-px bg-success/50 pointer-events-none z-10 border-r border-dashed border-success/30"
                    style={{ left: msToPx(Date.now()) + scrollPos }}
                >
                    <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-success rounded-full"></div>
                </div>

            </div>
        </div>
    );
}
