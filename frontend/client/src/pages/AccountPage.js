import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import PasswordFields from '../components/auth/PasswordFields';

const ProfileForm = ({ user, onSaved }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm({
    defaultValues: { name: user.name }
  });

  const onSubmit = async ({ name }) => {
    try {
      const response = await authService.updateProfile({ name });
      onSaved(response.user);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not update profile');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <input
          {...register('name', {
            required: 'Name is required',
            minLength: { value: 2, message: 'Name must be at least 2 characters' },
            maxLength: { value: 50, message: 'Name must be at most 50 characters' }
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input value={user.email} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-500" />
        <p className="text-xs text-gray-500 mt-1">Contact support to change your email address.</p>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
};

const ChangePasswordForm = () => {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ currentPassword, password }) => {
    try {
      await authService.changePassword(currentPassword, password);
      reset();
      toast.success('Password changed. Other devices have been signed out.');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not change password');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Current password</label>
        <input
          type="password"
          autoComplete="current-password"
          {...register('currentPassword', { required: 'Current password is required' })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>}
      </div>
      <PasswordFields register={register} errors={errors} watch={watch} />
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Saving...' : 'Change password'}
      </button>
    </form>
  );
};

const AccountPage = () => {
  const { user, setUser } = useAuth();
  const usesPassword = user.provider === 'local';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Account</h1>
        <Link to="/orders" className="text-blue-600 hover:text-blue-800">View my orders →</Link>
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Profile</h2>
        <ProfileForm user={user} onSaved={setUser} />
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Password</h2>
        {usesPassword ? (
          <ChangePasswordForm />
        ) : (
          <p className="text-gray-600">
            You sign in with {user.provider.charAt(0).toUpperCase() + user.provider.slice(1)}, so there is no password to change here.
          </p>
        )}
      </section>
    </div>
  );
};

export default AccountPage;
