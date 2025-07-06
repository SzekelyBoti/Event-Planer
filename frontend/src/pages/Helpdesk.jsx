import React, { useEffect, useState } from 'react';
import '../App.css'

const Helpdesk = () => {
    const [requests, setRequests] = useState([]);
    const [responses, setResponses] = useState({});
    const [sending, setSending] = useState(null);


    useEffect(() => {
        const fetchHelpRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5000/api/helpdesk/requests', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setRequests(data);
                } else {
                    console.error('Failed to fetch help requests');
                }
            } catch (error) {
                console.error('Error fetching help requests:', error);
            }
        };

        fetchHelpRequests();
    }, []);

    const handleReplyChange = (id, value) => {
        setResponses(prev => ({ ...prev, [id]: value }));
    };

    const sendReply = async (id) => {
        const responseText = responses[id];
        if (!responseText) return;

        try {
            setSending(id);
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/helpdesk/respond/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ response: responseText }),
            });

            if (res.ok) {
                const updated = requests.map(req =>
                    req.id === id ? { ...req, response: responseText } : req
                );
                setRequests(updated);
                setResponses(prev => ({ ...prev, [id]: '' }));
            } else {
                console.error('Failed to send reply');
            }
        } catch (err) {
            console.error('Error sending reply:', err);
        } finally {
            setSending(null);
        }
    };

    return (
        <div className="app-container">
            <h2>Helpdesk Requests</h2>
            {requests.length === 0 ? (
                <p>No requests found.</p>
            ) : (
                <ul>
                    {requests.map((req) => (
                        <li key={req.id} style={{ marginBottom: '1.5rem' }}>
                            <p><strong>{req.user_email} :</strong> {req.message}</p>

                            {req.response ? (
                                <p><strong>Response:</strong> {req.response}</p>
                            ) : (
                                <div>
                                    <textarea
                                        value={responses[req.id] || ''}
                                        onChange={(e) => handleReplyChange(req.id, e.target.value)}
                                        placeholder="Type your response..."
                                        rows="3"
                                        style={{ width: '100%', marginBottom: '0.5rem' }}
                                    />
                                    <button
                                        onClick={() => sendReply(req.id)}
                                        disabled={sending === req.id}
                                    >
                                        {sending === req.id ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Helpdesk;
