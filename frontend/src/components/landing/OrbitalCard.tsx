"use client";

import React from "react";
import { motion, useTransform, MotionValue } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Feature {
    id: number;
    title: string;
    desc: string;
    icon: React.ReactNode;
    align: "left" | "right";
}

interface OrbitalCardProps {
    feature: Feature;
    scrollProgress: MotionValue<number>;
    range: [number, number];
}

export function OrbitalCard({ feature, scrollProgress, range }: OrbitalCardProps) {
    const [start, end] = range;

    // 1. OPACITY: Fade in when entering range, fade out when leaving
    const opacity = useTransform(
        scrollProgress,
        [start, start + 0.1, end - 0.1, end],
        [0, 1, 1, 0]
    );

    // 2. SCALE: Grow from 0.5 (tiny) to 1 (full size)
    const scale = useTransform(
        scrollProgress,
        [start, start + 0.2],
        [0.5, 1]
    );

    // 3. Y-POSITION: Move from Bottom (100vh) -> Center (0) -> Top (-100vh)
    const y = useTransform(
        scrollProgress,
        [start, start + 0.2, end],
        ["100vh", "0vh", "-50vh"]
    );

    // 4. X-POSITION: The "Orbit" logic
    // If align left: Start at 0 (center), arc to -350px (left)
    // If align right: Start at 0 (center), arc to 350px (right)
    const xDir = feature.align === "left" ? -1 : 1;
    const x = useTransform(
        scrollProgress,
        [start, start + 0.2],
        ["0px", `${xDir * 400}px`]
    );

    // 5. ROTATION: Slight tilt to emphasize the 3D movement
    const rotate = useTransform(
        scrollProgress,
        [start, start + 0.2],
        [feature.align === "left" ? 45 : -45, 0]
    );

    return (
        <motion.div
            style={{
                opacity,
                scale,
                y,
                x,
                rotateZ: rotate,
            }}
            className="absolute w-[350px] md:w-[450px] pointer-events-auto"
        >
            <div className={`
                relative w-full h-full p-8 rounded-3xl overflow-hidden
                bg-black/30 backdrop-blur-3xl
                border border-white/10
                shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
                ${feature.align === "left" ? "border-l-4 border-l-accent" : "border-r-4 border-r-blue-500"}
            `}>
                {/* Inner White Subtle Gradient for "Glass" Sheen */}
                <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-70 pointer-events-none" />

                <div className="relative z-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5 shadow-inner">
                    {feature.icon}
                </div>
                <h3 className="relative z-10 text-2xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="relative z-10 text-neutral-400 leading-relaxed">
                    {feature.desc}
                </p>
            </div>
        </motion.div>
    );
}
