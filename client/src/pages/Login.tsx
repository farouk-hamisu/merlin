import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loginSchema = zod.object({
  email: zod.string().email('Invalid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = zod.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setSubmitError(null);
    try {
      await signIn(data.email, data.password);
      
      // Fetch profile to determine redirect
      // Wait, AuthContext handles profile loading automatically.
      // We can inspect the user session or wait a split second for state update,
      // but to be safe, we check user role in profiles using the DB directly if needed,
      // or we can query our server endpoint `/api/auth/me` to check.
      // Let's redirect based on email or fetch profile role.
      // We will redirect to dashboard, and standard App route guards will redirect to admin if needed, 
      // or we can wait for AuthContext profile update.
      // To make it instant and robust, we retrieve profile from Supabase profiles table directly:
      // Since profiles is public read-only for own, we can query it!
      // But we can also just navigate to "/" and let App router redirect based on roles!
      // Let's do a direct profile fetch or delay a tiny bit to check roles.
      // Better yet, we can query '/api/auth/me' or read profile from local storage.
      // Let's wait for session and let auth status settle:
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-10 w-10 text-cyber-primary" />
            <span className="font-bold text-2xl tracking-wider text-white">Merlin</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-wide uppercase">
          Sign In to Portal
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cyber-panel p-8 bg-cyber-surface-card/60 backdrop-blur-md">
          {submitError && (
            <div className="mb-6 p-4 rounded-md bg-cyber-danger/10 border border-cyber-danger/30 flex items-center gap-3 text-cyber-danger text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                Security Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="operator@system.com"
                className="w-full px-4 py-3 bg-cyber-surface border border-cyber-border text-cyber-text focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-cyber-danger">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                Access Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-cyber-surface border border-cyber-border text-cyber-text focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-cyber-text-muted hover:text-cyber-primary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-cyber-danger">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cyber-button py-3 text-base flex items-center justify-center font-bold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Verifying Credentials...
                  </>
                ) : (
                  'Authorize Access'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-cyber-text-muted">
              First time on the platform?{' '}
              <Link to="/register" className="text-cyber-primary hover:underline font-semibold">
                Request Registration
              </Link>
            </p>
            <p className="mt-4 text-xs text-cyber-text-muted">
              <Link to="/" className="hover:text-cyber-primary transition-colors">
                &larr; Back to Public Landing
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-5 pointer-events-none" />
    </div>
  );
};
