"use client";

import { useEffect, useRef } from "react";

/**
 * InteractiveGrid
 * A low-energy, industrial background that provides subtle depth via cursor interaction.
 * No looping animations, no heavy GPU usage.
 */
export default function InteractiveGrid() {
    const containerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!gridRef.current) return;

            // Calculate normalized mouse position (-1 to 1)
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;

            // Apply extremely subtle parallax (max 10px shift)
            gridRef.current.style.transform = `translate(${x * -10}px, ${y * -10}px)`;
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-base-950 -z-10">
            {/* Base Grid Layer */}
            <div
                ref={gridRef}
                className="absolute inset-[-20px] opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, #a1a1aa 1px, transparent 1px),
                        linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)
                    `,
                    backgroundSize: "40px 40px",
                    willChange: "transform",
                    transition: "transform 0.1s ease-out" // Smooth out the movement slightly
                }}
            />

            {/* Vignette to focus attention on center */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--color-base-950)_100%)] pointer-events-none opacity-80" />
        </div>
    );
}
