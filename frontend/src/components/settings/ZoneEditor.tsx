"use client";
import { useState, useEffect } from "react";
import { zoneService, Zone } from "@/services/zoneService";

interface ZoneEditorProps {
    cameraId: number;
    frame: string;
}

export default function ZoneEditor({ cameraId, frame }: ZoneEditorProps) {
    const [zones, setZones] = useState<Zone[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPoints, setCurrentPoints] = useState<number[][]>([]);
    const [zoneName, setZoneName] = useState("");
    const [zoneType, setZoneType] = useState<Zone["type"]>("DANGER");

    useEffect(() => {
        fetchZones();
    }, [cameraId]);

    const fetchZones = async () => {
        try {
            const data = await zoneService.getZones();
            if (data.success) {
                // Client-side filtering if backend doesn't support it yet
                const cameraZones = data.data.filter((z: any) => z.cameraId === cameraId);
                setZones(cameraZones);
            }
        } catch (error) {
            console.error("Failed to fetch zones", error);
        }
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDrawing) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const scaleX = 1280 / rect.width;
        const scaleY = 720 / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        setCurrentPoints([...currentPoints, [x, y]]);
    };

    const saveZone = async () => {
        if (currentPoints.length < 3 || !zoneName) return;

        try {
            const data = await zoneService.createZone({
                name: zoneName,
                type: zoneType,
                coordinates: JSON.stringify(currentPoints),
                cameraId
            });

            if (data.success) {
                setZones([...zones, data.data]);
                cancelDrawing();
            }
        } catch (error) {
            console.error("Failed to save zone", error);
            alert("Failed to save zone");
        }
    };

    const deleteZone = async (id: number) => {
        if (!confirm("Are you sure?")) return;
        try {
            await zoneService.deleteZone(id);
            setZones(zones.filter(z => z.id !== id));
        } catch (error) {
            console.error("Failed to delete zone", error);
        }
    };

    const cancelDrawing = () => {
        setIsDrawing(false);
        setCurrentPoints([]);
        setZoneName("");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Zone Management</h3>
                {!isDrawing ? (
                    <button
                        onClick={() => setIsDrawing(true)}
                        className="px-3 py-1.5 bg-cyan-600 rounded text-xs font-medium hover:bg-cyan-500"
                    >
                        + New Zone
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={cancelDrawing} className="px-3 py-1.5 bg-slate-700 rounded text-xs">Cancel</button>
                        <button onClick={saveZone} className="px-3 py-1.5 bg-green-600 rounded text-xs">Save Zone</button>
                    </div>
                )}
            </div>

            {isDrawing && (
                <div className="flex gap-4 p-4 bg-slate-900 rounded border border-slate-800">
                    <input
                        type="text"
                        placeholder="Zone Name (e.g., 'Loading Dock')"
                        className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                        value={zoneName}
                        onChange={e => setZoneName(e.target.value)}
                    />
                    <select
                        value={zoneType}
                        onChange={e => setZoneType(e.target.value as any)}
                        className="bg-slate-950 border border-slate-700 rounded px-3 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                        <option value="DANGER">DANGER (Red)</option>
                        <option value="SAFE">SAFE (Green)</option>
                        <option value="RESTRICTED">RESTRICTED (Amber)</option>
                    </select>
                    <span className="text-xs text-slate-400 self-center">
                        Click on the video to define polygon vertices ({currentPoints.length} points)
                    </span>
                </div>
            )}

            <div
                className="relative aspect-video bg-black rounded border border-slate-700 overflow-hidden cursor-crosshair"
                onClick={handleCanvasClick}
            >
                {/* Background Frame */}
                {frame && (
                    <img
                        src={`data:image/jpeg;base64,${frame}`}
                        className="w-full h-full object-contain pointer-events-none"
                    />
                )}

                {/* Existing Zones */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1280 720">
                    {zones.map(zone => {
                        const pts = JSON.parse(zone.coordinates);
                        const pathData = `M ${pts.map((p: any) => p.join(" ")).join(" L ")} Z`;
                        const color = zone.type === "DANGER" ? "red" : zone.type === "SAFE" ? "green" : "orange";

                        return (
                            <path
                                key={zone.id}
                                d={pathData}
                                fill={color}
                                fillOpacity="0.2"
                                stroke={color}
                                strokeWidth="2"
                            />
                        );
                    })}

                    {/* Current Drawing */}
                    {currentPoints.length > 0 && (
                        <>
                            <path
                                d={`M ${currentPoints.map(p => p.join(" ")).join(" L ")}`}
                                fill="none"
                                stroke="white"
                                strokeWidth="2"
                                strokeDasharray="4"
                            />
                            {currentPoints.map((p, i) => (
                                <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="white" />
                            ))}
                        </>
                    )}
                </svg>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase">Active Zones</h4>
                {zones.length === 0 && <p className="text-xs text-slate-500">No zones defined.</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {zones.map(zone => (
                        <div key={zone.id} className="flex justify-between items-center p-2 bg-slate-900 rounded border border-slate-800">
                            <div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${zone.type === "DANGER" ? "bg-red-500/20 text-red-500" :
                                        zone.type === "SAFE" ? "bg-green-500/20 text-green-500" :
                                            "bg-amber-500/20 text-amber-500"
                                    }`}>
                                    {zone.type}
                                </span>
                                <span className="text-sm text-slate-300">{zone.name}</span>
                            </div>
                            <button
                                onClick={() => deleteZone(zone.id)}
                                className="text-xs text-red-400 hover:text-red-300 px-2"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
