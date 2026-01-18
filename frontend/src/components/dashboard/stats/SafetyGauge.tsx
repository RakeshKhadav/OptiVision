"use client";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface SafetyGaugeProps {
    score: number; // 0-100
}

export default function SafetyGauge({ score }: SafetyGaugeProps) {
    // Gauge Data (Semi-circle)
    const data = [
        { name: "Score", value: score, color: score > 80 ? "#10b981" : score > 50 ? "#f59e0b" : "#ef4444" },
        { name: "Remaining", value: 100 - score, color: "rgba(255,255,255,0.1)" },
    ];

    /* 
     * Needle Rotation Logic (Simple approximation)
     * 180 degrees total span. 
     * 0 score -> 180 deg (Left)
     * 100 score -> 0 deg (Right)
     * actually recharts starts at 3 o'clock (0deg). 
     * We want 180 (9 o'clock) to 0 (3 o'clock).
     */

    return (
        <div className="flex flex-col items-center justify-center h-full w-full relative">
            <div className="h-[100px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="100%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            cornerRadius={4}
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Score Text */}
                <div className="absolute bottom-0 left-0 right-0 text-center mb-2">
                    <div className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg">{score}%</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-widest">Safety Score</div>
                </div>
            </div>
        </div>
    );
}
