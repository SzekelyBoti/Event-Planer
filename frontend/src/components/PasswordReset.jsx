import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

function PasswordReset() {
    const { token } = useParams();
    const [validToken, setValidToken] = useState(null);
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Verify token on mount
        fetch(`http://localhost:5000/api/password-reset/${token}`, {
            method: 'GET',
        })
            .then(res => res.json())
            .then(data => {
                if (data.message === 'Token is valid') {
                    setValidToken(true);
                } else {
                    setValidToken(false);
                    setMessage(data.error || 'Invalid or expired token');
                }
            })
            .catch(() => {
                setValidToken(false);
                setMessage('Error verifying token');
            });
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        const res = await fetch(`http://localhost:5000/api/password-reset/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
        });

        const data = await res.json();
        if (res.ok) {
            setMessage(data.message);
            setTimeout(() => navigate('/'), 1000);
        } else {
            setMessage(data.error || 'Something went wrong');
        }
    };

    if (validToken === null) {
        return <p>Verifying token...</p>;
    }

    if (!validToken) {
        return <p>{message}</p>;
    }

    return (
        <div className="app-container">
            <h2>Reset your password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Set New Password</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default PasswordReset;

