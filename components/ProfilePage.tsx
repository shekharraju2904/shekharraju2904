import React, { useState } from 'react';
import { User } from '../types';
import Avatar from './Avatar';

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

  const formInputStyle = "relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm";
  const formLabelStyle = "block text-sm font-medium text-neutral-300";

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-neutral-50">My Profile</h2>
        <p className="mt-1 text-neutral-400">Manage your personal information and password.</p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center space-x-4">
              <Avatar name={user.name} size="lg" />
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">{user.name}</h3>
                <p className="text-sm text-neutral-400 capitalize">{user.role}</p>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="mt-6 space-y-4">
                <div>
                    <label className={formLabelStyle}>Email Address</label>
                    <p className="mt-1 text-base text-neutral-100">{user.email}</p>
                </div>
                <div>
                    <label className={formLabelStyle}>Username</label>
                    <p className="mt-1 text-base text-neutral-100">{user.username}</p>
                </div>
                <div>
                    <label htmlFor="name" className={formLabelStyle}>Full Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`${formInputStyle} mt-1`}
                    />
                </div>
                <div className="pt-2 text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-md hover:opacity-90 transition-opacity">Save Changes</button>
                </div>
            </form>
        </div>

        <div className="p-6 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
            <h3 className="text-lg font-semibold text-neutral-100">Change Password</h3>
            <p className="mt-1 text-sm text-neutral-400">Update your password associated with your account.</p>
            <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="new-password" className={formLabelStyle}>New Password</label>
                    <input
                        type="password"
                        id="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`${formInputStyle} mt-1`}
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password" className={formLabelStyle}>Confirm New Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`${formInputStyle} mt-1`}
                    />
                </div>
                {passwordError && <p className="text-sm text-accent-danger">{passwordError}</p>}
                <div className="pt-2 text-right">
                    <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary rounded-md hover:opacity-90 transition-opacity">Update Password</button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;