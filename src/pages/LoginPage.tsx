import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, Mail, Sparkles, Zap } from 'lucide-react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { loginRequest } from '../api/authApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuthStore } from '../store/authStore';
import { getErrorMessage } from '../utils/format';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (values: LoginForm) => {
    setSubmitting(true);
    try {
      const result = await loginRequest(values.email.trim(), values.password);
      login(result.token, result.user);
      toast.success(`Welcome back, ${result.user.name.split(' ')[0]}!`);
      navigate(result.user.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      <div className="auth-gradient relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_50%)]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-accent-500/20 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Bizora App</span>
        </Link>

        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Your business hub
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Welcome back to your business hub.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            Manage your digital card, products, orders and subscriptions - all from one beautiful dashboard.
          </p>
        </div>

        <p className="relative text-sm text-brand-200/80">(c) {new Date().getFullYear()} Bizora App</p>
      </div>

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 dark:bg-slate-950 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Bizora App</span>
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
              })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="********"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
            <Button type="submit" fullWidth loading={submitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
