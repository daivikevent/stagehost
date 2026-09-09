'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ensureCleanProfileSlug } from '@/lib/actions/auth';
import { useToast } from '@/hooks/useToast';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import styles from '../auth.module.css';

const BENEFITS = [
  'Professional portfolio website',
  'Smart schedule management',
  'Direct client inquiries',
  'Free forever, upgrade anytime',
];

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'anchor',
          },
        },
      });

      if (authError) {
        error(authError.message);
        return;
      }

      if (data.user) {
        try {
          await ensureCleanProfileSlug(data.user.id, name);
        } catch (slugErr) {
          console.error('Error ensuring clean slug:', slugErr);
        }
      }

      if (data.user && !data.session) {
        success('Account created! Please check your email to confirm, or log in.');
        router.push('/login');
      } else {
        success('Account created! Welcome to StageHost.');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        error(authError.message);
      }
    } catch {
      error('Google signup failed. Please try again.');
    }
  };

  return (
    <div className={styles.authCard}>
      {/* Logo */}
      <Link href="/" className={styles.logo}>
        <Sparkles size={24} />
        <span>StageHost</span>
      </Link>

      <h1 className={styles.title}>Build Your Digital Stage</h1>
      <p className={styles.subtitle}>Create your professional anchor portfolio in minutes</p>

      {/* Benefits */}
      <div className={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <div key={benefit} className={styles.benefit}>
            <Check size={16} color="var(--color-success)" />
            <span>{benefit}</span>
          </div>
        ))}
      </div>

      {/* Google OAuth */}
      <button
        type="button"
        className={`btn btn-ghost btn-block ${styles.socialBtn}`}
        onClick={handleGoogleRegister}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleRegister} className={styles.form}>
        <div className="input-group">
          <label className="input-label" htmlFor="register-name">
            Full Name <span className="required">*</span>
          </label>
          <div className="input-with-icon">
            <User size={18} className="input-icon" />
            <input
              id="register-name"
              type="text"
              className="input"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="register-email">
            Email <span className="required">*</span>
          </label>
          <div className="input-with-icon">
            <Mail size={18} className="input-icon" />
            <input
              id="register-email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="register-password">
            Password <span className="required">*</span>
          </label>
          <div className="input-with-icon">
            <Lock size={18} className="input-icon" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              style={{ paddingRight: '44px' }}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-tertiary">Must be at least 6 characters</p>
        </div>

        <button
          type="submit"
          className={`btn btn-accent btn-block btn-lg ${loading ? 'btn-loading' : ''}`}
          disabled={loading}
        >
          {!loading && (
            <>
              Create Free Account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className={styles.switchText}>
        Already have an account?{' '}
        <Link href="/login" className={styles.switchLink}>
          Log in
        </Link>
      </p>

      <p className={styles.terms}>
        By creating an account, you agree to our{' '}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </p>
    </div>
  );
}
