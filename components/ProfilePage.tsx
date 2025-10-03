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
      <h2 className="text-2xl font-bold tracking-tight text-gray-900">My Profile</h2>
      
      <div className="grid grid-cols-1 gap-8 mt-6 md:grid-cols-2">
        {/* Profile Information */}
        <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">Profile Information</h3>
            <p className="mt-1 text-sm text-gray-600">This information will be displayed publicly so be careful what you share.</p>
            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500">Email Address</label>
                    <p className="mt-1 text-base text-gray-900">{user.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Username</label>
                    <p className="mt-1 text-base text-gray-900">{user.username}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500">Role</label>
                    <p className="mt-1 text-base text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </div>
                <div className="text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Save Changes</button>
                </div>
            </form>
        </div>

        {/* Change Password */}
        <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold leading-6 text-gray-900">Change Password</h3>
            <p className="mt-1 text-sm text-gray-600">Update your password associated with your account.</p>
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="new-password">New Password</label>
                    <input
                        type="password"
                        id="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password">Confirm New Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </div>
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                <div className="text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm bg-primary hover:bg-primary-hover">Update Password</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;