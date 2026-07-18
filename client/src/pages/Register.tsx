import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const registerSchema = zod.object({
  email: zod.string().email('Invalid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string().min(6, 'Password confirmation is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFields = zod.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFields) => {
    setSubmitError(null);
    try {
      await signUp(data.email, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Registration failed. Email might already be registered.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/uf6qp7jz/image/upload/f_auto,q_auto/ndlealogo_l2rdji" alt="NDLEA Logo" className="h-10 w-auto object-contain" />
            <span className="font-bold text-2xl tracking-wider text-white">Merlin</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-wide uppercase">
          Create Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="cyber-panel p-8 bg-cyber-surface-card/60 backdrop-blur-md">
          {isSuccess ? (
            <div className="text-center py-6">
              <Shield className="h-16 w-16 text-cyber-success mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-white mb-2">Registration Request Received!</h3>
              <p className="text-sm text-cyber-text-muted">
                Your account is being provisioned. Redirecting to terminal dashboard...
              </p>
              <div className="mt-6 flex justify-center">
                <Loader2 className="h-6 w-6 text-cyber-primary animate-spin" />
              </div>
            </div>
          ) : (
            <>
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
                    className="w-full px-4 py-3 bg-cyber-surface border border-cyber-border text-cyber-text focus:border-cyber-primary"
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
                      className="w-full px-4 py-3 bg-cyber-surface border border-cyber-border text-cyber-text focus:border-cyber-primary"
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
                  <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2">
                    Confirm Access Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-cyber-surface border border-cyber-border text-cyber-text focus:border-cyber-primary"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-xs text-cyber-danger">{errors.confirmPassword.message}</p>
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
                        <Loader2 className="h-5 w-5 animate-spin" /> Provisioning Node...
                      </>
                    ) : (
                      'Request Authorization'
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-cyber-text-muted">
                  Already registered on this node?{' '}
                  <Link to="/login" className="text-cyber-primary hover:underline font-semibold">
                    Sign In
                  </Link>
                </p>
                <p className="mt-4 text-xs text-cyber-text-muted">
                  <Link to="/" className="hover:text-cyber-primary transition-colors">
                    &larr; Back to Public Landing
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-5 pointer-events-none" />
    </div>
  );
};
