import React, { useEffect, useState } from 'react';

const Helpdesk = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchHelpRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                console.log("Authorization header:", `Bearer ${token}`);
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
                    const errorData = await response.json();
                    console.error('Failed to fetch help requests', errorData);
                }
            } catch (error) {
                console.error('Error fetching help requests:', error);
            }
        };

        fetchHelpRequests();
    }, []);

    return (
        <div>
            <h2>Helpdesk Requests</h2>
            {requests.length === 0 ? (
                <p>No requests found.</p>
            ) : (
                <ul>
                    {requests.map((req) => (
                        <li key={req.id}>
                            <strong>From user {req.user_id}:</strong> {req.message}
                            {req.response && (
                                <p>
                                    <strong>Response:</strong> {req.response}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Helpdesk;
