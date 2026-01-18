"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { ArrowRight, UserPlus, Lock } from "lucide-react";
import BackgroundElements from "@/components/landing/BackgroundElements";
import { motion } from "framer-motion";

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading, error, clearError, token, hydrateFromStorage } = useAuthStore();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localError, setLocalError] = useState("");

    useEffect(() => {
        hydrateFromStorage();
    }, [hydrateFromStorage]);

    useEffect(() => {
        if (token) {
            router.push("/dashboard");
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters");
            return;
        }

        const success = await register(name, email, password);
        if (success) {
            router.push("/dashboard");
        }
    };

    const displayError = localError || error;

    return (
        <main className="min-h-screen bg-base-950 flex items-center justify-center p-6 relative overflow-hidden selection:bg-accent selection:text-black">
            <BackgroundElements />
            <div className="absolute inset-0 bg-base-950/20 backdrop-blur-[2px]" />

            <div className="relative z-10 w-full max-w-[480px]">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative w-full p-8 rounded-3xl overflow-hidden bg-black/30 backdrop-blur-3xl border border-white/10 shadow-2xl group"
                >
                    {/* Inner Glass Highlight */}
                    <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="mx-auto w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mb-6 border border-accent/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                            >
                                <img src="/logo.png" alt="OptiVision Logo" className="w-10 h-10 object-contain" />
                            </motion.div>
                            <motion.h1
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-bold text-white mb-2"
                            >
                                Create Account
                            </motion.h1>
                            <motion.p
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-white/50 text-sm"
                            >
                                Join the OptiVision platform
                            </motion.p>
                        </div>

                        {displayError && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex justify-between items-center backdrop-blur-md"
                            >
                                <span>{displayError}</span>
                                <button
                                    onClick={() => {
                                        clearError();
                                        setLocalError("");
                                    }}
                                    className="hover:text-white transition-colors"
                                >
                                    ✕
                                </button>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-white/70 ml-1">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all hover:bg-white/10"
                                    placeholder="John Doe"
                                    required
                                />
                            </motion.div>

                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-2"
                            >
                                <label className="text-sm font-medium text-white/70 ml-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all hover:bg-white/10"
                                    placeholder="name@example.com"
                                    required
                                />
                            </motion.div>

                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all hover:bg-white/10"
                                        placeholder="••••••"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-white/70 ml-1">
                                        Confirm
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/20 rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all hover:bg-white/10"
                                        placeholder="••••••"
                                        required
                                    />
                                </div>
                            </motion.div>

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8 }}
                                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(245,158,11,0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-accent hover:bg-amber-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden mt-2"
                            >
                                {isLoading ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        <span className="relative z-10 flex items-center gap-2">
                                            Create Account <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                        {/* Button Shimmer */}
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.9 }}
                            className="mt-8 pt-6 border-t border-white/10 text-center"
                        >
                            <p className="text-white/40 text-sm">
                                Already have an account?{" "}
                                <Link href="/login" className="text-accent hover:text-amber-400 transition-colors font-medium relative group-hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-center mt-8 text-white/20 text-xs"
                >
                    &copy; {new Date().getFullYear()} OptiVision AI. Secure System.
                </motion.div>
            </div>
        </main>
    );
}
