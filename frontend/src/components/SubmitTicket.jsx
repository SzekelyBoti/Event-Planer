import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SubmitTicket() {
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await fetch('http://localhost:5000/api/helpdesk/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ message })
        });
        alert("Ticket submitted");
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Submit Helpdesk Ticket</h2>
            <textarea
                placeholder="Describe your issue..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
            />
            <br />
            <button type="submit">Submit</button>
            <button type="button" onClick={() => navigate('/dashboard')}>Back</button>
        </form>
    );
}
export default SubmitTicket;