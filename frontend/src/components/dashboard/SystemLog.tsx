"use client";
import { useEffect, useState } from "react";

interface LogEntry {
    id: string;
    timestamp: Date;
    level: "INFO" | "WARN" | "ERR" | "SYS";
    message: string;
}

export default function SystemLog() {
    const [logs, setLogs] = useState<LogEntry[]>([
        { id: "1", timestamp: new Date(), level: "SYS", message: "Kernel ready" },
        { id: "2", timestamp: new Date(), level: "INFO", message: "Protect_Loop: A" }
    ]);

    // Simulate incoming logs
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.7) return; // Random cadence

            const types: ("INFO" | "WARN" | "SYS")[] = ["INFO", "INFO", "WARN", "SYS"];
            const msgs = [
                "Buffer flush complete",
                "Node sync: OK",
                "Latency variation > 2ms",
                "Frame dropped (recoverable)",
                "Garbage collection",
                "WS_KeepAlive: ACK"
            ];

            const newLog: LogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                level: types[Math.floor(Math.random() * types.length)],
                message: msgs[Math.floor(Math.random() * msgs.length)]
            };

            setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep last 50
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 flex flex-col font-mono text-[10px] overflow-hidden">
            {/* Virtual Scroller container */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
                {logs.map((log, i) => (
                    <div
                        key={log.id}
                        className={`
                            flex gap-2 animate-fade-in
                            ${i === 0 ? 'text-foreground font-bold' : 'text-foreground-muted opacity-80'}
                        `}
                        style={{ opacity: Math.max(0.3, 1 - (i * 0.1)) }} // Fade out older entries
                    >
                        <span className="text-foreground-dark whitespace-nowrap">
                            {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>

                        <span className={`
                            w-8 shrink-0 text-center
                            ${log.level === 'WARN' ? 'bg-warning/20 text-warning' : ''}
                            ${log.level === 'ERR' ? 'bg-danger/20 text-danger' : ''}
                            ${log.level === 'SYS' ? 'text-accent' : ''}
                        `}>
                            {log.level}
                        </span>

                        <span className="truncate">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
