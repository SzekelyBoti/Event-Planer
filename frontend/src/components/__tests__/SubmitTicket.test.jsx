import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi, expect } from 'vitest';
import SubmitTicket from '../SubmitTicket';

global.fetch = vi.fn();

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: () => mockNavigate,
    };
});

describe('SubmitTicket', () => {
    beforeEach(() => {
        fetch.mockClear();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    it('renders textarea and buttons', () => {
        render(<SubmitTicket />);
        expect(screen.getByPlaceholderText(/describe your issue/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('submits ticket and shows alert', async () => {
        fetch.mockResolvedValueOnce({ ok: true });

        render(<SubmitTicket />);

        fireEvent.change(screen.getByPlaceholderText(/describe your issue/i), { target: { value: 'Help needed!' } });
        fireEvent.click(screen.getByRole('button', { name: /submit/i }));
        
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(fetch).toHaveBeenCalledWith(
            'http://localhost:5000/api/helpdesk/submit',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'Authorization': expect.stringContaining('Bearer'),
                }),
                body: JSON.stringify({ message: 'Help needed!' }),
            })
        );

        expect(window.alert).toHaveBeenCalledWith('Ticket submitted');
    });
});

