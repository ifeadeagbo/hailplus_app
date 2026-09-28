import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

// Opened from the link in the confirmation email
const VerifyEmailPage = () => {
  const { token } = useParams();
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState('checking'); // checking | done | failed
  const [message, setMessage] = useState('');
  const sent = useRef(false);

  useEffect(() => {
    // Each link works once, so don't send it twice (React dev mode runs effects twice)
    if (sent.current) return;
    sent.current = true;

    authService.verifyEmail(token)
      .then(() => setStatus('done'))
      .catch((error) => {
        setMessage(error.response?.data?.error || 'This link could not be used.');
        setStatus('failed');
      });
  }, [token]);

  // Clear the reminder bar for a signed-in user
  useEffect(() => {
    if (status === 'done' && user && !user.emailVerified) {
      setUser({ ...user, emailVerified: true });
    }
  }, [status, user, setUser]);

  return (
    <div className="shop-container py-24 max-w-lg text-center">
      {status === 'checking' && <p className="text-muted">Confirming your email address...</p>}
      {status === 'done' && (
        <>
          <i className="fa-solid fa-circle-check text-4xl text-green-700 mb-4"></i>
          <h1 className="section-title mb-4">Email confirmed</h1>
          <p className="text-muted mb-8">Thanks, your email address is confirmed.</p>
          <Link to="/products" className="btn-dark">Continue shopping</Link>
        </>
      )}
      {status === 'failed' && (
        <>
          <h1 className="section-title mb-4">Link not valid</h1>
          <p className="text-muted mb-8">{message}</p>
          <Link to={user ? '/account' : '/login'} className="btn-dark">{user ? 'Go to My Account' : 'Sign in'}</Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmailPage;
