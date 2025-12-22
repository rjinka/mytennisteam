import React from 'react';
import type { Court } from '../../types';

interface ScheduleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: any;
    setFormData: (data: any) => void;
    isEditing: boolean;
    courts: Court[];
    days: string[];
}

const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    setFormData,
    isEditing,
    courts,
    days
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1b26] p-8 rounded-2xl w-full max-w-md border border-white/10 shadow-2xl animate-scaleIn">
                <h3 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Schedule' : 'Add New Schedule'}</h3>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Schedule Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                            placeholder="e.g. Weekly Practice"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-white/60 mb-2">Day</label>
                            <select
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
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
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[#667eea] transition-colors"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/60 mb-2">Duration (minutes)</label>
                        <input
                            type="number"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
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
                                    const isSelected = formData.courts.some((c: any) => c.courtId === court.id);
                                    const selectedCourt = formData.courts.find((c: any) => c.courtId === court.id);

                                    return (
                                        <div key={court.id} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        const newCourts = e.target.checked
                                                            ? [...formData.courts, { courtId: court.id, gameType: '1' }]
                                                            : formData.courts.filter((c: any) => c.courtId !== court.id);
                                                        setFormData({ ...formData, courts: newCourts });
                                                    }}
                                                    className="rounded border-white/20 bg-white/5 text-[#667eea] focus:ring-[#667eea]"
                                                />
                                                <span className="text-sm">{court.name}</span>
                                            </label>
                                            {isSelected && selectedCourt && (
                                                <select
                                                    value={selectedCourt.gameType}
                                                    onChange={(e) => {
                                                        const newCourts = formData.courts.map((c: any) =>
                                                            c.courtId === court.id ? { ...c, gameType: e.target.value } : c
                                                        );
                                                        setFormData({ ...formData, courts: newCourts });
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
                                checked={formData.recurring}
                                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                                className="rounded border-white/20 bg-white/5 text-[#667eea] focus:ring-[#667eea]"
                            />
                            <span className="font-medium">Make this a recurring schedule</span>
                        </label>

                        {formData.recurring && (
                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                <div>
                                    <label className="block text-sm font-medium text-white/60 mb-2">Recurrence</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: parseInt(e.target.value) })}
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
                                        value={formData.recurrenceCount}
                                        onChange={(e) => setFormData({ ...formData, recurrenceCount: parseInt(e.target.value) })}
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
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl font-medium bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 btn-primary"
                        >
                            {isEditing ? 'Update Schedule' : 'Create Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleFormModal;
