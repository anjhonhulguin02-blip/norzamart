"use client";

import React, { createContext, useCallback, useContext, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import Dialog from './ui/Dialog';

interface AuthPromptContextValue {
  /** Opens the plain sign-in/register dialog (e.g. the navbar's "Sign In / Register" button). */
  openAuthModal: (view?: 'login' | 'register') => void;
  /** Opens the dialog with a reason, and re-runs `action` automatically once sign-in succeeds —
   * for flows like "Add to Basket" that a signed-out visitor triggered. */
  requireAuth: (action: () => void | Promise<void>, reason?: string) => void;
}

const AuthPromptContext = createContext<AuthPromptContextValue | null>(null);

export function useAuthPrompt() {
  const ctx = useContext(AuthPromptContext);
  if (!ctx) throw new Error('useAuthPrompt must be used within AuthPromptProvider');
  return ctx;
}

export default function AuthPromptProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [pendingAction, setPendingAction] = useState<(() => void | Promise<void>) | null>(null);

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setError('');
    setSuccess('');
  };

  const openAuthModal = useCallback((view: 'login' | 'register' = 'login') => {
    setAuthView(view);
    setReason(undefined);
    setPendingAction(null);
    resetForm();
    setIsOpen(true);
  }, []);

  const requireAuth = useCallback((action: () => void | Promise<void>, reasonText?: string) => {
    setAuthView('login');
    setReason(reasonText);
    setPendingAction(() => action);
    resetForm();
    setIsOpen(true);
  }, []);

  // Memoized so its identity stays stable across re-renders (e.g. every
  // keystroke in the form, since typing updates formData state here). Dialog
  // depends on this in a useEffect deps array to manage focus/scroll-lock —
  // a fresh function reference on every render was making that effect tear
  // down and re-run on every keystroke, yanking focus off the input each
  // time and dismissing the on-screen keyboard on mobile.
  const close = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (authView === 'login') {
      const res = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError(res.error === 'CredentialsSignin' ? 'Invalid email or password. Please try again.' : res.error);
        setIsSubmitting(false);
        return;
      }

      // Batch every state change for the success path into one update so the
      // dialog closes in a single render — closing via setIsOpen(false) and
      // then separately flipping setIsSubmitting(false) a tick later (from
      // the trailing statement below) was interrupting Dialog's exit
      // animation mid-transition, leaving an invisible but still-clickable
      // full-screen overlay behind.
      setIsSubmitting(false);
      setIsOpen(false);
      if (pendingAction) {
        // Let next-auth's session update propagate before resuming, so the
        // resumed action sees a signed-in session instead of a stale one.
        const action = pendingAction;
        setPendingAction(null);
        setTimeout(() => { action(); }, 150);
      } else {
        window.location.reload();
      }
      return;
    } else {
      try {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          setSuccess('Registration successful! You can now log in.');
          setAuthView('login');
        } else {
          const data = await res.json();
          setError(data.message || 'An error occurred during registration.');
        }
      } catch {
        setError('Unable to connect to the server.');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <AuthPromptContext.Provider value={{ openAuthModal, requireAuth }}>
      {children}

      <Dialog open={isOpen} onClose={close} title={authView === 'login' ? 'Welcome Back!' : 'Create Account'}>
        <p className="text-xs text-ink/50 text-center mb-6 font-body">
          {reason || (authView === 'login'
            ? 'Sign in for a faster checkout experience at NorzaMart.'
            : 'Join our community for fresh produce and daily groceries.')}
        </p>

        {error && <div className="bg-tomato/10 border border-tomato/20 text-tomato text-xs font-semibold rounded-xl p-3 mb-4 text-center">{error}</div>}
        {success && <div className="bg-basil/10 border border-basil/20 text-basil text-xs font-semibold rounded-xl p-3 mb-4 text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {authView === 'register' && (
            <div>
              <label htmlFor="authPromptName" className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                id="authPromptName"
                type="text"
                required
                placeholder="Juan Dela Cruz"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="nm-auth-field"
              />
            </div>
          )}

          <div>
            <label htmlFor="authPromptEmail" className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input
              id="authPromptEmail"
              type="email"
              required
              placeholder="juandelacruz@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="nm-auth-field"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="authPromptPassword" className="block text-xs font-bold text-gray-700">Password</label>
              {authView === 'login' && (
                <Link
                  href="/forgot-password"
                  onClick={close}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              id="authPromptPassword"
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="nm-auth-field"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-bold py-3 rounded-xl shadow-md mt-2 text-sm transition-all tracking-wide border-none cursor-pointer">
            {isSubmitting ? 'Please wait…' : authView === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          {authView === 'login' ? "Don't have an account yet? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            className="text-emerald-700 font-extrabold hover:underline cursor-pointer bg-transparent border-none p-0 outline-none"
          >
            {authView === 'login' ? 'Register here' : 'Login here'}
          </button>
        </p>
      </Dialog>
    </AuthPromptContext.Provider>
  );
}
