import React from 'react';

interface SignupsModalProps {
    isOpen: boolean;
    onClose: () => void;
    signups: any[];
    isLoading: boolean;
    isAdmin: boolean;
    scheduleStatus: string;
    scheduleName: string;
    handleUpdateSignupAvailability: (playerId: string, type: string | null) => void;
    handleCompletePlanning: () => void;
}

const SignupsModal: React.FC<SignupsModalProps> = ({
    isOpen,
    onClose,
    signups,
    isLoading,
    isAdmin,
    scheduleStatus,
    scheduleName,
    handleUpdateSignupAvailability,
    handleCompletePlanning
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold">Schedule Sign-ups</h3>
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
                        <p className="text-white/40">Loading sign-ups...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {signups.length === 0 ? (
                            <div className="text-center py-12 opacity-40">
                                <p className="text-lg italic">No players in this group.</p>
                            </div>
                        ) : (
                            signups.map((signup) => (
                                <div key={signup.playerId} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                    <span className="font-medium">{signup.playerName}</span>
                                    <select
                                        value={signup.availabilityType || ''}
                                        onChange={(e) => handleUpdateSignupAvailability(signup.playerId, e.target.value || null)}
                                        className="bg-[#1a1b26] border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-[#667eea] appearance-none"
                                    >
                                        <option value="">Not Signed Up</option>
                                        <option value="Rotation">Rotation</option>
                                        <option value="Permanent">Permanent</option>
                                        <option value="Backup">Backup</option>
                                    </select>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3">
                    {isAdmin && scheduleStatus === 'PLANNING' && (
                        <button
                            onClick={() => {
                                handleCompletePlanning();
                                onClose();
                            }}
                            className="w-full py-3 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)] transition-all"
                        >
                            Complete Planning
                        </button>
                    )}
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

export default SignupsModal;
