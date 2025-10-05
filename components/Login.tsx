import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { LogoIcon } from './Icons';

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
      setMessage('Registration successful! You will be logged in automatically.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-neutral-800/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="text-center">
          <div className="inline-block p-2 rounded-full bg-gradient-to-br from-primary to-secondary">
            <LogoIcon className="w-12 h-12 text-white" />
          </div>
          <h2 className="mt-4 text-4xl font-extrabold text-transparent bg-gradient-to-r from-primary-light to-secondary bg-clip-text">
            ExpenseFlow
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
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
                className="relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
              className="relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
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
              className="relative block w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 text-neutral-50 placeholder-neutral-400 rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          {error && <p className="text-sm text-accent-danger">{error}</p>}
          {message && !error && <p className="text-sm text-success">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-white border border-transparent rounded-md shadow-sm group bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-primary disabled:opacity-70 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
            >
              {loading ? 'Processing...' : (isLoginView ? 'Sign in' : 'Sign up')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
            <button onClick={() => { setIsLoginView(!isLoginView); setError(''); setMessage('');}} className="font-medium text-primary-light hover:text-secondary transition-colors">
                {isLoginView ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;