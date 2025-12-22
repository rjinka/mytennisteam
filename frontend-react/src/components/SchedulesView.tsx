import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import type { Schedule } from '../types';
import toast from 'react-hot-toast';
import ScheduleCard from './schedules/ScheduleCard';
import ActiveGameDisplay from './schedules/ActiveGameDisplay';
import ScheduleFormModal from './schedules/ScheduleFormModal';
import SwapPlayerModal from './schedules/SwapPlayerModal';
import StatsModal from './schedules/StatsModal';
import SignupsModal from './schedules/SignupsModal';
import ConfirmationModal from './schedules/ConfirmationModal';

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
    const [isSignupsListModalOpen, setIsSignupsListModalOpen] = useState(false);
    const [signupsList, setSignupsList] = useState<any[]>([]);
    const [isLoadingSignups, setIsLoadingSignups] = useState(false);

    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<{ type: 'finish' | 'generate', scheduleId: string } | null>(null);

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

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

    const scheduleSignups = players.map(p => {
        const availability = p.availability?.find(a => a.scheduleId === selectedScheduleId);
        return {
            playerId: p.id || (p as any)._id,
            playerName: p.name,
            availabilityType: availability ? availability.type : null
        };
    });

    // Effect to handle initial selection and ensure selection is valid
    useEffect(() => {
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
    useEffect(() => {
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

    const executeGenerateRotation = async (id: string) => {
        try {
            const updatedSchedule = await api.generateRotation(id);
            if (updatedSchedule.status === 'COMPLETED') {
                toast.success('Schedule finished successfully');
            } else {
                toast.success('Rotation generated successfully');
            }
            await refreshCurrentGroupData();
            // Refresh button state
            const state = await api.getRotationButtonState(id);
            setRotationButtonStatus(state);
        } catch (error) {
            toast.error('Failed to update schedule.');
        }
    };

    const handleGenerateRotation = async (id: string) => {
        if (rotationButtonStatus.text === 'Finish Schedule') {
            setConfirmationAction({ type: 'finish', scheduleId: id });
            setIsConfirmationModalOpen(true);
            return;
        }
        await executeGenerateRotation(id);
    };

    const handleConfirmAction = async () => {
        if (!confirmationAction) return;
        setIsConfirmationModalOpen(false);
        await executeGenerateRotation(confirmationAction.scheduleId);
        setConfirmationAction(null);
    };

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

            await refreshCurrentGroupData();

            // Explicitly set the selected ID to the saved schedule's ID
            const newId = savedSchedule?.id || (savedSchedule as any)?._id;
            if (newId) {
                setSelectedScheduleId(newId);
            }
        } catch (error) {
            console.error(error);
            toast.error(editingScheduleId ? 'Failed to update schedule' : 'Failed to create schedule');
        }
    };

    const handleViewSignups = async () => {
        if (!selectedScheduleId) return;
        setIsLoadingSignups(true);
        setIsSignupsListModalOpen(true);
        try {
            const signups = await api.getScheduleSignups(selectedScheduleId);
            setSignupsList(signups);
        } catch (error) {
            toast.error('Failed to fetch signups');
            setIsSignupsListModalOpen(false);
        } finally {
            setIsLoadingSignups(false);
        }
    };

    const handleUpdateSignupAvailability = async (playerId: string, type: string | null) => {
        if (!selectedScheduleId) return;
        try {
            const player = players.find(p => (p.id || (p as any)._id) === playerId);
            if (!player) return;

            const existingAvailability = player.availability || [];
            const otherAvailabilities = existingAvailability.filter(a =>
                (a.scheduleId.toString() !== selectedScheduleId)
            );

            const newAvailability = type
                ? [...otherAvailabilities, { scheduleId: selectedScheduleId, type: type as any }]
                : otherAvailabilities;

            await api.updatePlayer(playerId, {
                availability: newAvailability
            });
            await refreshCurrentGroupData();

            // Refresh rotation button state
            if (isAdmin && selectedScheduleId) {
                const state = await api.getRotationButtonState(selectedScheduleId);
                setRotationButtonStatus(state);
            }

            // If signups list is open, refresh it too
            if (isSignupsListModalOpen) {
                const signups = await api.getScheduleSignups(selectedScheduleId);
                setSignupsList(signups);
            }

            toast.success(type ? `Availability set to ${type}` : 'Availability removed');
        } catch (error) {
            console.error('Error updating availability:', error);
            toast.error('Failed to update availability');
        }
    };

    const handleCompletePlanning = async () => {
        if (!selectedScheduleId) return;
        try {
            await api.completePlanning(selectedScheduleId);
            toast.success('Planning completed');
            await refreshCurrentGroupData();
            if (isAdmin) {
                const state = await api.getRotationButtonState(selectedScheduleId);
                setRotationButtonStatus(state);
            }
        } catch (error) {
            console.error('Error completing planning:', error);
            toast.error('Failed to complete planning');
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

    const handleDeleteSchedule = (schedule: Schedule) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium">Delete schedule "{schedule.name}"?</p>
                <p className="text-sm text-gray-400">This cannot be undone.</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const sId = schedule.id || (schedule as any)._id;
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
    };

    const handleSwapPlayer = (playerId: string, type: 'in' | 'out') => {
        if (type === 'out') {
            setPlayerToSwapOut(playerId);
        } else {
            setPlayerToSwapIn(playerId);
        }
        setIsSwapModalOpen(true);
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
                                    <ScheduleCard
                                        key={sId}
                                        schedule={s}
                                        isSelected={(selectedSchedule?.id || (selectedSchedule as any)?._id) === sId}
                                        onClick={() => setSelectedScheduleId(sId)}
                                        days={days}
                                    />
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Column: Selected Schedule Details */}
                <div className="lg:col-span-2">
                    <ActiveGameDisplay
                        selectedSchedule={selectedSchedule}
                        selectedScheduleId={selectedScheduleId}
                        isAdmin={!!isAdmin}
                        currentPlayerId={currentPlayerId}
                        isRegularPlayer={!!isRegularPlayer}
                        rotationButtonStatus={rotationButtonStatus}
                        handleOpenEditModal={handleOpenEditModal}
                        handleViewSignups={handleViewSignups}
                        handleViewStats={handleViewStats}
                        handleGenerateRotation={handleGenerateRotation}
                        handleUpdateSignupAvailability={handleUpdateSignupAvailability}
                        handleSwapPlayer={handleSwapPlayer}
                        handleDeleteSchedule={handleDeleteSchedule}
                        days={days}
                        getPlayerName={getPlayerName}
                        currentPlayer={currentPlayer}
                    />
                </div>
            </div>

            {/* Modals */}
            <ScheduleFormModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSubmit={handleSaveSchedule}
                formData={scheduleFormData}
                setFormData={setScheduleFormData}
                isEditing={!!editingScheduleId}
                courts={courts}
                days={days}
            />

            {selectedSchedule && (
                <SwapPlayerModal
                    isOpen={isSwapModalOpen}
                    onClose={() => {
                        setIsSwapModalOpen(false);
                        setPlayerToSwapOut(null);
                        setPlayerToSwapIn(null);
                    }}
                    onConfirm={handleConfirmSwap}
                    playerToSwapOut={playerToSwapOut}
                    playerToSwapIn={playerToSwapIn}
                    setPlayerToSwapOut={setPlayerToSwapOut}
                    setPlayerToSwapIn={setPlayerToSwapIn}
                    selectedSchedule={selectedSchedule}
                    backupPlayersIds={backupPlayersIds}
                    getPlayerName={getPlayerName}
                />
            )}

            <StatsModal
                isOpen={isStatsModalOpen}
                onClose={() => setIsStatsModalOpen(false)}
                stats={scheduleStats}
                isLoading={isLoadingStats}
                scheduleName={selectedSchedule?.name || ''}
            />

            <SignupsModal
                isOpen={isSignupsListModalOpen}
                onClose={() => setIsSignupsListModalOpen(false)}
                signups={signupsList}
                isLoading={isLoadingSignups}
                isAdmin={!!isAdmin}
                scheduleStatus={selectedSchedule?.status || ''}
                scheduleName={selectedSchedule?.name || ''}
                handleUpdateSignupAvailability={handleUpdateSignupAvailability}
                handleCompletePlanning={handleCompletePlanning}
            />

            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                onClose={() => setIsConfirmationModalOpen(false)}
                onConfirm={handleConfirmAction}
            />
        </>
    );
};

export default SchedulesView;
