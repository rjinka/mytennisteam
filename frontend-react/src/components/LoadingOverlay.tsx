import React from 'react';

const LoadingOverlay: React.FC = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1a1a2e]/80 backdrop-blur-sm">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-white/10 border-t-[#667eea] rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-[#667eea] rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingOverlay;
