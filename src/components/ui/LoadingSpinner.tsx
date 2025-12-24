export default function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[50vh] w-full">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium text-sm animate-pulse">Ładowanie...</p>
            </div>
        </div>
    );
}
