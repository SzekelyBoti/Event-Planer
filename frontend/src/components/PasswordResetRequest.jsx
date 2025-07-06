import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function PasswordResetRequest() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleRequest = async (e) => {
        e.preventDefault();
        setMessage('');

        const res = await fetch('http://localhost:5000/api/password-reset-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (res.ok) {
            setMessage(data.message);
        } else {
            setMessage(data.error || 'Something went wrong');
        }
    };

    return (
        <div className="app-container">
            <h2>Request Password Reset</h2>
            <form onSubmit={handleRequest}>
                <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />
                <button type="submit">Request Reset</button>
            </form>
            {message && <p>{message}</p>}
            <button onClick={() => navigate('/')}>Back</button>
        </div>
    );
}

export default PasswordResetRequest;
