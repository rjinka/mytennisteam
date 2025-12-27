import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ScheduleFormModal from './ScheduleFormModal';

describe('ScheduleFormModal - allowShuffle visibility', () => {
    const mockOnSubmit = vi.fn();
    const mockOnClose = vi.fn();
    const mockSetFormData = vi.fn();

    const defaultFormData = {
        name: '',
        groupId: 'group1',
        day: 1,
        time: '18:00',
        duration: 90,
        recurring: false,
        frequency: 0,
        recurrenceCount: 1,
        maxPlayersCount: 4,
        courts: [],
        allowShuffle: false
    };

    const mockCourts = [
        { id: 'c1', name: 'Court 1' },
        { id: 'c2', name: 'Court 2' }
    ];

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does NOT show allowShuffle checkbox when no courts are selected', () => {
        render(
            <ScheduleFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
                formData={defaultFormData as any}
                setFormData={mockSetFormData}
                isEditing={false}
                courts={mockCourts as any}
                days={days}
            />
        );

        expect(screen.queryByLabelText(/Allow players to shuffle/i)).not.toBeInTheDocument();
    });

    it('does NOT show allowShuffle checkbox when only one court is selected', () => {
        const oneCourtData = {
            ...defaultFormData,
            courts: [{ courtId: 'c1', gameType: '1' }]
        };

        render(
            <ScheduleFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
                formData={oneCourtData as any}
                setFormData={mockSetFormData}
                isEditing={false}
                courts={mockCourts as any}
                days={days}
            />
        );

        expect(screen.queryByLabelText(/Allow players to shuffle/i)).not.toBeInTheDocument();
    });

    it('SHOWS allowShuffle checkbox when multiple courts are selected', () => {
        const multiCourtData = {
            ...defaultFormData,
            courts: [
                { courtId: 'c1', gameType: '1' },
                { courtId: 'c2', gameType: '1' }
            ]
        };

        render(
            <ScheduleFormModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
                formData={multiCourtData as any}
                setFormData={mockSetFormData}
                isEditing={false}
                courts={mockCourts as any}
                days={days}
            />
        );

        expect(screen.getByLabelText(/Allow players to shuffle/i)).toBeInTheDocument();
    });
});
