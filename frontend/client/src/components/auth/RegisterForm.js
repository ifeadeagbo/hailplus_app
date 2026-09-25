import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';

const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          type="text"
          {...register('name', { 
            required: 'Name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters'
            }
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

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
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirm Password</label>
        <input
          type="password"
          {...register('confirmPassword', { 
            required: 'Please confirm your password',
            validate: value =>
              value === password || 'Passwords do not match'
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating Account...' : 'Register'}
      </button>
    </form>
  );
};

export default RegisterForm;