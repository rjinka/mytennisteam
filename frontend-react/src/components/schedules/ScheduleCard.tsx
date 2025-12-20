import React from 'react';
import type { Schedule } from '../../types';

interface ScheduleCardProps {
    schedule: Schedule;
    isSelected: boolean;
    onClick: () => void;
    days: string[];
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, isSelected, onClick, days }) => {
    const sId = schedule.id || (schedule as any)._id;

    return (
        <button
            onClick={onClick}
            className={`glass-card w-full text-left !p-4 border-l-4 transition-all duration-300 ${isSelected
                ? 'border-[#667eea] bg-gradient-to-r from-[#667eea]/20 to-transparent shadow-[0_0_15px_rgba(102,126,234,0.3)]'
                : 'border-transparent hover:bg-white/10'
                }`}
        >
            <div className="flex justify-between items-start">
                <h4 className="font-bold">{schedule.name}</h4>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-white/60">
                    {days[schedule.day]}
                </span>
            </div>
            <p className="text-sm text-white/40 mt-1">{schedule.time} • {schedule.duration} mins</p>
        </button>
    );
};

export default ScheduleCard;
