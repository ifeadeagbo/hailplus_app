import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

// Reminder for signed-in customers who haven't confirmed their email yet
const VerifyEmailBanner = () => {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    try {
      setSending(true);
      const response = await authService.resendVerification();
      toast.success(response.message);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not send the link');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-accent-light border-b border-line text-sm">
      <div className="shop-container py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span>Please confirm your email address. We sent a link to <strong>{user.email}</strong>.</span>
        <button onClick={resend} disabled={sending} className="underline hover:text-accent disabled:opacity-50">
          {sending ? 'Sending...' : 'Resend link'}
        </button>
      </div>
    </div>
  );
};

export default VerifyEmailBanner;
