import React from 'react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
    const { user, setUser, currentGroup, setCurrentGroup } = useAppContext();
    const [showSupportModal, setShowSupportModal] = React.useState(false);
    const [supportMessage, setSupportMessage] = React.useState('');

    const handleLogout = async () => {
        try {
            await api.logout();
            setUser(null);
            setCurrentGroup(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleDeleteAccount = async () => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium">Are you sure you want to delete your account?</p>
                <p className="text-sm text-gray-400">This action cannot be undone.</p>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            confirmDelete();
                        }}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                    >
                        Yes, delete
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1 bg-white/10 text-white/60 rounded hover:bg-white/20 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000, icon: '⚠️' });
    };

    const confirmDelete = async () => {
        try {
            await api.deleteSelf();
            handleLogout();
            toast.success('Account deleted successfully');
        } catch (error: any) {
            console.error('Delete account failed:', error);
            toast.error(error.message || 'Failed to delete account. Please try again.');
        }
    };

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.submitSupport({ message: supportMessage, groupId: currentGroup?.id });
            setShowSupportModal(false);
            setSupportMessage('');
            toast.success('Support request submitted successfully.');
        } catch (error) {
            console.error('Support submission failed:', error);
            toast.error('Failed to submit support request.');
        }
    };

    return (
        <>
            <nav className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <span className="text-xl font-bold bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                            MTT
                        </span>
                        {currentGroup && (
                            <button
                                onClick={() => setCurrentGroup(null)}
                                className="flex items-center gap-1 text-xs sm:text-sm text-white/40 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded-lg border border-white/5"
                                title="Switch Group"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span className="hidden xs:inline">Switch</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <span className="text-sm sm:text-lg font-medium text-white/90 hidden md:block truncate max-w-[100px]">{user?.name}</span>
                            {user?.picture ? (
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 object-cover shrink-0"
                                />
                            ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white/20 text-xs sm:text-base shrink-0">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="h-6 w-px bg-white/10 shrink-0"></div>

                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                            <button
                                onClick={() => setShowSupportModal(true)}
                                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                title="Contact Support"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                                </svg>
                            </button>

                            <button
                                onClick={handleDeleteAccount}
                                className="p-1.5 sm:p-2 rounded-full hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
                                title="Delete Account"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </button>

                            <button
                                onClick={handleLogout}
                                className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                title="Logout"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {showSupportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="glass-card w-full max-w-md p-6 space-y-4">
                        <h2 className="text-xl font-bold text-white">Contact Support</h2>
                        <form onSubmit={handleSupportSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-1">Message</label>
                                <textarea
                                    value={supportMessage}
                                    onChange={(e) => setSupportMessage(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 h-32 resize-none"
                                    placeholder="How can we help you?"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSupportModal(false)}
                                    className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-medium hover:opacity-90 transition-opacity"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
