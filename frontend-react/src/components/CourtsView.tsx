import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import type { Court } from '../types';
import toast from 'react-hot-toast';

const CourtsView: React.FC = () => {
    const { courts, user, currentGroup, refreshCurrentGroupData } = useAppContext();
    const [isCourtModalOpen, setIsCourtModalOpen] = useState(false);
    const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
    const [courtFormData, setCourtFormData] = useState({
        name: ''
    });

    const isAdmin = user && currentGroup && (currentGroup.admins.includes(user.id) || user.isSuperAdmin);

    const handleOpenCreateModal = () => {
        setEditingCourtId(null);
        setCourtFormData({ name: '' });
        setIsCourtModalOpen(true);
    };

    const handleOpenEditModal = (court: Court) => {
        setEditingCourtId(court.id || (court as any)._id);
        setCourtFormData({ name: court.name });
        setIsCourtModalOpen(true);
    };

    const handleSaveCourt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentGroup) return;

        try {
            if (editingCourtId) {
                await api.updateCourt(editingCourtId, courtFormData);
                toast.success('Court updated successfully');
            } else {
                await api.createCourt({
                    ...courtFormData,
                    groupId: currentGroup.id
                });
                toast.success('Court created successfully');
            }
            setIsCourtModalOpen(false);
            await refreshCurrentGroupData();
        } catch (error) {
            console.error(error);
            toast.error(editingCourtId ? 'Failed to update court' : 'Failed to create court');
        }
    };

    const handleDeleteCourt = (court: Court) => {
        const courtId = court.id || (court as any)._id;
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium">Delete court "{court.name}"?</p>
                <p className="text-sm text-gray-400">This cannot be undone.</p>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.deleteCourt(courtId);
                                toast.success('Court deleted');
                                await refreshCurrentGroupData();
                            } catch (error) {
                                toast.error('Failed to delete court');
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                {isAdmin && (
                    <button onClick={handleOpenCreateModal} className="btn-primary">Add Court</button>
                )}
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {courts.length === 0 ? (
                    <div className="col-span-full glass-card text-center py-12 opacity-40">
                        <p className="text-lg italic">No courts defined for this group.</p>
                    </div>
                ) : (
                    courts.map((court) => (
                        <div key={court.id || (court as any)._id} className="glass-card flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h4 className="font-bold">{court.name}</h4>
                            </div>
                            {isAdmin && (
                                <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenEditModal(court)}
                                        className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                        title="Edit Court"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCourt(court)}
                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Delete Court"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Court Modal */}
            {isCourtModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6">{editingCourtId ? 'Edit Court' : 'Add New Court'}</h3>
                        <form onSubmit={handleSaveCourt} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Court Name</label>
                                <input
                                    type="text"
                                    value={courtFormData.name}
                                    onChange={(e) => setCourtFormData({ ...courtFormData, name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                    placeholder="e.g. Court 1"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCourtModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary"
                                >
                                    {editingCourtId ? 'Update Court' : 'Create Court'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourtsView;

