import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayersView from './PlayersView';
import { useAppContext } from '../context/AppContext';

// Mock the context hook
vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn()
}));

describe('PlayersView - Invite Validation', () => {
    const mockRefreshCurrentGroupData = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppContext as any).mockReturnValue({
            players: [],
            user: { id: 'admin1', isSuperAdmin: true },
            currentGroup: { id: 'group1', admins: ['admin1'], name: 'Test Group' },
            schedules: [],
            refreshCurrentGroupData: mockRefreshCurrentGroupData,
        });
    });

    it('validates the invite email correctly', async () => {
        render(<PlayersView />);

        // Open the invite modal
        const inviteBtn = screen.getByText(/Invite Player/i);
        fireEvent.click(inviteBtn);

        const emailInput = screen.getByPlaceholderText(/player@gmail.com/i);
        const sendBtn = screen.getByText(/Send Invite/i);

        // Initial state: empty email, button disabled
        expect(sendBtn).toBeDisabled();

        // Invalid email (not gmail)
        fireEvent.change(emailInput, { target: { value: 'test@outlook.com' } });
        expect(sendBtn).toBeDisabled();

        // Invalid email (too short)
        fireEvent.change(emailInput, { target: { value: '@gmail.com' } });
        expect(sendBtn).toBeDisabled();

        // Valid email
        fireEvent.change(emailInput, { target: { value: 'testuser@gmail.com' } });
        expect(sendBtn).not.toBeDisabled();
    });
});

