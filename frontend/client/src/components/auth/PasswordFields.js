import React from 'react';

// New password + confirmation, with the same rules the server enforces
const PasswordFields = ({ register, errors, watch, label = 'New password' }) => {
  const password = watch('password');

  return (
    <>
      <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <input
          type="password"
          autoComplete="new-password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
            validate: {
              hasNumber: value => /\d/.test(value) || 'Password must contain at least one number',
              hasLetter: value => /[a-zA-Z]/.test(value) || 'Password must contain at least one letter'
            }
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirm password</label>
        <input
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: value => value === password || 'Passwords do not match'
          })}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
      </div>
    </>
  );
};

export default PasswordFields;
