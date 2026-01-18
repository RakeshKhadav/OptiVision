"use client";

import React, { useRef } from "react";
import SplineScene from "@/components/landing/SplineScene";
import { OrbitalCard } from "@/components/landing/OrbitalCard";
import { Shield, Zap, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import LandingNavbar from "@/components/landing/LandingNavbar";
import BackgroundElements from "@/components/landing/BackgroundElements";
import LandingFooter from "@/components/landing/LandingFooter";

const FEATURES = [
    {
        id: 1,
        title: "Zone Violation Systems",
        desc: "Our YOLOv11 engine continuously scans for PPE non-compliance and hazardous zone intrusions. Sub-second latency ensures accidents are prevented before they happen.",
        icon: <Shield className="w-6 h-6 text-accent" />,
        align: "left" as const
    },
    {
        id: 2,
        title: "Velocity Tracking",
        desc: "Identify bottlenecks and idle time with precision. Our algorithms track asset movement vectors to calculate real-time efficiency scores without compromising individual privacy.",
        icon: <Zap className="w-6 h-6 text-blue-400" />,
        align: "right" as const
    },
    {
        id: 3,
        title: "Live Floor Mapping",
        desc: "Transform raw 2D video feeds into a comprehensive top-down tactical map. Visualize every moving asset in your facility as a live data point on a digital twin.",
        icon: <Activity className="w-6 h-6 text-emerald-400" />,
        align: "left" as const
    }
];

export default function Home() {
    const orbitalContainerRef = useRef<HTMLDivElement>(null);

    // Track scroll progress specifically for the orbital section
    const { scrollYProgress } = useScroll({
        target: orbitalContainerRef,
        offset: ["start end", "end start"] // Start tracking as it enters view
    });

    // Remap the progress to be 0-1 ONLY while the sticky part is relevant.
    // The container is 400vh.
    // 0.0 - 0.25: Entering
    // 0.25 - 0.75: Active Scrolling (Sticky Phase)
    // 0.75 - 1.0: Exiting

    // We want the card animations to happen during the middle chunk of internal scroll
    const orbitalProgress = useTransform(scrollYProgress, [0.1, 0.9], [0, 1]);

    return (
        <main className="relative bg-base-950 text-foreground selection:bg-accent selection:text-black min-h-screen">
            <LandingNavbar />

            {/* 1. FIXED BACKGROUND LAYER - Persistent across all sections */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <BackgroundElements />
                <SplineScene />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-base-950/80 via-transparent to-base-950/80 opacity-80" />
            </div>

            {/* 2. SCROLLABLE CONTENT LAYER */}
            <div className="relative z-10 w-full">

                {/* --- SECTION 1: HERO (Standard Scroll) --- */}
                <section className="min-h-screen flex flex-col items-center justify-center relative pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center z-10"
                    >
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-accent via-white to-amber-200 drop-shadow-2xl">
                            OptiVision
                        </h1>
                        <p className="text-xl md:text-2xl text-accent/80 font-mono tracking-widest mt-2 uppercase">
                            Panopticon Interface V.1.0
                        </p>

                        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto mt-8 pointer-events-auto">
                            <Link href="/register" className="w-full">
                                <button className="w-full cursor-pointer bg-accent hover:bg-amber-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-between group">
                                    Launch System
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Scroll Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-10 text-white/50 animate-bounce"
                    >
                        <p className="text-xs font-mono uppercase tracking-widest mb-2">Initialize Scroll</p>
                    </motion.div>
                </section>

                {/* --- SECTION 2: ORBITAL SCROLL (Sticky & Tall) --- */}
                <div ref={orbitalContainerRef} className="h-[400vh] relative">
                    <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center pointer-events-none">
                        {/* 
                            Cards Container 
                            Driven by the orbitalProgress mapped from the specific container scroll 
                        */}
                        <div className="absolute inset-0 z-50 flex items-center justify-center">
                            {FEATURES.map((feature, index) => {
                                // Stagger the animations across the progress (0 to 1)
                                const step = 1 / FEATURES.length; // 0.33
                                const rangeStart = index * step * 0.8; // slightly overlapping
                                const rangeEnd = rangeStart + 0.5;

                                return (
                                    <OrbitalCard
                                        key={feature.id}
                                        feature={feature}
                                        scrollProgress={orbitalProgress}
                                        range={[rangeStart, rangeEnd]}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- SECTION 3: FOOTER & CTA (Standard Scroll) --- */}
                <section className="relative z-20 pt-20 pointer-events-none">
                    <div className="flex flex-col items-center justify-center w-full pointer-events-auto">
                        <div className="glass-panel text-center p-12 md:p-16 max-w-4xl w-full border border-white/10 rounded-3xl relative overflow-hidden group bg-base-900/40 backdrop-blur-xl mx-6 mb-20">
                            <div className="absolute inset-0 bg-linear-to-b from-accent/5 to-transparent pointer-events-none" />

                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white relative z-10">Ready to Optimize?</h2>
                            <p className="text-xl text-muted mb-10 max-w-2xl mx-auto relative z-10">
                                Join the warehouse revolution. Deploy OptiVision today and see the future of industrial safety.
                            </p>
                            <Link href="/register" className="relative z-10 block w-fit mx-auto">
                                <button className="cursor-pointer group bg-accent text-white px-12 py-6 rounded-full font-bold text-xl hover:bg-amber-600 transition-all flex items-center gap-3 shadow-2xl shadow-accent/20">
                                    Get Started
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                        <LandingFooter />
                    </div>
                </section>

            </div>
        </main>
    );
}
