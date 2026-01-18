"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/useAuthStore";
import { LayoutDashboard, LogOut, LogIn, UserPlus } from "lucide-react";

export default function LandingNavbar() {
    const { user, logout, hydrateFromStorage } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        hydrateFromStorage();
        setMounted(true);
    }, [hydrateFromStorage]);

    // Prevent hydration mismatch
    if (!mounted) return null;

    return (
        <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-4"
        >
            {user ? (
                <>
                    <Link href="/dashboard">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-accent/90 hover:bg-accent text-white font-semibold rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.4)] transition-all">
                            <LayoutDashboard className="w-4 h-4" />
                            <span>Dashboard</span>
                        </button>
                    </Link>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-red-500/10 text-white hover:text-red-400 border border-white/10 hover:border-red-500/20 rounded-full backdrop-blur-md transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </>
            ) : (
                <>
                    <Link href="/login">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full backdrop-blur-md transition-all">
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </button>
                    </Link>
                    <Link href="/register">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-amber-600 text-white font-bold rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.5)] transition-all">
                            <UserPlus className="w-4 h-4" />
                            <span>Register</span>
                        </button>
                    </Link>
                </>
            )}
        </motion.nav>
    );
}
