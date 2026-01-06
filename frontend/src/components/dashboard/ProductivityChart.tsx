"use client";
import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { api } from "@/lib/api";
import { socket } from "@/lib/socket";

interface ActivityStat {
    action: string;
    _sum: {
        duration: number | null;
    };
}

interface ChartData {
    name: string;
    value: number;
    [key: string]: string | number; // Index signature for Recharts compatibility
}

interface ProductivityChartProps {
    initialData?: ChartData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ProductivityChart({ initialData = [] }: ProductivityChartProps) {
    const [data, setData] = useState<ChartData[]>(initialData);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get("/activity/stats");
                if (res.data.success && res.data.data.activityStats) {
                    const chartData = res.data.data.activityStats.map((stat: ActivityStat) => ({
                        name: stat.action,
                        value: stat._sum.duration || 0
                    }));
                    setData(chartData);
                }
            } catch (error) {
                console.error("Failed to fetch activity stats:", error);
            }
        };

        // Listen for real-time updates via socket
        socket.on("activity_log_stats", (newData: any) => {
            if (newData.activityStats) {
                const chartData = newData.activityStats.map((stat: ActivityStat) => ({
                    name: stat.action,
                    value: stat._sum.duration || 0
                }));
                setData(chartData);
            }
        });

        // Refresh every minute for live updates (fallback)
        const interval = setInterval(fetchStats, 60000);

        return () => {
            socket.off("activity_log_stats");
            clearInterval(interval);
        };
    }, []);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-48 text-xs text-slate-500">
                No activity data available
            </div>
        );
    }

    return (
        <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
