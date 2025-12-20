import React from 'react';
import type { Schedule, Player } from '../../types';

interface ActiveGameDisplayProps {
    selectedSchedule: Schedule | undefined;
    selectedScheduleId: string | null;
    isAdmin: boolean;
    currentPlayerId: string;
    isRegularPlayer: boolean;
    rotationButtonStatus: { visible: boolean, text: string, disabled: boolean, reason?: string };
    handleOpenEditModal: (schedule: Schedule) => void;
    handleViewSignups: () => void;
    handleViewStats: () => void;
    handleGenerateRotation: (id: string) => void;
    handleUpdateSignupAvailability: (playerId: string, type: string | null) => void;
    handleSwapPlayer: (playerId: string, type: 'in' | 'out') => void;
    handleDeleteSchedule: (schedule: Schedule) => void;
    days: string[];
    getPlayerName: (id: string) => string;
    currentPlayer: Player | undefined;
}

const ActiveGameDisplay: React.FC<ActiveGameDisplayProps> = ({
    selectedSchedule,
    selectedScheduleId,
    isAdmin,
    currentPlayerId,
    isRegularPlayer,
    rotationButtonStatus,
    handleOpenEditModal,
    handleViewSignups,
    handleViewStats,
    handleGenerateRotation,
    handleUpdateSignupAvailability,
    handleSwapPlayer,
    handleDeleteSchedule,
    days,
    getPlayerName,
    currentPlayer
}) => {
    if (!selectedSchedule) {
        return (
            <div className="glass-card h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p className="text-xl font-medium">Select a schedule to view details</p>
            </div>
        );
    }

    const sId = selectedSchedule.id || (selectedSchedule as any)._id;

    return (
        <div className="glass-card space-y-8 animate-fadeIn">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-bold">{selectedSchedule.name}</h3>
                            {selectedSchedule.recurring && (
                                <span className="text-sm bg-[#667eea]/20 text-[#667eea] px-3 py-1 rounded-full font-medium">
                                    Occurrence #{selectedSchedule.occurrenceNumber}
                                </span>
                            )}
                        </div>
                        <p className="text-white/40">{days[selectedSchedule.day]} at {selectedSchedule.time}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex bg-white/5 rounded-lg p-1">
                            {isAdmin && (
                                <button
                                    onClick={() => handleOpenEditModal(selectedSchedule)}
                                    className="p-2 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                    title="Edit Schedule"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            )}
                            {isAdmin && selectedSchedule.status === 'PLANNING' && (
                                <button
                                    onClick={handleViewSignups}
                                    className="p-2 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                    title="Sign-ups"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={handleViewStats}
                                className="p-2 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                title="Stats"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => handleDeleteSchedule(selectedSchedule)}
                                    className="p-2 rounded-md hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                    title="Delete Schedule"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        {isAdmin && rotationButtonStatus.visible && (
                            <button
                                onClick={() => handleGenerateRotation(sId)}
                                disabled={rotationButtonStatus.disabled}
                                className={`btn-primary whitespace-nowrap text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 ${rotationButtonStatus.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={rotationButtonStatus.reason}
                            >
                                {rotationButtonStatus.text}
                            </button>
                        )}
                    </div>
                </div>

                {selectedSchedule.status === 'PLANNING' && (
                    <div className="bg-[#667eea]/10 border border-[#667eea]/20 rounded-2xl p-6 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-[#667eea]/20 flex items-center justify-center text-[#667eea]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">Schedule Signup</h4>
                                    <p className="text-sm text-white/60">Set your availability for this schedule</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['Rotation', 'Permanent', 'Backup'].map((type) => {
                                    const isSelected = currentPlayer?.availability?.some(a => a.scheduleId === selectedScheduleId && a.type === type);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleUpdateSignupAvailability(currentPlayerId, isSelected ? null : type)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isSelected
                                                ? 'bg-[#667eea] text-white shadow-[0_0_15px_rgba(102,126,234,0.4)]'
                                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-[#56ab2f] flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#56ab2f]"></div>
                            Playing
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {selectedSchedule.playingPlayersIds.length === 0 ? (
                                <p className="text-white/20 text-sm italic">No players assigned.</p>
                            ) : (
                                selectedSchedule.playingPlayersIds.map(id => (
                                    <div key={id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center group">
                                        <span className="font-medium">{getPlayerName(id)}</span>
                                        {(isAdmin || (id === currentPlayerId && isRegularPlayer)) && (
                                            <button
                                                onClick={() => handleSwapPlayer(id, 'out')}
                                                className="text-white/40 hover:text-white transition-colors text-sm font-medium bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg"
                                            >
                                                Swap
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-[#f093fb] flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#f093fb]"></div>
                            Bench
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {selectedSchedule.benchPlayersIds.length === 0 ? (
                                <p className="text-white/20 text-sm italic">No players on bench.</p>
                            ) : (
                                selectedSchedule.benchPlayersIds.map(id => (
                                    <div key={id} className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between items-center group">
                                        <span className="font-medium">{getPlayerName(id)}</span>
                                        {(isAdmin || (id === currentPlayerId && isRegularPlayer)) && (
                                            <button
                                                onClick={() => handleSwapPlayer(id, 'in')}
                                                className="text-white/40 hover:text-white transition-colors text-sm font-medium bg-white/5 hover:bg-white/10 px-3 py-1 rounded-lg"
                                            >
                                                Swap
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActiveGameDisplay;
