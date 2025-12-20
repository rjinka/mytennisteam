import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import toast from 'react-hot-toast';

const GroupSelector: React.FC = () => {
    const { groups, setCurrentGroup, refreshGroups, user } = useAppContext();
    const [joinCode, setJoinCode] = useState('');
    const [newGroupName, setNewGroupName] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode.length !== 6) return;
        try {
            await api.joinGroupByCode(joinCode);
            await refreshGroups();
            setJoinCode('');
            setIsJoining(false);
        } catch (error) {
            toast.error('Failed to join group. Please check the code.');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        try {
            const newGroup = await api.createGroup({ name: newGroupName });
            await refreshGroups();
            setCurrentGroup(newGroup);
            setNewGroupName('');
            setIsCreating(false);
            toast.success('Group created successfully');
        } catch (error) {
            toast.error('Failed to create group.');
        }
    };

    return (
        <div className="w-full max-w-2xl space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white">Welcome back!</h2>
                <p className="text-white/60">Select a group to manage or join a new one</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.map((group) => (
                    <button
                        key={group.id}
                        onClick={() => setCurrentGroup(group)}
                        className="glass-card text-left hover:border-[#667eea]/50 group"
                    >
                        <h3 className="text-xl font-bold group-hover:text-[#667eea] transition-colors">
                            {group.name}
                        </h3>
                        <p className="text-white/40 text-sm mt-1">
                            {user && (group.admins.includes(user.id) || user.isSuperAdmin) ? 'Admin' : 'Member'}
                        </p>
                    </button>
                ))}

                <button
                    onClick={() => setIsJoining(true)}
                    className="glass-card border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center py-8 space-y-2"
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <span className="font-medium text-white/60">Join with Code</span>
                </button>
            </div>

            <div className="flex justify-center">
                <button
                    onClick={() => setIsCreating(true)}
                    className="text-white/40 hover:text-white text-sm font-medium transition-colors"
                >
                    Create a new group
                </button>
            </div>

            {/* Join Modal */}
            {isJoining && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1a2e]/80 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md space-y-6">
                        <h3 className="text-2xl font-bold">Join Group</h3>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <input
                                type="text"
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                                className="input-field text-center text-2xl tracking-[0.5em] uppercase"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsJoining(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Join</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#1a1a2e]/80 backdrop-blur-sm">
                    <div className="glass-card w-full max-w-md space-y-6">
                        <h3 className="text-2xl font-bold">New Group</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Group Name"
                                className="input-field"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" className="btn-primary flex-1">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupSelector;
