import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordResetRequest from '../PasswordResetRequest';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
describe('PasswordResetRequest', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it('submits a valid email and shows confirmation', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                message: "If your email is registered, you'll receive a password reset link.",
            }),
        });

        render(
            <MemoryRouter>
                <PasswordResetRequest />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/your email/i), {
            target: { value: 'test@example.com' },
        });

        fireEvent.click(screen.getByText(/request reset/i));

        await waitFor(() => {
            expect(screen.getByText(/you'll receive a password reset link/i)).toBeInTheDocument();
        });
    });

    it('handles missing email', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Email is required' }),
        });

        render(
            <MemoryRouter>
                <PasswordResetRequest />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText(/request reset/i));

        await waitFor(() => {
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        });
    });
});



