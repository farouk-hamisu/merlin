import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { Eye, EyeOff, Loader2, AlertCircle, Terminal } from 'lucide-react';
// Direct Supabase import - adjust path if your client is located elsewhere (e.g., '../lib/supabase')
import { supabase } from '../services/supabase'; 

const loginSchema = zod.object({
  email: zod.string().email('Invalid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = zod.infer<typeof loginSchema>;

export const AdminLogin: React.FC = () => {
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
      // 1. Authenticate directly via Supabase client (bypassing AuthContext signIn wrapper)
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Authentication failed. User session not established.');

      // 2. Directly query the profiles table in the database using the authenticated user ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // 3. Check for admin role
      if (profileData?.role !== 'admin') {
        // Deny access: sign out immediately if not admin
        await supabase.auth.signOut();
        setSubmitError('Access Denied: Account does not have administrator privileges.');
        return;
      }

      // 4. Force a hard redirect to the admin dashboard.
      // Using window.location.replace prevents AuthContext listeners from race-condition hijacking the route.
      window.location.replace('/admin');
      
    } catch (err: any) {
      console.error('Login error:', err);
      setSubmitError(err.message || 'Invalid admin credentials. Access Denied.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center mb-2 animate-pulse">
          <div className="p-3 bg-cyber-primary/10 border border-cyber-primary/40 rounded-full">
            <Terminal className="h-10 w-10 text-cyber-primary" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-widest uppercase font-mono">
          ROOT SHELL LOGIN
        </h2>
        <p className="text-center text-xs text-cyber-primary font-mono mt-1">
          RESTRICTED TO LEVEL-5 ADMINISTRATIVE AUTHORIZED TERMINALS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="cyber-panel p-8 bg-cyber-surface-card/80 border-t-2 border-t-cyber-primary backdrop-blur-md relative">
          
          <div className="absolute top-2 right-2 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-primary/45" />
          </div>

          {submitError && (
            <div className="mb-6 p-4 rounded-md bg-cyber-danger/10 border border-cyber-danger/30 flex items-center gap-3 text-cyber-danger text-sm font-mono">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2 font-mono">
                Operator ID (Email)
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@merlin-node.net"
                className="w-full px-4 py-3 bg-cyber-bg border border-cyber-border/70 text-cyber-text focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary font-mono text-sm"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-cyber-danger font-mono">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-cyber-text-muted mb-2 font-mono">
                Access Token (Password)
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-cyber-bg border border-cyber-border/70 text-cyber-text focus:border-cyber-primary focus:ring-1 focus:ring-cyber-primary font-mono text-sm"
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
                <p className="mt-2 text-xs text-cyber-danger font-mono">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full cyber-button py-3 text-base flex items-center justify-center font-bold font-mono tracking-wider"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Initializing Handshake...
                  </>
                ) : (
                  'Establish Auth Link'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-cyber-border/40 text-center font-mono">
            <p className="text-xs text-cyber-text-muted">
              Standard User?{' '}
              <Link to="/login" className="text-cyber-primary hover:underline">
                Portal SignIn
              </Link>
            </p>
            <p className="mt-4 text-xs text-cyber-text-muted">
              <Link to="/" className="hover:text-cyber-primary transition-colors">
                &larr; Return to Core Landing
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-[0.03] pointer-events-none" />
    </div>
  );
};
