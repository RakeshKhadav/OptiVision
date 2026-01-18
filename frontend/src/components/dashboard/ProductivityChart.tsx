"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { activityService, StatsResponse } from "@/services/activityService";
import { socket } from "@/lib/socket";

export default function ProductivityChart() {
    const [data, setData] = useState<{ name: string; value: number; color: string }[]>([]);
    const [workingPercentage, setWorkingPercentage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const processStats = (stats: StatsResponse) => {
            let working = 0;
            let idle = 0;
            let other = 0;

            stats.activityStats.forEach(stat => {
                const duration = stat._sum.duration || 0;
                if (stat.action === "WORKING") working += duration;
                else if (stat.action === "IDLE") idle += duration;
                else other += duration;
            });

            const total = working + idle + other;
            // Avoid NaN
            const safeTotal = total === 0 ? 1 : total;

            const wp = Math.round((working / safeTotal) * 100);
            const ip = Math.round((idle / safeTotal) * 100);
            const op = Math.round((other / safeTotal) * 100);

            // Use percentages for the chart segments
            const chartData = [
                { name: 'Working', value: wp, color: 'url(#gradWork)' },
                { name: 'Idle', value: ip, color: 'url(#gradIdle)' },
                { name: 'Other', value: op, color: '#334155' }, // Slate-700
            ].filter(d => d.value > 0);

            setData(chartData);
            setWorkingPercentage(wp);
            setLoading(false);
        };

        const fetchData = async () => {
            try {
                const stats = await activityService.getActivityStats();
                processStats(stats);
            } catch (error) {
                console.error("Failed to fetch activity stats", error);
                // Fallback Mock
                setData([
                    { name: 'Working', value: 75, color: 'url(#gradWork)' },
                    { name: 'Idle', value: 20, color: 'url(#gradIdle)' },
                    { name: 'Other', value: 5, color: '#334155' },
                ]);
                setWorkingPercentage(75);
                setLoading(false);
            }
        };

        fetchData();

        // Real-time updates via Socket - only listen to aggregated stats events
        // Removed: activity_log listener that was causing excessive API calls
        socket.on("activity_log_stats", (newStats: StatsResponse) => {
            processStats(newStats);
        });

        return () => {
            socket.off("activity_log_stats");
        };
    }, []);

    // Semi-circle configuration
    const cx = "50%";
    const cy = "100%";
    const iR = 60;
    const oR = 80;

    // Custom Tooltip
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-lg shadow-2xl ring-1 ring-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-foreground-muted mb-1">{payload[0].name}</p>
                    <p className="text-xl font-bold text-white font-mono">
                        {payload[0].value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) return <div className="h-full flex items-center justify-center text-xs text-foreground-muted animate-pulse">Initializing Metrics...</div>;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Chart Container */}
            <div className="w-full h-[100px] relative mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            <linearGradient id="gradWork" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#d946ef" />
                            </linearGradient>
                            <linearGradient id="gradIdle" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#fbbf24" />
                            </linearGradient>
                        </defs>
                        <Pie
                            dataKey="value"
                            startAngle={180}
                            endAngle={0}
                            data={data}
                            cx={cx}
                            cy={cy}
                            innerRadius={iR}
                            outerRadius={oR}
                            paddingAngle={4}
                            stroke="none"
                            cornerRadius={4}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'transparent' }}
                            wrapperStyle={{ outline: 'none' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Label */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center pb-1">
                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest opacity-80">Efficiency</div>
                    <div className="text-4xl font-black text-white tracking-tighter drop-shadow-lg filter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {workingPercentage}<span className="text-lg align-top opacity-60 font-medium">%</span>
                    </div>
                </div>
            </div>

            {/* Glassy Legend */}
            <div className="flex justify-center gap-6 mt-4 w-full">
                {data.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 group cursor-default">
                        <div className="w-2 h-2 rounded-full ring-2 ring-white/10 group-hover:ring-accent/50 transition-all duration-500"
                            style={{ background: item.color.includes('url') ? (item.name === 'Working' ? '#8b5cf6' : '#f97316') : item.color }} />
                        <div className="text-[10px] text-foreground-muted font-medium tracking-wider group-hover:text-foreground transition-colors uppercase">
                            {item.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
