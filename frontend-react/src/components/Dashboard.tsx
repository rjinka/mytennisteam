import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import toast from 'react-hot-toast';
import Navbar from './Navbar';
import GroupSelector from './GroupSelector';
import SchedulesView from './SchedulesView';
import PlayersView from './PlayersView';
import CourtsView from './CourtsView';

const Dashboard: React.FC = () => {
    const { currentGroup, refreshGroups, groups, setCurrentGroup, players, user } = useAppContext();
    const [activeTab, setActiveTab] = useState<'schedules' | 'players' | 'courts'>('schedules');
    const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupAdmins, setEditGroupAdmins] = useState<string[]>([]);

    useEffect(() => {
        refreshGroups();
    }, []);

    const hasAutoSelected = React.useRef(false);

    // If we have a current group, mark as selected so we don't auto-select again if the user switches
    useEffect(() => {
        if (currentGroup) {
            hasAutoSelected.current = true;
            setEditGroupName(currentGroup.name);
            setEditGroupAdmins(currentGroup.admins || []);
        }
    }, [currentGroup]);

    useEffect(() => {
        if (groups.length > 0 && !currentGroup && !hasAutoSelected.current) {
            setCurrentGroup(groups[0]);
            hasAutoSelected.current = true;
        }
    }, [groups, currentGroup, setCurrentGroup]);

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentGroup) return;
        try {
            await api.updateGroup(currentGroup.id, {
                name: editGroupName,
                admins: editGroupAdmins
            });
            toast.success('Group updated successfully');
            setIsEditGroupModalOpen(false);
            refreshGroups();
            // Update local state immediately for better UX
            if (currentGroup) {
                setCurrentGroup({
                    ...currentGroup,
                    name: editGroupName,
                    admins: editGroupAdmins
                });
            }
        } catch (error) {
            toast.error('Failed to update group');
        }
    };

    const handleLeaveGroup = async () => {
        if (!currentGroup) return;
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium">Leave group "{currentGroup.name}"?</p>
                <p className="text-sm text-gray-400">You will lose access to this group's schedules and stats.</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.leaveGroup(currentGroup.id);
                                toast.success('Left group successfully');
                                await refreshGroups();
                                setCurrentGroup(null);
                                hasAutoSelected.current = false;
                            } catch (error: any) {
                                toast.error(error.message || 'Failed to leave group');
                            }
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                        Leave
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

    const handleDeleteGroup = async () => {
        if (!currentGroup) return;
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium">Delete group "{currentGroup.name}"?</p>
                <p className="text-sm text-gray-400">This cannot be undone.</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.deleteGroup(currentGroup.id);
                                toast.success('Group deleted');
                                await refreshGroups();
                                setCurrentGroup(null);
                                hasAutoSelected.current = false; // Reset to allow auto-select next available
                            } catch (error) {
                                toast.error('Failed to delete group');
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

    const handleCopyJoinCode = () => {
        if (currentGroup?.joinCode) {
            navigator.clipboard.writeText(currentGroup.joinCode);
            toast.success('Join code copied to clipboard!');
        } else {
            toast.error('No join code available');
        }
    };

    const toggleAdmin = (playerId: string) => {
        setEditGroupAdmins(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const isAdmin = user && currentGroup && (currentGroup.admins.includes(user.id) || user.isSuperAdmin);

    if (!currentGroup) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow flex items-center justify-center p-4">
                    <GroupSelector />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
                        <h2 className="text-xl sm:text-3xl font-bold text-white/90 truncate max-w-[180px] xs:max-w-[250px] sm:max-w-none">{currentGroup.name}</h2>
                        <div className="flex gap-1 sm:gap-2 shrink-0">
                            {isAdmin && (
                                <>
                                    <button
                                        onClick={() => setIsEditGroupModalOpen(true)}
                                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                                        title="Edit Group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setIsShareModalOpen(true)}
                                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                                        title="Share Join Code"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleDeleteGroup}
                                        className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors border border-white/5"
                                        title="Delete Group"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleLeaveGroup}
                                className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors border border-white/5"
                                title="Leave Group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>

                        </div>
                    </div>
                    <div className="flex w-full sm:w-auto bg-white/5 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setActiveTab('schedules')}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'schedules' ? 'bg-[#667eea] text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            Schedules
                        </button>
                        <button
                            onClick={() => setActiveTab('players')}
                            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'players' ? 'bg-[#667eea] text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                            Players
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setActiveTab('courts')}
                                className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === 'courts' ? 'bg-[#667eea] text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
                            >
                                Courts
                            </button>
                        )}
                    </div>
                </div>

                <div className="animate-fadeIn">
                    {activeTab === 'schedules' && <SchedulesView />}
                    {activeTab === 'players' && <PlayersView />}
                    {activeTab === 'courts' && isAdmin && <CourtsView />}
                </div>
            </main>

            {/* Edit Group Modal */}
            {isEditGroupModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6">Edit Group</h3>
                        <form onSubmit={handleUpdateGroup} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={editGroupName}
                                    onChange={(e) => setEditGroupName(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                    placeholder="Enter group name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Group Admins</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl p-2 border border-white/10">
                                    {players.map(player => (
                                        <div key={player.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
                                            <input
                                                type="checkbox"
                                                id={`admin-${player.id}`}
                                                checked={editGroupAdmins.includes(player.userId)}
                                                onChange={() => toggleAdmin(player.userId)}
                                                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#667eea] focus:ring-[#667eea]"
                                            />
                                            <label htmlFor={`admin-${player.id}`} className="flex-1 cursor-pointer select-none">
                                                <span className="font-medium">{player.name}</span>
                                            </label>
                                        </div>
                                    ))}
                                    {players.length === 0 && (
                                        <p className="text-white/40 text-sm text-center py-4">No players found.</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditGroupModalOpen(false)}
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
            )}

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-2">Invite Players</h3>
                        <p className="text-white/60 mb-6">Share this code with players so they can join your group.</p>

                        <div className="bg-black/40 p-6 rounded-xl border border-white/10 text-center mb-6">
                            <p className="text-3xl font-mono font-bold tracking-wider text-[#667eea]">
                                {currentGroup.joinCode || 'NO-CODE'}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsShareModalOpen(false)}
                                className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handleCopyJoinCode}
                                className="flex-1 btn-primary"
                            >
                                Copy Code
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
