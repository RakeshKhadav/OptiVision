"use client";

import React from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Calendar, Settings, Bell, Search } from "lucide-react";
import { GlassButton } from "./GlassButton";

interface GlassNavbarProps {
    className?: string;
    actions?: React.ReactNode;
}

export function GlassNavbar({ className = "", actions }: GlassNavbarProps) {
    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 ${className}`}>
            <div className="glass-panel mx-auto max-w-full rounded-2xl px-6 py-3 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-medium tracking-tight text-white flex items-center gap-3">
                        <div className="relative w-8 h-8">
                            <img
                                src="/logo.png"
                                alt="OptiVision Logo"
                                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                            />
                        </div>
                        <span className="font-semibold tracking-wide">OPTIVISION</span>
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            </div>
        </nav>
    );
}
