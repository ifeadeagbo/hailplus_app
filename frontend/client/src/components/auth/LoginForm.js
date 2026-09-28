import React, { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

// Second sign-in step for accounts with two-factor sign-in turned on
const TwoFactorStep = ({ redirectTo, onBack }) => {
  const { completeTwoFactor } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await completeTwoFactor(code.trim(), redirectTo);
    } catch (error) {
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Authentication code</label>
        <p className="text-sm text-gray-600 mb-3">
          Enter the 6-digit code from your authenticator app, or one of your recovery codes.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          className="w-full px-4 py-2 border rounded-lg text-center text-lg tracking-[0.3em] focus:outline-none focus:border-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting || code.trim().length < 6}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Checking...' : 'Verify'}
      </button>
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-600 hover:text-gray-900">
        Back to sign in
      </button>
    </form>
  );
};

const LoginForm = () => {
  const { login } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = location.state?.from?.pathname || '/';
  // Social sign-in redirects here with ?twofactor=1 when a code is needed
  const [needsCode, setNeedsCode] = useState(searchParams.get('twofactor') === '1');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await login(data.email, data.password, redirectTo);
      if (response?.twoFactorRequired) setNeedsCode(true);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  if (needsCode) {
    return <TwoFactorStep redirectTo={redirectTo} onBack={() => setNeedsCode(false)} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters'
            }
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
        <div className="text-right mt-1">
          <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
            Forgot your password?
          </Link>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};

export default LoginForm;