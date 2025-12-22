import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import type { Player, PlayerAvailability } from '../types';
import toast from 'react-hot-toast';
import { calculateStats } from '../utils/stats';

const PlayersView: React.FC = () => {
    const { players, user, currentGroup, schedules, refreshCurrentGroupData } = useAppContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [isPlayerStatsModalOpen, setIsPlayerStatsModalOpen] = useState(false);
    const [playerStats, setPlayerStats] = useState<any[]>([]);
    const [isLoadingPlayerStats, setIsLoadingPlayerStats] = useState(false);
    const [selectedPlayerForStats, setSelectedPlayerForStats] = useState<Player | null>(null);
    const [formData, setFormData] = useState<{
        name: string;
        availability: PlayerAvailability[];
    }>({
        name: '',
        availability: []
    });

    const isAdmin = !!(user && currentGroup && (currentGroup.admins.includes(user.id) || user.isSuperAdmin));

    const handleEditPlayer = (player: Player) => {
        setEditingPlayer(player);
        setFormData({
            name: player.name,
            availability: player.availability || []
        });
        setIsEditModalOpen(true);
    };

    const handleSavePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlayer) return;

        try {
            await api.updatePlayer(editingPlayer.id, {
                name: formData.name,
                availability: formData.availability
            });
            toast.success('Player updated successfully');
            setIsEditModalOpen(false);
            await refreshCurrentGroupData();
        } catch (error) {
            toast.error('Failed to update player');
        }
    };

    const handleDeletePlayer = async (playerId: string, playerName: string, isSelf: boolean = false) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium">{isSelf ? 'Leave this group?' : `Remove "${playerName}" from group?`}</p>
                <p className="text-sm text-gray-400">{isSelf ? "You will no longer be able to see this group's schedules." : "This will remove them from all schedules."}</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.deletePlayer(playerId);
                                toast.success(isSelf ? 'Left group' : 'Player removed');
                                if (isSelf) {
                                    window.location.reload(); // Refresh to update group list and UI
                                } else {
                                    await refreshCurrentGroupData();
                                }
                            } catch (error) {
                                toast.error(isSelf ? 'Failed to leave group' : 'Failed to remove player');
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                        {isSelf ? 'Leave' : 'Remove'}
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

    const handleViewPlayerStats = async (player: Player) => {
        setSelectedPlayerForStats(player);
        setIsLoadingPlayerStats(true);
        setIsPlayerStatsModalOpen(true);
        try {
            const stats = await api.getPlayerStats(player.id);
            setPlayerStats(stats);
        } catch (error) {
            toast.error('Failed to fetch player stats');
            setIsPlayerStatsModalOpen(false);
        } finally {
            setIsLoadingPlayerStats(false);
        }
    };

    const handleInvitePlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentGroup || !inviteEmail) return;

        setIsInviting(true);
        try {
            await api.invitePlayer(currentGroup.id, inviteEmail);
            toast.success('Invitation sent successfully!');
            setIsInviteModalOpen(false);
            setInviteEmail('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invitation');
        } finally {
            setIsInviting(false);
        }
    };

    const updateAvailability = (scheduleId: string, type: 'Rotation' | 'Permanent' | 'Backup' | '') => {
        setFormData(prev => {
            const otherAvailabilities = prev.availability.filter(a => a.scheduleId !== scheduleId);
            const newAvailability = type
                ? [...otherAvailabilities, { scheduleId, type: type as any }]
                : otherAvailabilities;

            return { ...prev, availability: newAvailability };
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isAdmin && (
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="relative h-[340px] rounded-3xl overflow-hidden group border-dashed border-2 border-white/10 hover:border-[#667eea]/50 hover:bg-[#667eea]/5 transition-all flex flex-col items-center justify-center gap-4"
                    >
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-[#667eea] group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-[#667eea]/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <div className="text-center px-6">
                            <h4 className="font-bold text-white/90 text-xl">Invite Player</h4>
                            <p className="text-sm text-white/40 mt-2">Add a new member to your squad</p>
                        </div>
                    </button>
                )}
                {players.length === 0 && !isAdmin ? (
                    <div className="col-span-full glass-card text-center py-12 opacity-40">
                        <p className="text-lg italic">No players in this group yet.</p>
                    </div>
                ) : (
                    players.map((player) => {
                        const canEdit = !!(isAdmin || (user && player.userId === user.id));
                        const isSelf = !!(user && player.userId === user.id);
                        const isAdminPlayer = currentGroup?.admins.includes(player.userId);

                        return (
                            <div key={player.id} className="relative h-[340px] rounded-3xl overflow-hidden group bg-[#1e2030] border border-white/5 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:border-white/10 flex flex-col">
                                {/* Header Gradient */}
                                <div className={`h-28 w-full relative ${isAdminPlayer ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2]' : 'bg-gradient-to-r from-slate-700 to-slate-600'}`}>
                                    {/* Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

                                    {/* Top Badges */}
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        {isAdminPlayer && (
                                            <span className="px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10 shadow-lg">
                                                Admin
                                            </span>
                                        )}
                                        {isSelf && (
                                            <span className="px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-md text-green-300 text-[10px] font-bold uppercase tracking-wider border border-green-500/30 shadow-lg flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                                You
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Avatar & Content */}
                                <div className="flex-1 flex flex-col items-center px-6 -mt-14 relative z-10">
                                    {/* Avatar */}
                                    <div className="relative group-hover:scale-105 transition-transform duration-300">
                                        {(player as any).picture ? (
                                            <img
                                                src={(player as any).picture}
                                                alt={player.name}
                                                className="w-28 h-28 rounded-full object-cover border-[6px] border-[#1e2030] shadow-2xl bg-[#1e2030]"
                                            />
                                        ) : (
                                            <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white border-[6px] border-[#1e2030] shadow-2xl ${isAdminPlayer ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2]' : 'bg-slate-600'}`}>
                                                {(player.name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="text-center mt-4 w-full">
                                        <h4 className="font-bold text-xl text-white truncate leading-tight">
                                            {player.name || 'Unknown'}
                                        </h4>
                                        <p className="text-sm text-white/40 truncate mt-1 font-medium">
                                            {player.email}
                                        </p>
                                    </div>

                                    {/* Action Buttons - Always visible but subtle */}
                                    <div className="mt-auto mb-6 flex items-center justify-center gap-3 w-full">
                                        {canEdit && (
                                            <button
                                                onClick={() => handleEditPlayer(player)}
                                                className="p-3 rounded-2xl bg-white/5 hover:bg-[#667eea]/20 hover:text-[#667eea] text-white/70 transition-all duration-200 border border-white/5 hover:border-[#667eea]/30 group/btn"
                                                title="Edit Profile"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover/btn:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleViewPlayerStats(player)}
                                            className="p-3 rounded-2xl bg-white/5 hover:bg-[#667eea]/20 hover:text-[#667eea] text-white/70 transition-all duration-200 border border-white/5 hover:border-[#667eea]/30 group/btn"
                                            title="View Stats"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </button>
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeletePlayer(player.id, player.name, isSelf)}
                                                className="p-3 rounded-2xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-white/70 transition-all duration-200 border border-white/5 hover:border-red-500/30 group/btn"
                                                title={isSelf ? "Leave Group" : "Remove Player"}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover/btn:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Edit Player Modal */}
            {
                isEditModalOpen && editingPlayer && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 mb-8">
                                {(editingPlayer as any).picture ? (
                                    <img
                                        src={(editingPlayer as any).picture}
                                        alt={editingPlayer.name}
                                        className="w-16 h-16 shrink-0 rounded-full object-cover border-2 border-[#667eea]"
                                    />
                                ) : (
                                    <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center font-bold text-2xl border-2 border-[#667eea]">
                                        {(editingPlayer.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-2xl font-bold">{editingPlayer.name}</h3>
                                    <p className="text-white/40">{editingPlayer.email}</p>
                                </div>
                            </div>

                            <form onSubmit={handleSavePlayer} className="space-y-8">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                        placeholder="Enter name"
                                        required
                                    />
                                </div>

                                <div>
                                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#667eea]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                                        </svg>
                                        Schedule Availability
                                    </h4>
                                    <div className="space-y-3">
                                        {schedules.length === 0 ? (
                                            <p className="text-white/40 italic text-sm">No schedules defined for this group.</p>
                                        ) : (
                                            schedules.map(schedule => {
                                                const availability = formData.availability.find(a => a.scheduleId === schedule.id);

                                                const isDisabled = !isAdmin && (schedule.status === 'ACTIVE' || schedule.status === 'COMPLETED');

                                                return (
                                                    <div key={schedule.id} className={`flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 transition-colors ${isDisabled ? 'opacity-50' : 'hover:border-white/10'}`}>
                                                        <div>
                                                            <p className="font-medium">{schedule.name}</p>
                                                            <p className="text-xs text-white/40">
                                                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][schedule.day]} at {schedule.time}
                                                            </p>
                                                        </div>
                                                        <select
                                                            value={availability?.type || ''}
                                                            onChange={(e) => updateAvailability(schedule.id, e.target.value as any)}
                                                            disabled={isDisabled}
                                                            title={isDisabled ? "Only admins can change availability for active or completed schedules" : ""}
                                                            className={`bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#667eea] transition-colors ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                        >
                                                            <option value="">Not Signed Up</option>
                                                            <option value="Rotation">Rotation</option>
                                                            <option value="Permanent">Permanent</option>
                                                            <option value="Backup">Backup</option>
                                                        </select>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 btn-primary"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Invite Player Modal */}
            {
                isInviteModalOpen && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-[#667eea]/20 flex items-center justify-center text-[#667eea]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Invite Player</h3>
                                    <p className="text-white/40 text-sm">Send an email invitation to join</p>
                                </div>
                            </div>

                            <form onSubmit={handleInvitePlayer} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                        placeholder="player@gmail.com"
                                        required
                                    />
                                    <p className="text-[10px] text-white/30 mt-2 italic">Note: Only @gmail.com accounts are currently supported.</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsInviteModalOpen(false);
                                            setInviteEmail('');
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isInviting || !inviteEmail.toLowerCase().endsWith('@gmail.com') || inviteEmail.length <= 10}
                                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isInviting ? 'Sending...' : 'Send Invite'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
            {/* Player Stats Modal */}
            {
                isPlayerStatsModalOpen && selectedPlayerForStats && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    {(selectedPlayerForStats as any).picture ? (
                                        <img
                                            src={(selectedPlayerForStats as any).picture}
                                            alt={selectedPlayerForStats.name}
                                            className="w-12 h-12 shrink-0 rounded-full object-cover border-2 border-[#667eea]"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center font-bold text-lg border-2 border-[#667eea]">
                                            {(selectedPlayerForStats.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-2xl font-bold">{selectedPlayerForStats.name}</h3>
                                        <p className="text-white/40">Performance across all schedules</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsPlayerStatsModalOpen(false)}
                                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {isLoadingPlayerStats ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-12 h-12 border-4 border-[#667eea] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-white/40">Loading stats...</p>
                                </div>
                            ) : playerStats.length === 0 ? (
                                <div className="text-center py-12 opacity-40">
                                    <p className="text-lg italic">No stats recorded for this player yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="py-4 px-4 font-bold text-white/60">Schedule</th>
                                                    <th className="py-4 px-4 font-bold text-white/60 text-center">Played</th>
                                                    <th className="py-4 px-4 font-bold text-white/60 text-center">Benched</th>
                                                    <th className="py-4 px-4 font-bold text-white/60 text-center">Total</th>
                                                    <th className="py-4 px-4 font-bold text-white/60 text-right">Play %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {playerStats.map((stat: any) => {
                                                    const { playedCount, benchedCount, total, playPercentage } = calculateStats(stat.stats);
                                                    const scheduleName = stat.scheduleId?.name || 'Unknown Schedule';

                                                    return (
                                                        <tr key={stat.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                                            <td className="py-4 px-4">
                                                                <span className="font-medium">{scheduleName}</span>
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
                                    onClick={() => setIsPlayerStatsModalOpen(false)}
                                    className="w-full py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PlayersView;
