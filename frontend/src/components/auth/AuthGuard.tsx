"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { token, hydrateFromStorage, verifySession } = useAuthStore();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            // Restore auth state from storage on mount
            hydrateFromStorage();

            // If we have a token, verify it's still valid with the backend
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                await verifySession();
            }

            setIsReady(true);
        };

        initAuth();
    }, [hydrateFromStorage, verifySession]);

    useEffect(() => {
        if (!isReady) return;

        const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

        // If not authenticated and not on a public route, redirect to login
        if (!token && !isPublicRoute) {
            router.push("/login");
        }

        // If authenticated and on login/register pages, redirect to dashboard
        if (token && (pathname === "/login" || pathname === "/register")) {
            router.push("/dashboard");
        }
    }, [token, pathname, isReady, router]);

    // Prevent flicker by not rendering protected content while checking auth
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    if (!isReady || (!token && !isPublicRoute)) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return <>{children}</>;
}
