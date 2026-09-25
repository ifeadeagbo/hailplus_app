import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import SocialLogin from '../components/auth/SocialLogin';

// Reasons the server sends back when a social login fails
const SOCIAL_LOGIN_ERRORS = {
  no_email: 'Your social account did not share an email address. Please allow email access or sign up with email.',
  email_in_use: 'An account with this email already exists. Sign in with your password instead.',
  account_disabled: 'This account has been disabled.',
  provider_unavailable: 'That sign-in method is not available right now.',
  oauth_failed: 'Social sign-in failed. Please try again.'
};

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const errorCode = searchParams.get('error');
  const socialError = errorCode && (SOCIAL_LOGIN_ERRORS[errorCode] || SOCIAL_LOGIN_ERRORS.oauth_failed);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {socialError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {socialError}
            </div>
          )}

          <LoginForm />

          <div className="mt-6">
            <SocialLogin />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
