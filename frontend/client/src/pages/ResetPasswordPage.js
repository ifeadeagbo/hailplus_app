import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import authService from '../services/authService';
import PasswordFields from '../components/auth/PasswordFields';

// Opened from the link in the password reset email
const ResetPasswordPage = () => {
  const { token } = useParams();
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      setError(null);
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">Choose a new password</h2>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {done ? (
            <div className="space-y-4 text-center">
              <p>Your password has been reset. For your security, you've been signed out on all devices.</p>
              <Link to="/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <PasswordFields register={register} errors={errors} watch={watch} />
              {error && (
                <p className="text-red-500 text-sm">
                  {error}{' '}
                  <Link to="/forgot-password" className="underline">Request a new link</Link>
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Reset password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
