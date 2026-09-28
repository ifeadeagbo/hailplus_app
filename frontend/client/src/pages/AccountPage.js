import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

// Erases the customer's personal details; order records are kept for tax
const DeleteAccount = ({ user, onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [deleting, setDeleting] = useState(false);
  const usesPassword = user.provider === 'local';

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!window.confirm('Delete your account permanently? This cannot be undone.')) return;
    try {
      setDeleting(true);
      await authService.deleteAccount(usesPassword ? { password: value } : { confirm: value });
      toast.success('Your account has been deleted');
      onDeleted();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not delete your account');
    } finally {
      setDeleting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-red-700 underline hover:text-red-900">
        Delete my account
      </button>
    );
  }

  return (
    <form onSubmit={handleDelete} className="space-y-4">
      <p className="text-sm text-gray-700">
        This permanently removes your name, email address and sign-in details, and signs you out on every device.
        Records of past orders are kept, without your login, because UK tax rules require us to keep sales records.
        You can't delete your account while an order is still being processed or delivered.
      </p>
      <div>
        <label className="block text-sm font-medium mb-2">
          {usesPassword ? 'Enter your password to confirm' : 'Type DELETE to confirm'}
        </label>
        <input
          type={usesPassword ? 'password' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete={usesPassword ? 'current-password' : 'off'}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={deleting || !value}
          className="px-6 py-2 bg-red-700 text-white text-xs font-semibold uppercase tracking-label hover:bg-red-800 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete my account'}
        </button>
        <button type="button" onClick={() => { setOpen(false); setValue(''); }} className="btn-outline px-6 py-2">
          Cancel
        </button>
      </div>
    </form>
  );
};

const AccountPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
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

      <section className="bg-white rounded-lg shadow p-6 border border-red-100">
        <h2 className="text-xl font-bold mb-4">Delete account</h2>
        <DeleteAccount
          user={user}
          onDeleted={() => { setUser(null); navigate('/'); }}
        />
      </section>
    </div>
  );
};

export default AccountPage;
