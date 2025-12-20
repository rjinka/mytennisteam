import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import type { Schedule } from '../types';
import toast from 'react-hot-toast';
import { calculateStats } from '../utils/stats';

const SchedulesView: React.FC = () => {
    const { schedules, refreshCurrentGroupData, currentGroup, courts, selectedScheduleId, setSelectedScheduleId, players, user } = useAppContext();

    const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
    const [playerToSwapOut, setPlayerToSwapOut] = useState<string | null>(null);
    const [playerToSwapIn, setPlayerToSwapIn] = useState<string | null>(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [scheduleStats, setScheduleStats] = useState<any[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [rotationButtonStatus, setRotationButtonStatus] = useState<{ visible: boolean, text: string, disabled: boolean, reason?: string }>({
        visible: false,
        text: 'Generate Rotation',
        disabled: false
    });

    const getPlayerName = (id: string) => {
        const player = players.find(p => (p.id || (p as any)._id) === id);
        return player ? player.name : `Player ${id.slice(-4)}`;
    };

    const isAdmin = user && currentGroup && (currentGroup.admins.includes(user.id) || user.isSuperAdmin);

    const currentPlayer = players.find(p => p.userId === user?.id);
    const currentPlayerId = currentPlayer?.id || (currentPlayer as any)?._id;

    // Derived selected schedule - check both id and _id for robustness
    const selectedSchedule = schedules.find(s => (s.id || (s as any)._id) === selectedScheduleId);

    const isRegularPlayer = selectedSchedule && (
        selectedSchedule.playingPlayersIds.includes(currentPlayerId) ||
        selectedSchedule.benchPlayersIds.includes(currentPlayerId)
    );

    const backupPlayers = players.filter(p => {
        const pId = p.id || (p as any)._id;
        const isBackup = p.availability?.some(a => a.scheduleId === selectedScheduleId && a.type === 'Backup');
        const isAlreadyInLineup = selectedSchedule?.playingPlayersIds.some(id => id === pId) ||
            selectedSchedule?.benchPlayersIds.some(id => id === pId);
        return isBackup && !isAlreadyInLineup;
    });
    const backupPlayersIds = backupPlayers.map(p => p.id || (p as any)._id);

    // Effect to handle initial selection and ensure selection is valid
    React.useEffect(() => {
        if (schedules.length > 0) {
            const isValidSelection = schedules.some(s => (s.id || (s as any)._id) === selectedScheduleId);
            if (!selectedScheduleId || !isValidSelection) {
                setSelectedScheduleId(schedules[0].id || (schedules[0] as any)._id);
            }
        } else if (selectedScheduleId !== null) {
            setSelectedScheduleId(null);
        }
    }, [schedules, selectedScheduleId, setSelectedScheduleId]);

    // Fetch rotation button state when selected schedule changes
    React.useEffect(() => {
        const fetchButtonState = async () => {
            if (selectedScheduleId && isAdmin) {
                try {
                    const state = await api.getRotationButtonState(selectedScheduleId);
                    setRotationButtonStatus(state);
                } catch (error) {
                    console.error('Failed to fetch rotation button state:', error);
                }
            }
        };
        fetchButtonState();
    }, [selectedScheduleId, isAdmin]);

    const handleGenerateRotation = async (id: string) => {
        try {
            await api.generateRotation(id);
            toast.success('Rotation generated successfully');
            await refreshCurrentGroupData();
            // Refresh button state
            const state = await api.getRotationButtonState(id);
            setRotationButtonStatus(state);
        } catch (error) {
            toast.error('Failed to generate rotation.');
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
    const [scheduleFormData, setScheduleFormData] = useState({
        name: '',
        day: 0,
        time: '19:00',
        duration: 90,
        courts: [] as { courtId: string, gameType: '0' | '1' }[],
        recurring: false,
        frequency: 2,
        recurrenceCount: 8
    });

    const handleOpenCreateModal = () => {
        setEditingScheduleId(null);
        setScheduleFormData({
            name: '',
            day: 0,
            time: '19:00',
            duration: 90,
            courts: [],
            recurring: false,
            frequency: 2,
            recurrenceCount: 8
        });
        setIsScheduleModalOpen(true);
    };

    const handleOpenEditModal = (schedule: Schedule) => {
        setEditingScheduleId(schedule.id || (schedule as any)._id);
        const mappedCourts = schedule.courts ? schedule.courts.map((c: any) => ({
            courtId: c.courtId || c.id || c,
            gameType: (c.gameType ? String(c.gameType) : '1') as '0' | '1'
        })) : [];

        setScheduleFormData({
            name: schedule.name,
            day: schedule.day,
            time: schedule.time,
            duration: schedule.duration,
            courts: mappedCourts,
            recurring: schedule.recurring || false,
            frequency: schedule.frequency || 2,
            recurrenceCount: schedule.recurrenceCount || 8
        });
        setIsScheduleModalOpen(true);
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentGroup) return;

        try {
            const maxPlayersCount = scheduleFormData.courts.reduce((acc, curr) => acc + (curr.gameType === '1' ? 4 : 2), 0);

            const payload = {
                ...scheduleFormData,
                groupId: currentGroup.id,
                courts: scheduleFormData.courts,
                playingPlayersIds: editingScheduleId ? undefined : [],
                benchPlayersIds: editingScheduleId ? undefined : [],
                recurring: scheduleFormData.recurring,
                frequency: scheduleFormData.recurring ? scheduleFormData.frequency : 0,
                recurrenceCount: scheduleFormData.recurring ? scheduleFormData.recurrenceCount : 0,
                maxPlayersCount
            };

            let savedSchedule: Schedule;

            if (editingScheduleId) {
                savedSchedule = await api.updateSchedule(editingScheduleId, payload);
                toast.success('Schedule updated successfully');
            } else {
                savedSchedule = await api.createSchedule({
                    ...payload,
                    playingPlayersIds: [],
                    benchPlayersIds: []
                });
                toast.success('Schedule created successfully');
            }

            setIsScheduleModalOpen(false);

            // Explicitly set the selected ID to the saved schedule's ID
            const newId = savedSchedule?.id || (savedSchedule as any)?._id;
            if (newId) {
                setSelectedScheduleId(newId);
            }

            await refreshCurrentGroupData();
        } catch (error) {
            console.error(error);
            toast.error(editingScheduleId ? 'Failed to update schedule' : 'Failed to create schedule');
        }
    };

    const handleViewStats = async () => {
        if (!selectedSchedule) return;
        const sId = selectedSchedule.id || (selectedSchedule as any)._id;

        setIsLoadingStats(true);
        setIsStatsModalOpen(true);
        try {
            const stats = await api.getScheduleStats(sId);
            setScheduleStats(stats);
        } catch (error) {
            toast.error('Failed to fetch stats');
            setIsStatsModalOpen(false);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const handleConfirmSwap = async () => {
        if (!selectedSchedule || !playerToSwapOut || !playerToSwapIn) return;

        try {
            const sId = selectedSchedule.id || (selectedSchedule as any)._id;
            await api.swapPlayers(sId, playerToSwapIn, playerToSwapOut);
            toast.success('Players swapped successfully');
            setIsSwapModalOpen(false);
            setPlayerToSwapOut(null);
            setPlayerToSwapIn(null);
            await refreshCurrentGroupData();
        } catch (error) {
            toast.error('Failed to swap players');
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Schedules List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xl font-bold text-white/80">Schedules</h3>
                        {isAdmin && (
                            <button
                                onClick={handleOpenCreateModal}
                                className="btn-primary !px-3 !py-1.5 text-xs whitespace-nowrap shrink-0"
                            >
                                Add New
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {schedules.length === 0 ? (
                            <p className="text-white/40 text-sm italic">No schedules found.</p>
                        ) : (
                            schedules.map((s) => {
                                const sId = s.id || (s as any)._id;
                                return (
                                    <button
                                        key={sId}
                                        onClick={() => setSelectedScheduleId(sId)}
                                        className={`glass-card w-full text-left !p-4 border-l-4 transition-all duration-300 ${(selectedSchedule?.id || (selectedSchedule as any)?._id) === sId
                                            ? 'border-[#667eea] bg-gradient-to-r from-[#667eea]/20 to-transparent shadow-[0_0_15px_rgba(102,126,234,0.3)]'
                                            : 'border-transparent hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold">{s.name}</h4>
                                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/60">
                                                {days[s.day]}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/40 mt-1">{s.time} • {s.duration} mins</p>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: Selected Schedule Details */}
                <div className="lg:col-span-2">
                    {selectedSchedule ? (
                        <div className="glass-card space-y-8 animate-fadeIn">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">{selectedSchedule.name}</h3>
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
                                                    onClick={() => toast.success('Sign-ups (Coming Soon)')}
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
                                                    onClick={() => {
                                                        toast((t) => (
                                                            <div className="flex flex-col gap-2">
                                                                <p className="font-medium">Delete schedule "{selectedSchedule.name}"?</p>
                                                                <p className="text-sm text-gray-400">This cannot be undone.</p>
                                                                <div className="flex gap-2 mt-2">
                                                                    <button
                                                                        onClick={async () => {
                                                                            toast.dismiss(t.id);
                                                                            try {
                                                                                const sId = selectedSchedule.id || (selectedSchedule as any)._id;
                                                                                await api.deleteSchedule(sId);
                                                                                toast.success('Schedule deleted');
                                                                                await refreshCurrentGroupData();
                                                                                setSelectedScheduleId(null);
                                                                            } catch (error) {
                                                                                toast.error('Failed to delete schedule');
                                                                            }
                                                                        }}
                                                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                    <button
                                                                        onClick={() => toast.dismiss(t.id)}
                                                                        className="bg-white/10 text-white px-3 py-1 rounded text-sm hover:bg-white/20"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ), { duration: 5000 });
                                                    }}
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
                                                onClick={() => handleGenerateRotation(selectedSchedule.id || (selectedSchedule as any)._id)}
                                                disabled={rotationButtonStatus.disabled}
                                                className={`btn-primary whitespace-nowrap text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-3 ${rotationButtonStatus.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                title={rotationButtonStatus.reason}
                                            >
                                                {rotationButtonStatus.text}
                                            </button>
                                        )}
                                    </div>
                                </div>

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
                                                                onClick={() => {
                                                                    setPlayerToSwapOut(id);
                                                                    setIsSwapModalOpen(true);
                                                                }}
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
                                                                onClick={() => {
                                                                    setPlayerToSwapIn(id);
                                                                    setIsSwapModalOpen(true);
                                                                }}
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
                    ) : (
                        <div className="glass-card h-full flex flex-col items-center justify-center text-center p-12 space-y-4 opacity-40">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xl font-medium">Select a schedule to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6">{editingScheduleId ? 'Edit Schedule' : 'Add New Schedule'}</h3>
                        <form onSubmit={handleSaveSchedule} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Schedule Name</label>
                                <input
                                    type="text"
                                    value={scheduleFormData.name}
                                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                    placeholder="e.g. Weekly Practice"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Day</label>
                                    <select
                                        value={scheduleFormData.day}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, day: parseInt(e.target.value) })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors appearance-none"
                                    >
                                        {days.map((day, index) => (
                                            <option key={index} value={index}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Time</label>
                                    <input
                                        type="time"
                                        value={scheduleFormData.time}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, time: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={scheduleFormData.duration}
                                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, duration: parseInt(e.target.value) })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                    min="30"
                                    step="15"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Courts</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto bg-black/20 border border-white/10 rounded-xl p-3">
                                    {courts.length === 0 ? (
                                        <p className="text-white/40 text-sm italic">No courts available.</p>
                                    ) : (
                                        courts.map(court => {
                                            const isSelected = scheduleFormData.courts.some(c => c.courtId === court.id);
                                            const selectedCourt = scheduleFormData.courts.find(c => c.courtId === court.id);

                                            return (
                                                <div key={court.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                const newCourts = e.target.checked
                                                                    ? [...scheduleFormData.courts, { courtId: court.id, gameType: '1' as const }]
                                                                    : scheduleFormData.courts.filter(c => c.courtId !== court.id);
                                                                setScheduleFormData({ ...scheduleFormData, courts: newCourts });
                                                            }}
                                                            className="rounded border-white/20 bg-white/5 text-[#667eea] focus:ring-[#667eea]"
                                                        />
                                                        <span className="text-sm">{court.name}</span>
                                                    </label>
                                                    {isSelected && selectedCourt && (
                                                        <select
                                                            value={selectedCourt.gameType}
                                                            onChange={(e) => {
                                                                const newCourts = scheduleFormData.courts.map(c =>
                                                                    c.courtId === court.id ? { ...c, gameType: e.target.value as '0' | '1' } : c
                                                                );
                                                                setScheduleFormData({ ...scheduleFormData, courts: newCourts });
                                                            }}
                                                            className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#667eea] transition-colors"
                                                        >
                                                            <option value="1">Doubles</option>
                                                            <option value="0">Singles</option>
                                                        </select>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-white/10">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={scheduleFormData.recurring}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, recurring: e.target.checked })}
                                        className="rounded border-white/20 bg-white/5 text-[#667eea] focus:ring-[#667eea]"
                                    />
                                    <span className="font-medium">Make this a recurring schedule</span>
                                </label>

                                {scheduleFormData.recurring && (
                                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                        <div>
                                            <label className="block text-sm font-medium text-white/60 mb-2">Recurrence</label>
                                            <select
                                                value={scheduleFormData.frequency}
                                                onChange={(e) => setScheduleFormData({ ...scheduleFormData, frequency: parseInt(e.target.value) })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors appearance-none"
                                            >
                                                <option value={1}>Daily</option>
                                                <option value={2}>Weekly</option>
                                                <option value={3}>Bi-Weekly</option>
                                                <option value={4}>Monthly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-white/60 mb-2">Number of Occurrences</label>
                                            <input
                                                type="number"
                                                value={scheduleFormData.recurrenceCount}
                                                onChange={(e) => setScheduleFormData({ ...scheduleFormData, recurrenceCount: parseInt(e.target.value) })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    {editingScheduleId ? 'Update Schedule' : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Swap Player Modal */}
            {isSwapModalOpen && selectedSchedule && (
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
                                    setIsSwapModalOpen(false);
                                    setPlayerToSwapOut(null);
                                    setPlayerToSwapIn(null);
                                }}
                                className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSwap}
                                disabled={!playerToSwapIn || !playerToSwapOut}
                                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm Swap
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Stats Modal */}
            {isStatsModalOpen && selectedSchedule && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-bold">Schedule Stats</h3>
                                <p className="text-white/40">{selectedSchedule.name}</p>
                            </div>
                            <button
                                onClick={() => setIsStatsModalOpen(false)}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {isLoadingStats ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-12 h-12 border-4 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-white/40">Loading stats...</p>
                            </div>
                        ) : scheduleStats.length === 0 ? (
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
                                            {scheduleStats.map((stat: any) => {
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
                                onClick={() => setIsStatsModalOpen(false)}
                                className="w-full py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SchedulesView;
