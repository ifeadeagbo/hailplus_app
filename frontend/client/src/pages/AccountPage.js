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

// Two-factor sign-in: set up with an authenticator app, or turn off
const TwoFactorSection = ({ user, onChanged }) => {
  const [stage, setStage] = useState('idle'); // idle | setup | codes | disabling
  const [setup, setSetup] = useState(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [busy, setBusy] = useState(false);

  const fail = (error, fallback) => toast.error(error.response?.data?.error || fallback);
  const reset = () => { setStage('idle'); setCode(''); setPassword(''); setSetup(null); };

  const startSetup = async () => {
    try {
      setBusy(true);
      setSetup(await authService.setupTwoFactor());
      setStage('setup');
    } catch (error) {
      fail(error, 'Could not start setup');
    } finally {
      setBusy(false);
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      const response = await authService.enableTwoFactor(code.trim());
      setRecoveryCodes(response.recoveryCodes);
      onChanged(response.user);
      setStage('codes');
      setCode('');
    } catch (error) {
      fail(error, 'That code is not valid');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async (e) => {
    e.preventDefault();
    try {
      setBusy(true);
      const response = await authService.disableTwoFactor(password, code.trim());
      onChanged(response.user);
      toast.success('Two-factor sign-in is off');
      reset();
    } catch (error) {
      fail(error, 'Could not turn off two-factor sign-in');
    } finally {
      setBusy(false);
    }
  };

  const codesText = () => `${user.email} recovery codes (each works once):\n\n${recoveryCodes.join('\n')}\n`;

  const downloadCodes = () => {
    const url = URL.createObjectURL(new Blob([codesText()], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hailplus-recovery-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (stage === 'codes') {
    return (
      <div className="space-y-4">
        <p className="text-green-700 font-medium">Two-factor sign-in is on.</p>
        <p className="text-sm text-gray-700">
          Save these recovery codes somewhere safe (a password manager or printed). If you lose your phone,
          each code lets you sign in once. <strong>They won't be shown again.</strong>
        </p>
        <div className="grid grid-cols-2 gap-2 bg-cream border border-line p-4 font-mono text-sm">
          {recoveryCodes.map(c => <span key={c}>{c}</span>)}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigator.clipboard?.writeText(codesText()).then(() => toast.success('Codes copied'))} className="btn-outline px-5 py-2">
            Copy codes
          </button>
          <button onClick={downloadCodes} className="btn-outline px-5 py-2">Download</button>
          <button onClick={() => { setRecoveryCodes([]); setStage('idle'); }} className="btn-dark px-5 py-2">
            I've saved them
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'setup' && setup) {
    return (
      <form onSubmit={confirmSetup} className="space-y-4">
        <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
          <li>Open an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password...).</li>
          <li>Scan this QR code, or enter the key by hand.</li>
          <li>Type the 6-digit code the app shows.</li>
        </ol>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <img src={setup.qrCode} alt="QR code for your authenticator app" className="w-44 h-44 border border-line" />
          <div className="text-sm">
            <p className="text-gray-600 mb-1">Key (if you can't scan):</p>
            <p className="font-mono break-all bg-cream px-2 py-1 select-all">{setup.secret}</p>
          </div>
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          className="w-40 px-4 py-2 border rounded-lg text-center tracking-[0.3em] focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-3">
          <button type="submit" disabled={busy || code.trim().length !== 6} className="btn-dark px-6 py-2">
            {busy ? 'Checking...' : 'Turn on'}
          </button>
          <button type="button" onClick={reset} className="btn-outline px-6 py-2">Cancel</button>
        </div>
      </form>
    );
  }

  if (!user.twoFactorEnabled) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Add a second step to signing in: a code from an authenticator app on your phone. Even if someone
          learns your password, they can't sign in without your phone.
          {user.role === 'admin' && <strong> Strongly recommended for admin accounts.</strong>}
        </p>
        <button onClick={startSetup} disabled={busy} className="btn-dark px-6 py-2">
          {busy ? 'Starting...' : 'Set up two-factor sign-in'}
        </button>
      </div>
    );
  }

  if (stage === 'disabling') {
    return (
      <form onSubmit={turnOff} className="space-y-4">
        {user.provider === 'local' && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
        )}
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code from your app, or a recovery code"
          autoComplete="one-time-code"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        <div className="flex gap-3">
          <button type="submit" disabled={busy || !code.trim()} className="px-6 py-2 bg-red-700 text-white text-xs font-semibold uppercase tracking-label hover:bg-red-800 disabled:opacity-50">
            {busy ? 'Turning off...' : 'Turn off'}
          </button>
          <button type="button" onClick={reset} className="btn-outline px-6 py-2">Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-green-700 font-medium">
        <i className="fa-solid fa-shield-halved mr-2"></i>Two-factor sign-in is on.
      </p>
      <button onClick={() => setStage('disabling')} className="text-sm text-red-700 underline hover:text-red-900">
        Turn off two-factor sign-in
      </button>
    </div>
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

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Two-factor sign-in</h2>
        <TwoFactorSection user={user} onChanged={setUser} />
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
