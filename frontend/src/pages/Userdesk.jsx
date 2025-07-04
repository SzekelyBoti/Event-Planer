import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [user, setUser] = useState({});
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            setUser({
                id: decoded.sub,
                username: decoded.username,
                email: decoded.email,
            });
        }
    }, []);
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: '', occurrence: '', description: '' });

    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/events', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch events');
            const data = await res.json();
            setEvents(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const createEvent = async () => {
        try {
            let occurrence = newEvent.occurrence;
            if (occurrence && occurrence.length === 16) {
                occurrence += ':00';
            }
            const res = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newEvent),
            });
            if (!res.ok) throw new Error('Failed to create event');
            await fetchEvents();
            setNewEvent({ title: '', occurrence: '', description: '' });
        } catch (e) {
            alert(e.message);
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm('Delete this event?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/events/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete event');
            await fetchEvents();
        } catch (e) {
            alert(e.message);
        }
    };

    const updateEventDescription = async (id, description) => {
        try {
            const res = await fetch(`http://localhost:5000/api/events/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ description }),
            });
            if (!res.ok) throw new Error('Failed to update event');
            await fetchEvents();
        } catch (e) {
            alert(e.message);
        }
    };

    if (loading) return <div>Loading events...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Welcome, {user.username || user.email || "User"}!</h1>
            <button onClick={() => navigate('/submit-ticket')}>Submit Helpdesk Ticket</button>
            <h2>Your Events</h2>
            <ul>
                {events.map(ev => (
                    <li key={ev.id}>
                        <strong>{ev.title}</strong> ({new Date(ev.occurrence).toLocaleString()})
                        <br />
                        Description: <input
                        type="text"
                        defaultValue={ev.description || ''}
                        onBlur={e => updateEventDescription(ev.id, e.target.value)}
                    />
                        <button onClick={() => deleteEvent(ev.id)}>Delete</button>
                    </li>
                ))}
            </ul>

            <h3>Create New Event</h3>
            <input
                type="text"
                placeholder="Title"
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                required
            />
            <input
                type="datetime-local"
                value={newEvent.occurrence}
                onChange={e => setNewEvent({...newEvent, occurrence: e.target.value})}
                required
            />
            <input
                type="text"
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={e => setNewEvent({...newEvent, description: e.target.value})}
            />
            <button onClick={createEvent}>Create Event</button>
        </div>
    );
}
