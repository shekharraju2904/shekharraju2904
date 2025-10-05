import React, { useState } from 'react';
import { User } from '../types';

interface ProfilePageProps {
  user: User;
  onUpdateProfile: (name: string) => void;
  onUpdatePassword: (password: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdateProfile, onUpdatePassword }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters long.');
        return;
    }
    if (password !== confirmPassword) {
        setPasswordError('Passwords do not match.');
        return;
    }
    onUpdatePassword(password);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-neutral-900">My Profile</h2>
      
      <div className="grid grid-cols-1 gap-8 mt-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold leading-6 text-neutral-900">Profile Information</h3>
            <p className="mt-1 text-sm text-neutral-600">This information will be displayed publicly so be careful what you share.</p>
            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-500">Email Address</label>
                    <p className="mt-1 text-base text-neutral-900">{user.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-500">Username</label>
                    <p className="mt-1 text-base text-neutral-900">{user.username}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-500">Role</label>
                    <p className="mt-1 text-base text-neutral-900 capitalize">{user.role}</p>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-neutral-700">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full mt-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
                <div className="pt-2 text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700">Save Changes</button>
                </div>
            </form>
        </div>

        {/* Change Password */}
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold leading-6 text-neutral-900">Change Password</h3>
            <p className="mt-1 text-sm text-neutral-600">Update your password associated with your account.</p>
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="new-password">New Password</label>
                    <input
                        type="password"
                        id="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full mt-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full mt-1 border-neutral-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                </div>
                {passwordError && <p className="text-sm text-accent-600">{passwordError}</p>}
                <div className="pt-2 text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary-600 hover:bg-primary-700">Update Password</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;