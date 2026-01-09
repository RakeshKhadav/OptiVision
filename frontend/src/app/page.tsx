import Link from "next/link";
import { ArrowRight, Terminal, Activity, Zap, Shield, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-base-950 text-foreground font-sans selection:bg-accent/20 selection:text-accent flex flex-col">
      {/* Navigation - Ultra Minimal */}
      <nav className="border-b border-base-800 bg-base-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-foreground rounded-sm" />
            <span className="font-bold tracking-tight text-xs uppercase text-foreground-muted">OptiVision Systems</span>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium font-mono">
            <Link href="/login" className="text-foreground-muted hover:text-foreground transition-colors uppercase tracking-wider">
              [Log_in]
            </Link>
            <Link
              href="/register"
              className="text-accent hover:text-accent/80 transition-colors uppercase tracking-wider flex items-center gap-1"
            >
              Request_Access <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Technical & Direct */}
      <section className="pt-32 pb-24 px-6 border-b border-base-800 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-2 py-1 bg-base-900 border border-base-800 rounded-sm">
                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">System Nominal // v2.4.0</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tighter leading-[0.9] text-foreground">
                DETERMINISTIC<br />
                VIDEO<br />
                ANALYTICS.
              </h1>
              <p className="text-lg text-foreground-muted leading-relaxed max-w-md font-light">
                Industrial-grade observability for complex environments.
                Extract structured event data from chaotic visual streams with predictable latency.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-foreground text-base-950 font-bold text-sm uppercase tracking-wide rounded-sm hover:bg-white transition-all transform active:scale-95"
              >
                Launch Console
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#"
                className="group inline-flex items-center justify-center gap-3 px-6 py-3 border border-base-700 text-foreground font-medium text-sm uppercase tracking-wide rounded-sm hover:bg-base-900 transition-all"
              >
                Read Documentation
              </Link>
            </div>
          </div>

          {/* Visual: Abstract Data Stream (CSS Animation) */}
          <div className="relative aspect-square lg:aspect-4/3 bg-base-950 border border-base-800 rounded-sm overflow-hidden flex flex-col font-mono text-[10px] text-foreground-muted select-none">
            {/* Header */}
            <div className="h-8 border-b border-base-800 bg-base-900 flex items-center px-3 justify-between">
              <span className="text-foreground-dark">TERM_01</span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-base-800" />
                <div className="w-2 h-2 rounded-full bg-base-800" />
              </div>
            </div>
            {/* Body */}
            <div className="p-4 flex-1 overflow-hidden relative">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,23,0)_0%,rgba(18,18,23,1)_100%)] z-10 pointer-events-none"></div>
              <div className="space-y-1 opacity-70">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="text-base-700">00:{14 + i}:23.{Math.floor(Math.random() * 999)}</span>
                    <span className={i % 3 === 0 ? "text-accent" : "text-foreground-muted"}>
                      {i % 3 === 0 ? ">> EVENT_DETECTED" : ">> IDLE_STATE_MONITOR"}
                    </span>
                    <span className="text-base-600 truncate">
                      {i % 3 === 0 ? `[OBJ_ID:${Math.floor(Math.random() * 5000)}] [CONF:${90 + Math.floor(Math.random() * 9)}%]` : "Analyzing frame buffer..."}
                    </span>
                  </div>
                ))}
                <div className="flex gap-4 animate-pulse text-accent">
                  <span className="text-base-700">00:14:44.021</span>
                  <span>_</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specs Section - List Style */}
      <section className="py-24 px-6 border-b border-base-800 bg-base-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-4">
            <h2 className="text-2xl font-bold tracking-tight text-foreground uppercase mb-4">System<br />Specifications</h2>
            <p className="text-sm text-foreground-muted mb-8 max-w-xs">
              Designed for rigorous constraints. Our pipeline prioritizes accuracy and resource efficiency over theoretical throughput.
            </p>
            <div className="h-px w-24 bg-accent"></div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            {/* Spec Item */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Terminal className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Ingestion</span>
              </div>
              <h3 className="text-lg font-medium text-foreground">WebSocket Pipeline</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Direct frame buffer access via secure WebSocket protocols. Supports RTSP bridging and raw MJPEG streams with automatic reconnection logic.
              </p>
            </div>

            {/* Spec Item */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Heuristics</span>
              </div>
              <h3 className="text-lg font-medium text-foreground">Spatial Logic Engine</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Define polygonal inclusion/exclusion zones. Detections are validated against rigorous spatial constraints before event emission.
              </p>
            </div>

            {/* Spec Item */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Latency</span>
              </div>
              <h3 className="text-lg font-medium text-foreground">Sub-100ms Inference</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Optimized YOLOv8 runtime execution guarantees near real-time analysis even on edge hardware.
              </p>
            </div>

            {/* Spec Item */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-accent">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Compliance</span>
              </div>
              <h3 className="text-lg font-medium text-foreground">Immutable Audit Logs</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                Every detection, user action, and system state change is cryptographically signed and stored for post-incident review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics / Trust Section */}
      <section className="py-24 px-6 bg-base-900 border-b border-base-800">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="w-full max-w-4xl border border-base-800 bg-base-950 p-1">
            <div className="flex items-center justify-between px-4 py-2 bg-base-900 border-b border-base-800">
              <span className="text-[10px] font-mono uppercase text-foreground-muted">Live_System_Metrics</span>
              <div className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-success/20 border border-success"></span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-base-800">
              <div className="p-6">
                <div className="text-[10px] font-mono text-foreground-muted uppercase mb-1">Mean Uptime</div>
                <div className="text-2xl font-mono text-foreground">99.99%</div>
              </div>
              <div className="p-6">
                <div className="text-[10px] font-mono text-foreground-muted uppercase mb-1">False Positive Rate</div>
                <div className="text-2xl font-mono text-accent">&lt; 0.04%</div>
              </div>
              <div className="p-6">
                <div className="text-[10px] font-mono text-foreground-muted uppercase mb-1">Global Events</div>
                <div className="text-2xl font-mono text-foreground">14.2M+</div>
              </div>
              <div className="p-6">
                <div className="text-[10px] font-mono text-foreground-muted uppercase mb-1">Avg Response</div>
                <div className="text-2xl font-mono text-foreground">42ms</div>
              </div>
            </div>
          </div>

          <p className="mt-12 text-sm text-foreground-muted max-w-xl">
            OptiVision is trusted by forward-thinking industrial operators who require <span className="text-foreground font-medium">absolute deterministic behavior</span> from their monitoring infrastructure.
          </p>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-12 px-6 bg-base-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-foreground-muted font-mono">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-bold tracking-tight">OPTIVISION</span>
            <span className="w-px h-3 bg-base-800"></span>
            <span>SYSTEMS_DIVISION</span>
          </div>
          <p>
            © 2026 // ALL_RIGHTS_RESERVED
          </p>
        </div>
      </footer>
    </main>
  );
}
