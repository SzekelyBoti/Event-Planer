import { useState } from 'react';
import { Link } from 'react-router-dom';
const apiUrl = import.meta.env.VITE_API_URL;
import '../App.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [userId, setUserId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaMessage, setMfaMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter username and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        setLoading(false);
        return;
      }

      if (data.mfa_required) {
        setUserId(data.user_id);
        setMfaRequired(true);
        setMfaMessage('MFA code sent to your email. Please enter it below.');
      } else {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (data.user.role === 'helpdesk') {
          window.location.href = '/helpdesk';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      setError('Network error, please try again later.');
    }
    setLoading(false);
  };

  const handleMfaSubmit = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaMessage('');
    setLoading(true);

    const trimmedCode = mfaCode.trim();
    if (!trimmedCode) {
      setMfaError('Please enter the MFA code.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/api/mfa-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code: trimmedCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMfaError(data.error || 'Invalid MFA code');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setMfaMessage('Login successful! Redirecting...');

      setTimeout(() => {
        if (data.user.role === 'helpdesk') {
          window.location.href = '/helpdesk';
        } else {
          window.location.href = '/dashboard';
        }
      }, 1000);
    } catch (err) {
      setMfaError('Network error, please try again later.');
    }
    setLoading(false);
  };

  const handleResendMfa = async () => {
    setMfaError('');
    setMfaMessage('');
    setResending(true);

    try {
      const res = await fetch(`${apiUrl}/api/mfa-resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMfaError(data.error || 'Failed to resend MFA code');
      } else {
        setMfaMessage('MFA code resent. Please check your email.');
      }
    } catch {
      setMfaError('Network error, please try again later.');
    }

    setResending(false);
  };

  return (
      <div className="app-container">
        {!mfaRequired ? (
            <>
              <h2>Login</h2>
              <form onSubmit={handleSubmit}>
                <div>
                  <label>Username</label>
                  <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      required
                      disabled={loading}
                  />
                </div>
                <div>
                  <label>Password</label>
                  <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={loading}
                  />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
              <p>
                <Link to="/reset-password-request">Forgot password?</Link>
              </p>
            </>
        ) : (
            <>
              <h2>MFA Verification</h2>
              <p>{mfaMessage}</p>
              <form onSubmit={handleMfaSubmit}>
                <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    disabled={loading}
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </form>
              <button onClick={handleResendMfa} disabled={resending || loading}>
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
              {mfaError && <p>{mfaError}</p>}
            </>
        )}
      </div>
  );
}


