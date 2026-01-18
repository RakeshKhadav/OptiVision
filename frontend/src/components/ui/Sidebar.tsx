"use client";

import React from "react";
import Link from "next/link";
import { LogOut, Home, Settings, User } from "lucide-react";
import { GlassButton } from "./GlassButton";

interface SidebarProps {
    className?: string;
    onLogout?: () => void;
}

export function Sidebar({ className = "", onLogout }: SidebarProps) {
    return (
        <aside className={`w-16 h-full flex flex-col items-center py-6 gap-8 z-50 ${className}`}>
            {/* Glass Container */}
            <div className="absolute inset-0 w-16 bg-black/30 backdrop-blur-xl border-r border-white/10" />

            {/* Logo */}
            <div className="relative z-10 w-8 h-8 shrink-0">
                <Link href="/" title="Home">
                    <img
                        src="/logo.png"
                        alt="OptiVision"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    />
                </Link>
            </div>

            {/* Navigation (Placeholder for now) */}
            <nav className="relative z-10 flex-1 flex flex-col items-center gap-4 w-full">
                <div className="w-8 h-[1px] bg-white/10" />

                <GlassButton variant="ghost" size="icon" className="hover:bg-white/5 opacity-50 hover:opacity-100" title="Dashboard">
                    <Home className="w-5 h-5" />
                </GlassButton>

                <GlassButton variant="ghost" size="icon" className="hover:bg-white/5 opacity-50 hover:opacity-100" title="Settings">
                    <Settings className="w-5 h-5" />
                </GlassButton>
            </nav>

            {/* Bottom Actions */}
            <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                <div className="w-8 h-[1px] bg-white/10" />

                {/* Profile Placeholder */}
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-accent to-purple-500/50 border border-white/20 shadow-lg shadow-accent/20 cursor-pointer opacity-80 hover:opacity-100 transition-opacity" title="Profile (Coming Soon)" />

                {/* Logout */}
                <GlassButton variant="ghost" size="icon" onClick={onLogout} title="Logout" className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                    <LogOut className="w-5 h-5" />
                </GlassButton>
            </div>
        </aside>
    );
}
