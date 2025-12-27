import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActiveGameDisplay from './ActiveGameDisplay';
import { useAppContext } from '../../context/AppContext';

// Mock the context hook
vi.mock('../../context/AppContext', () => ({
    useAppContext: vi.fn()
}));

describe('ActiveGameDisplay - Court Assignments', () => {
    const mockGetPlayerName = vi.fn((id) => `Player ${id}`);

    const mockSchedule = {
        id: 'sched1',
        name: 'Test Schedule',
        status: 'ACTIVE',
        allowShuffle: true,
        courts: [
            { courtId: 'court1', gameType: '1' }, // Doubles
            { courtId: 'court2', gameType: '1' }  // Doubles
        ],
        playingPlayersIds: ['p1', 'p2', 'p3', 'p4'],
        benchPlayersIds: ['p5'],
        courtAssignments: [
            {
                courtId: 'court1',
                assignments: [
                    { playerId: 'p1', side: 'Left' },
                    { playerId: 'p2', side: 'Right' },
                    { playerId: 'p3', side: 'Left' },
                    { playerId: 'p4', side: 'Right' }
                ]
            }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppContext as any).mockReturnValue({
            user: { id: 'admin1', isSuperAdmin: true },
            currentGroup: { id: 'group1', admins: ['admin1'] },
            refreshCurrentGroupData: vi.fn(),
        });
    });

    it('renders court assignments and teams correctly when allowShuffle is true', () => {
        render(
            <ActiveGameDisplay
                selectedSchedule={mockSchedule as any}
                selectedScheduleId="sched1"
                isAdmin={true}
                currentPlayerId="admin1"
                isRegularPlayer={true}
                rotationButtonStatus={{ visible: true, text: 'Generate', disabled: false }}
                handleOpenEditModal={vi.fn()}
                handleViewSignups={vi.fn()}
                handleViewStats={vi.fn()}
                handleGenerateRotation={vi.fn()}
                handleUpdateSignupAvailability={vi.fn()}
                handleSwapPlayer={vi.fn()}
                handleDeleteSchedule={vi.fn()}
                handleShuffle={vi.fn()}
                days={[]}
                getPlayerName={mockGetPlayerName}
                currentPlayer={null}
            />
        );

        // Check for Court Assignment header
        expect(screen.getByText(/Court Assignments/i)).toBeInTheDocument();

        // Check for Court 1
        expect(screen.getByText(/Court 1/i)).toBeInTheDocument();

        // Check for Teams
        expect(screen.getAllByText(/Team 1/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Team 2/i).length).toBeGreaterThan(0);

        // Check for players
        expect(screen.getByText(/Player p1/i)).toBeInTheDocument();
        expect(screen.getByText(/Player p2/i)).toBeInTheDocument();
        expect(screen.getByText(/Player p3/i)).toBeInTheDocument();
        expect(screen.getByText(/Player p4/i)).toBeInTheDocument();

        // Check for Bench
        expect(screen.getByText(/Bench/i)).toBeInTheDocument();
        expect(screen.getByText(/Player p5/i)).toBeInTheDocument();
    });

    it('renders standard playing/bench view when allowShuffle is false', () => {
        const noShuffleSchedule = { ...mockSchedule, allowShuffle: false };

        render(
            <ActiveGameDisplay
                selectedSchedule={noShuffleSchedule as any}
                selectedScheduleId="sched1"
                isAdmin={true}
                currentPlayerId="admin1"
                isRegularPlayer={true}
                rotationButtonStatus={{ visible: true, text: 'Generate', disabled: false }}
                handleOpenEditModal={vi.fn()}
                handleViewSignups={vi.fn()}
                handleViewStats={vi.fn()}
                handleGenerateRotation={vi.fn()}
                handleUpdateSignupAvailability={vi.fn()}
                handleSwapPlayer={vi.fn()}
                handleDeleteSchedule={vi.fn()}
                handleShuffle={vi.fn()}
                days={[]}
                getPlayerName={mockGetPlayerName}
                currentPlayer={null}
            />
        );

        // Should NOT show Court Assignments
        expect(screen.queryByText(/Court Assignments/i)).not.toBeInTheDocument();

        // Should show "Playing" header
        expect(screen.getByText(/Playing/i)).toBeInTheDocument();
    });
});
