"use client";

import React from "react";
import Link from "next/link";
import { Twitter, Github, Linkedin, Eye } from "lucide-react";

export default function LandingFooter() {
    return (
        <footer className="relative w-full border-t border-white/5 bg-base-950/80 backdrop-blur-xl text-white/60">
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">

                {/* Brand Column */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-white">
                        <div className="p-2 bg-accent/10 rounded-lg border border-accent/20">
                            <Eye className="w-6 h-6 text-accent" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">OptiVision</span>
                    </div>
                    <p className="text-sm leading-relaxed max-w-xs">
                        Advanced computer vision analytics for the modern industrial warehouse.
                    </p>
                </div>

                {/* Product Column */}
                <div>
                    <h3 className="text-white font-bold mb-6">Product</h3>
                    <ul className="space-y-4 text-sm">
                        <li><Link href="#" className="hover:text-accent transition-colors">Features</Link></li>
                        <li><Link href="#" className="hover:text-accent transition-colors">Pricing</Link></li>
                        <li><Link href="#" className="hover:text-accent transition-colors">API Keys</Link></li>
                        <li><Link href="#" className="hover:text-accent transition-colors">Documentation</Link></li>
                    </ul>
                </div>

                {/* Company Column */}
                <div>
                    <h3 className="text-white font-bold mb-6">Company</h3>
                    <ul className="space-y-4 text-sm">
                        <li><Link href="#" className="hover:text-accent transition-colors">About Us</Link></li>
                        <li><Link href="#" className="hover:text-accent transition-colors">Careers</Link></li>
                        <li><Link href="#" className="hover:text-accent transition-colors">Contact</Link></li>
                        <li><Link href="#" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Social Column */}
                <div>
                    <h3 className="text-white font-bold mb-6">Connect</h3>
                    <div className="flex gap-4">
                        <Link href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-all">
                            <Twitter className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-all">
                            <Github className="w-5 h-5" />
                        </Link>
                        <Link href="#" className="p-3 bg-white/5 rounded-full hover:bg-white/10 hover:text-white transition-all">
                            <Linkedin className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5 py-8 text-center text-xs">
                <p>&copy; {new Date().getFullYear()} OptiVision AI. All rights reserved.</p>
            </div>
        </footer>
    );
}
