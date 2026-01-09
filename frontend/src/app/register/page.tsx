"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import Link from "next/link";
import { ArrowRight, UserPlus, Lock } from "lucide-react";
import InteractiveGrid from "@/components/auth/InteractiveGrid";

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
        <main className="min-h-screen bg-base-950 flex items-center justify-center p-6 relative overflow-hidden">
            <InteractiveGrid />

            <div className="relative z-10 w-full max-w-[400px]">
                {/* Header */}
                <div className="text-center mb-8 space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
                            <div className="w-4 h-4 bg-base-950 rounded-sm" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Account Provisioning
                    </h1>
                    <p className="text-foreground-muted text-xs font-mono uppercase tracking-wider">
                        Request System Credentialing
                    </p>
                </div>

                {/* Card */}
                <div className="bg-base-900 border border-base-800 p-8 shadow-none">
                    {displayError && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex justify-between items-center">
                            <span>ERROR: {displayError}</span>
                            <button
                                onClick={() => {
                                    clearError();
                                    setLocalError("");
                                }}
                                className="hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-base-950 border border-base-800 px-4 py-2.5 text-sm text-foreground placeholder-base-700 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors rounded-none"
                                placeholder="OPERATOR NAME"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-base-950 border border-base-800 px-4 py-2.5 text-sm text-foreground placeholder-base-700 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors rounded-none"
                                placeholder="name@optivision.sys"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-base-950 border border-base-800 px-4 py-2.5 text-sm text-foreground placeholder-base-700 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors rounded-none"
                                    placeholder="••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">
                                    Confirm
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-base-950 border border-base-800 px-4 py-2.5 text-sm text-foreground placeholder-base-700 font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors rounded-none"
                                    placeholder="••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-accent hover:bg-accent/90 text-white text-xs font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-none mt-2"
                        >
                            {isLoading ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    Create Credentials <UserPlus size={14} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-base-800 text-center">
                        <p className="text-foreground-muted text-xs">
                            Existing personnel?{" "}
                            <Link href="/login" className="text-accent hover:text-white transition-colors underline decoration-dotted underline-offset-4">
                                Authenticate Here
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 flex items-center justify-center gap-2 text-[10px] text-base-700 font-mono">
                    <Lock size={10} />
                    <span>ENCRYPTED_CHANNEL // 256-BIT_AES</span>
                </div>
            </div>
        </main>
    );
}
