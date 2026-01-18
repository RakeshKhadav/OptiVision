"use client";

import React from "react";
import { motion } from "framer-motion";

export default function BackgroundElements() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Tech Grid Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Ambient Glows Positioned for Glass Cards */}

            {/* Top Right (Near Hero/Register) - Accent Color */}
            <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-[120px] mix-blend-screen animate-pulse-slow" />

            {/* Middle Left (For Safety Section) - Accent to Orange */}
            <div className="absolute top-[30%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-500/10 blur-[100px] mix-blend-screen" />

            {/* Middle Right (For Productivity Section) - Blue */}
            <div className="absolute top-[50%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[100px] mix-blend-screen" />

            {/* Bottom Left (For Digital Twin) - Emerald */}
            <div className="absolute bottom-[10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen" />

            {/* Central Deep Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />
        </div>
    );
}
