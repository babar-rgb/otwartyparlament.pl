import { Link } from 'react-router-dom';
import { AlertTriangle, User } from 'lucide-react';

interface VoteResult {
    vote: string;
    mps: {
        name: string;
        party: string;
        photo_url: string;
        id: number;
        slug?: string;
    };
}

interface PartyStats {
    yes: number;
    no: number;
    abstain: number;
    absent: number;
}

interface OutliersSectionProps {
    results: VoteResult[];
    partyStats: Record<string, PartyStats>;
}

interface Outlier {
    mp: VoteResult['mps'];
    vote: string;
    expectedVote: string;
}

export default function OutliersSection({ results, partyStats }: OutliersSectionProps) {
    // Calculate outliers: MPs who voted differently from their party's majority
    const outliers: Outlier[] = [];

    // For each party, determine majority vote
    const partyMajority: Record<string, string> = {};

    Object.entries(partyStats).forEach(([party, stats]) => {
        const maxVotes = Math.max(stats.yes, stats.no, stats.abstain);
        if (stats.yes === maxVotes) partyMajority[party] = 'YES';
        else if (stats.no === maxVotes) partyMajority[party] = 'NO';
        else partyMajority[party] = 'ABSTAIN';
    });

    // Find MPs who voted differently
    results.forEach(result => {
        const party = result.mps?.party;
        if (!party || result.vote === 'ABSENT') return;

        const expected = partyMajority[party];
        if (expected && result.vote !== expected) {
            outliers.push({
                mp: result.mps,
                vote: result.vote,
                expectedVote: expected
            });
        }
    });

    // Group outliers by party
    const outliersByParty: Record<string, Outlier[]> = {};
    outliers.forEach(outlier => {
        const party = outlier.mp.party;
        if (!outliersByParty[party]) outliersByParty[party] = [];
        outliersByParty[party].push(outlier);
    });

    // Sort parties by number of outliers
    const sortedParties = Object.entries(outliersByParty)
        .sort((a, b) => b[1].length - a[1].length);

    if (outliers.length === 0) {
        return null; // No outliers = highly disciplined vote
    }

    const getVoteLabel = (vote: string) => {
        switch (vote) {
            case 'YES': return 'ZA';
            case 'NO': return 'PRZECIW';
            case 'ABSTAIN': return 'WSTRZ.';
            default: return vote;
        }
    };

    const getVoteColor = (vote: string) => {
        switch (vote) {
            case 'YES': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'NO': return 'bg-red-100 text-red-700 border-red-200';
            case 'ABSTAIN': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-6 md:p-8 border border-amber-200 dark:border-amber-800/50 mb-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-amber-900 dark:text-amber-100">
                        Buntownicy ({outliers.length})
                    </h2>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Posłowie, którzy głosowali wbrew większości swojego klubu
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {sortedParties.map(([party, partyOutliers]) => (
                    <div key={party}>
                        <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-3">
                            {party} ({partyOutliers.length} {partyOutliers.length === 1 ? 'poseł' : 'posłów'})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {partyOutliers.map((outlier, idx) => (
                                <Link
                                    key={idx}
                                    to={`/poslowie/${outlier.mp.slug || outlier.mp.id}`}
                                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-amber-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all group"
                                >
                                    {outlier.mp.photo_url ? (
                                        <img
                                            src={outlier.mp.photo_url}
                                            alt={outlier.mp.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/40/E2E8F0/64748B?text=MP';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex-grow min-w-0">
                                        <div className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                            {outlier.mp.name}
                                        </div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Klub głosował: {getVoteLabel(outlier.expectedVote)}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold border shrink-0 ${getVoteColor(outlier.vote)}`}>
                                        {getVoteLabel(outlier.vote)}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
