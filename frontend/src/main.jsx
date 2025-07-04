import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Helpdesk from './pages/Helpdesk.jsx';
import Dashboard from "./pages/Userdesk.jsx";
import SubmitTicket from "./components/SubmitTicket.jsx"
import PasswordResetRequest from './components/PasswordResetRequest';

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/helpdesk" element={<Helpdesk />} />
            <Route path="/submit-ticket" element={<SubmitTicket />} />
            <Route path="/reset-password-request" element={<PasswordResetRequest />} />
        </Routes>
    </BrowserRouter>
);


