import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Lock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Store,
  User,
  Zap,
} from 'lucide-react';
import { registerRequest } from '../api/authApi';
import { createBusiness } from '../api/businessApi';
import { getPlans, createSubscription } from '../api/paymentApi';
import { Button } from '../components/common/Button';
import { Input, Textarea } from '../components/common/Input';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useAuthStore } from '../store/authStore';
import { useBusinessStore } from '../store/businessStore';
import type { SubscriptionPlan } from '../types';
import { formatCurrency, getErrorMessage } from '../utils/format';

interface OwnerForm {
  name: string;
  mobile: string;
  email: string;
  password: string;
}

interface BizForm {
  businessName: string;
  description: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const stepMeta = [
  { n: 1, label: 'Your details' },
  { n: 2, label: 'Business' },
  { n: 3, label: 'Choose plan' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const refreshBusinesses = useBusinessStore((s) => s.refresh);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const [owner, setOwner] = useState<OwnerForm | null>(null);
  const [biz, setBiz] = useState<BizForm | null>(null);

  const ownerForm = useForm<OwnerForm>();
  const bizForm = useForm<BizForm>();

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  const submitOwner = (values: OwnerForm) => {
    setOwner(values);
    setStep(2);
  };

  const submitBiz = (values: BizForm) => {
    setBiz(values);
    setStep(3);
  };

  const finish = async () => {
    if (!owner || !biz) return;
    setSubmitting(true);
    try {
      const result = await registerRequest({
        name: owner.name.trim(),
        email: owner.email.trim(),
        mobile: owner.mobile.trim(),
        password: owner.password,
      });
      login(result.token, result.user);

      const created = await createBusiness({
        businessName: biz.businessName.trim(),
        description: biz.description?.trim() || undefined,
        phone: biz.phone?.trim() || undefined,
        whatsappNumber: biz.whatsappNumber?.trim() || undefined,
        address: biz.address?.trim() || undefined,
        city: biz.city?.trim() || undefined,
        state: biz.state?.trim() || undefined,
        pincode: biz.pincode?.trim() || undefined,
      });
      await refreshBusinesses();

      const isFree = selectedPlan && Number(selectedPlan.price) === 0;
      if (selectedPlan && isFree && created?.id && selectedPlan.id) {
        try {
          await createSubscription(created.id, selectedPlan.id);
        } catch {
          /* free plan activation is best-effort */
        }
        toast.success('Welcome to Bizora App! Your business is live.');
        navigate('/dashboard', { replace: true });
      } else if (selectedPlan && !isFree) {
        toast.success('Account created! Complete your subscription to unlock everything.');
        navigate('/dashboard/subscription', { replace: true });
      } else {
        toast.success('Account created! Let\'s finish setting up.');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Registration failed'));
      setStep(1);
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
          <h2 className="text-4xl font-bold leading-tight tracking-tight">Launch your business in 3 easy steps.</h2>
          <p className="mt-4 max-w-md text-brand-100">
            Create your account, add your business details, and pick a plan ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â you'll be online in
            minutes.
          </p>
          <div className="mt-10 space-y-4">
            {stepMeta.map((s) => (
              <div key={s.n} className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                    step >= s.n
                      ? 'border-white bg-white text-brand-700'
                      : 'border-white/40 text-white/70'
                  }`}
                >
                  {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                </div>
                <span className={step >= s.n ? 'font-medium' : 'text-white/70'}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-brand-200/80">(c) {new Date().getFullYear()} Bizora App</p>
      </div>

      <div className="flex w-full items-center justify-center bg-white px-6 py-12 dark:bg-slate-950 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Bizora App</span>
            </Link>
          </div>

          {/* Mobile stepper */}
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            {stepMeta.map((s) => (
              <div
                key={s.n}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step >= s.n ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create your account</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Step 1 of 3 - your details</p>
                <form onSubmit={ownerForm.handleSubmit(submitOwner)} className="mt-8 space-y-4">
                  <Input
                    label="Full name"
                    leftIcon={<User className="h-4 w-4" />}
                    error={ownerForm.formState.errors.name?.message}
                    {...ownerForm.register('name', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name is too short' },
                    })}
                  />
                  <Input
                    label="Mobile"
                    leftIcon={<Phone className="h-4 w-4" />}
                    error={ownerForm.formState.errors.mobile?.message}
                    {...ownerForm.register('mobile', {
                      required: 'Mobile is required',
                      pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit mobile' },
                    })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    leftIcon={<Mail className="h-4 w-4" />}
                    error={ownerForm.formState.errors.email?.message}
                    {...ownerForm.register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
                    })}
                  />
                  <Input
                    label="Password"
                    type="password"
                    leftIcon={<Lock className="h-4 w-4" />}
                    error={ownerForm.formState.errors.password?.message}
                    {...ownerForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'At least 6 characters' },
                    })}
                  />
                  <Button type="submit" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Continue
                  </Button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Your business</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Step 2 of 3 - business details</p>
                <form onSubmit={bizForm.handleSubmit(submitBiz)} className="mt-8 space-y-4">
                  <Input
                    label="Business name"
                    leftIcon={<Store className="h-4 w-4" />}
                    error={bizForm.formState.errors.businessName?.message}
                    {...bizForm.register('businessName', { required: 'Business name is required' })}
                  />
                  <Textarea label="Short description" rows={2} {...bizForm.register('description')} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Phone" leftIcon={<Phone className="h-4 w-4" />} {...bizForm.register('phone')} />
                    <Input
                      label="WhatsApp"
                      error={bizForm.formState.errors.whatsappNumber?.message}
                      {...bizForm.register('whatsappNumber', {
                        pattern: { value: /^[0-9+\s]{10,15}$/, message: 'Invalid number' },
                      })}
                    />
                  </div>
                  <Input label="Address" leftIcon={<MapPin className="h-4 w-4" />} {...bizForm.register('address')} />
                  <div className="grid grid-cols-3 gap-3">
                    <Input label="City" {...bizForm.register('city')} />
                    <Input label="State" {...bizForm.register('state')} />
                    <Input label="Pincode" {...bizForm.register('pincode')} />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back
                    </Button>
                    <Button type="submit" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
                      Continue
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Choose a plan</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Step 3 of 3 - you can change this anytime</p>

                <div className="mt-6 space-y-3">
                  {plans.length === 0 && (
                    <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500 dark:border-slate-700">
                      No plans available - you can subscribe later from your dashboard.
                    </p>
                  )}
                  {plans.map((plan) => {
                    const active = selectedPlan?.id === plan.id;
                    return (
                      <button
                        type="button"
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-all ${
                          active
                            ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/30 dark:bg-brand-500/10'
                            : 'border-slate-200 hover:border-brand-300 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                              active
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                            }`}
                          >
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{plan.name}</p>
                            <p className="text-xs text-slate-500">{plan.durationDays} days</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-slate-100">
                            {Number(plan.price) === 0 ? 'Free' : formatCurrency(plan.price)}
                          </p>
                          {active && (
                            <span className="text-xs font-medium text-brand-600">Selected</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    fullWidth
                    loading={submitting}
                    onClick={finish}
                    leftIcon={<Sparkles className="h-4 w-4" />}
                  >
                    {selectedPlan && Number(selectedPlan.price) > 0 ? 'Create & continue to payment' : 'Create my business'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
