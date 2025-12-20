import React from 'react';
import type { Schedule } from '../../types';

interface SwapPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    playerToSwapOut: string | null;
    playerToSwapIn: string | null;
    setPlayerToSwapOut: (id: string | null) => void;
    setPlayerToSwapIn: (id: string | null) => void;
    selectedSchedule: Schedule;
    backupPlayersIds: string[];
    getPlayerName: (id: string) => string;
}

const SwapPlayerModal: React.FC<SwapPlayerModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    playerToSwapOut,
    playerToSwapIn,
    setPlayerToSwapOut,
    setPlayerToSwapIn,
    selectedSchedule,
    backupPlayersIds,
    getPlayerName
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                <h3 className="text-2xl font-bold mb-2">Swap Players</h3>
                <p className="text-white/60 mb-6">
                    {playerToSwapOut && !playerToSwapIn && `Select a player from the bench to replace ${getPlayerName(playerToSwapOut)}.`}
                    {playerToSwapIn && !playerToSwapOut && `Select a player from the playing lineup to be replaced by ${getPlayerName(playerToSwapIn)}.`}
                    {playerToSwapIn && playerToSwapOut && `Swap ${getPlayerName(playerToSwapOut)} with ${getPlayerName(playerToSwapIn)}?`}
                </p>

                <div className="space-y-4 mb-8">
                    {!playerToSwapOut && (
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">Replace Player (Playing)</label>
                            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedSchedule.playingPlayersIds.map(id => (
                                    <button
                                        key={id}
                                        onClick={() => setPlayerToSwapOut(id)}
                                        className={`p-3 rounded-xl border text-left transition-all ${playerToSwapOut === id ? 'border-[#667eea] bg-[#667eea]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        {getPlayerName(id)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!playerToSwapIn && (
                        <div className="space-y-4">
                            {selectedSchedule.benchPlayersIds.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">From Bench</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedSchedule.benchPlayersIds.map(id => (
                                            <button
                                                key={id}
                                                onClick={() => setPlayerToSwapIn(id)}
                                                className={`p-3 rounded-xl border text-left transition-all ${playerToSwapIn === id ? 'border-[#667eea] bg-[#667eea]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                            >
                                                {getPlayerName(id)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {backupPlayersIds.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-[#f093fb] mb-2 flex items-center gap-2">
                                        Backup Players
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f093fb]/10 border border-[#f093fb]/20 uppercase">Available</span>
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {backupPlayersIds.map(id => (
                                            <button
                                                key={id}
                                                onClick={() => setPlayerToSwapIn(id)}
                                                className={`p-3 rounded-xl border text-left transition-all ${playerToSwapIn === id ? 'border-[#667eea] bg-[#667eea]/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                            >
                                                {getPlayerName(id)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedSchedule.benchPlayersIds.length === 0 && backupPlayersIds.length === 0 && (
                                <p className="text-center py-4 text-white/40 italic text-sm border border-dashed border-white/10 rounded-xl">
                                    No bench or backup players available.
                                </p>
                            )}
                        </div>
                    )}

                    {playerToSwapOut && playerToSwapIn && (
                        <div className="flex items-center justify-center gap-4 py-4">
                            <div className="text-center flex-1">
                                <div className="text-xs text-white/40 mb-1">OUT</div>
                                <div className="font-bold text-red-400">{getPlayerName(playerToSwapOut)}</div>
                            </div>
                            <div className="text-white/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <div className="text-center flex-1">
                                <div className="text-xs text-white/40 mb-1">IN</div>
                                <div className="font-bold text-green-400">{getPlayerName(playerToSwapIn)}</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            setPlayerToSwapOut(null);
                            setPlayerToSwapIn(null);
                        }}
                        className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!playerToSwapIn || !playerToSwapOut}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Confirm Swap
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SwapPlayerModal;
