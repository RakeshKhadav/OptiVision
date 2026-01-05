export default function Loading() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-xs font-medium tracking-widest uppercase">Initializing Command Center...</p>
            </div>
        </div>
    );
}
