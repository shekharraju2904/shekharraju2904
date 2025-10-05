import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      // Since email confirmation is disabled, the user is automatically logged in.
      // The onAuthStateChange listener in App.tsx will handle the redirect.
      setMessage('Registration successful! You will be logged in automatically.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-sky-100 via-indigo-100 to-rose-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-secondary-500 to-primary-500 bg-clip-text text-transparent">
            ExpenseFlow
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            {isLoginView ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={isLoginView ? handleLogin : handleSignup}>
          {!isLoginView && (
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="relative block w-full px-3 py-2 text-neutral-900 placeholder-neutral-500 bg-white border border-neutral-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 text-neutral-900 placeholder-neutral-500 bg-white border border-neutral-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password-input" className="sr-only">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              autoComplete={isLoginView ? "current-password" : "new-password"}
              required
              className="relative block w-full px-3 py-2 text-neutral-900 placeholder-neutral-500 bg-white border border-neutral-300 rounded-md appearance-none focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-sm text-accent-600">{error}</p>}
          {message && !error && <p className="text-sm text-success-600">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md shadow-sm group bg-gradient-to-r from-secondary-500 to-primary-500 hover:from-secondary-600 hover:to-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 transition-transform duration-200 hover:scale-105"
            >
              {loading ? 'Processing...' : (isLoginView ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setMessage('');}} className="font-medium text-primary-600 hover:text-primary-500">
                {isLoginView ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;