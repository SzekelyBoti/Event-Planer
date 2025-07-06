import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PasswordReset from '../PasswordReset';
import { useParams, useNavigate } from 'react-router-dom';
import { vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: () => mockNavigate,
    };
});

global.fetch = vi.fn();

describe('PasswordReset', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetch.mockClear();
        useParams.mockReturnValue({ token: 'test-token' });
    });

    it('shows verifying message initially', () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        render(<PasswordReset />);
        expect(screen.getByText(/verifying token/i)).toBeInTheDocument();
    });

    it('shows error if token invalid', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({ error: 'Invalid or expired token' }),
        });
        render(<PasswordReset />);
        await waitFor(() =>
            expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument()
        );
    });

    it('shows form if token is valid', async () => {
        fetch.mockResolvedValueOnce({
            json: async () => ({ message: 'Token is valid' }),
        });
        render(<PasswordReset />);
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
        );
    });

    it('shows error message on submit failure', async () => {
        fetch
            .mockResolvedValueOnce({
                json: async () => ({ message: 'Token is valid' }),
            })
            .mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Failed to reset password' }),
            });

        render(<PasswordReset />);

        await waitFor(() =>
            expect(screen.getByRole('button', { name: /set new password/i })).toBeInTheDocument()
        );

        fireEvent.change(screen.getByPlaceholderText(/new password/i), {
            target: { value: 'newpass123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /set new password/i }));

        await waitFor(() =>
            expect(screen.getByText(/failed to reset password/i)).toBeInTheDocument()
        );
    });
});




