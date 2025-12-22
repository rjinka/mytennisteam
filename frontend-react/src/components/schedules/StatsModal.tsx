import React from 'react';
import { calculateStats } from '../../utils/stats';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    stats: any[];
    isLoading: boolean;
    scheduleName: string;
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats, isLoading, scheduleName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold">Schedule Stats</h3>
                        <p className="text-white/40">{scheduleName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-12 h-12 border-4 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white/40">Loading stats...</p>
                    </div>
                ) : stats.length === 0 ? (
                    <div className="text-center py-12 opacity-40">
                        <p className="text-lg italic">No stats recorded for this schedule yet.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-4 px-4 font-bold text-white/60">Player</th>
                                        <th className="py-4 px-4 font-bold text-white/60 text-center">Played</th>
                                        <th className="py-4 px-4 font-bold text-white/60 text-center">Benched</th>
                                        <th className="py-4 px-4 font-bold text-white/60 text-center">Total</th>
                                        <th className="py-4 px-4 font-bold text-white/60 text-right">Play %</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.map((stat: any) => {
                                        const { playedCount, benchedCount, total, playPercentage } = calculateStats(stat.stats);
                                        const playerName = stat.playerId?.user?.name || 'Unknown';
                                        const playerPic = stat.playerId?.user?.picture;

                                        return (
                                            <tr key={stat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-3">
                                                        {playerPic ? (
                                                            <img src={playerPic} alt={playerName} className="w-8 h-8 shrink-0 rounded-full object-cover border border-white/10" />
                                                        ) : (
                                                            <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold border border-white/10">
                                                                {playerName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="font-medium">{playerName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-center text-green-400/80 font-mono">{playedCount}</td>
                                                <td className="py-4 px-4 text-center text-red-400/80 font-mono">{benchedCount}</td>
                                                <td className="py-4 px-4 text-center text-white/40 font-mono">{total}</td>
                                                <td className="py-4 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-[#667eea] to-[#764ba2]"
                                                                style={{ width: `${playPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="font-bold text-sm">{playPercentage}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatsModal;
