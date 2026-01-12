import React from 'react';
import { Database, Clock, RefreshCw } from 'lucide-react';

interface DataPendingStateProps {
    className?: string;
}

const DataPendingState: React.FC<DataPendingStateProps> = ({ className = '' }) => {
    return (
        <div className={`bg-surface rounded-3xl p-8 border border-border-base shadow-sm relative overflow-hidden group ${className}`}>
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-blue/10 transition-colors duration-700" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center py-12">
                {/* Icon Cluster */}
                <div className="relative mb-6">
                    <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue relative z-10">
                        <Database size={32} />
                    </div>
                    {/* Floating Elements */}
                    <div className="absolute -right-2 -bottom-2 bg-surface p-1 rounded-lg border border-border-base shadow-sm animate-pulse">
                        <Clock size={16} className="text-amber-500" />
                    </div>
                    <div className="absolute -left-2 -top-2 bg-surface p-1 rounded-lg border border-border-base shadow-sm">
                        <RefreshCw size={16} className="text-secondary animate-spin-slow" />
                    </div>
                </div>

                <h3 className="text-xl font-black text-primary mb-3">
                    Dane w trakcie przetwarzania
                </h3>

                <p className="text-secondary text-sm max-w-md leading-relaxed mb-6">
                    Szczegółowe wyniki tego głosowania (imienna lista posłów) nie zostały jeszcze udostępnione przez system informatyczny Sejmu.
                </p>

                <div className="inline-flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-lg border border-border-base/50 text-xs font-bold text-secondary uppercase tracking-wider">
                    <Clock size={12} />
                    Status: Oczekiwanie na API Sejmu
                </div>
            </div>
        </div>
    );
};

export default DataPendingState;
