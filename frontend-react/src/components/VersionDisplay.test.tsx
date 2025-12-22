import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VersionDisplay from './VersionDisplay';
import { api } from '../api';
import packageJson from '../../package.json';

// Mock the api
vi.mock('../api', () => ({
    api: {
        getVersion: vi.fn(),
    },
}));



describe('VersionDisplay', () => {
    it('renders frontend version from package.json', () => {
        vi.mocked(api.getVersion).mockResolvedValue({ version: '1.5.0' });
        render(<VersionDisplay />);
        expect(screen.getByText(new RegExp(`v${packageJson.version}`, 'i'))).toBeInTheDocument();
    });

    it('fetches and displays backend version', async () => {
        vi.mocked(api.getVersion).mockResolvedValue({ version: '1.5.0' });
        render(<VersionDisplay />);

        await waitFor(() => {
            expect(screen.getByText(/API v1.5.0/i)).toBeInTheDocument();
        });
    });

    it('shows dots while loading backend version', () => {
        vi.mocked(api.getVersion).mockReturnValue(new Promise(() => { })); // Never resolves
        render(<VersionDisplay />);
        expect(screen.getByText(/API v.../i)).toBeInTheDocument();
    });
});
