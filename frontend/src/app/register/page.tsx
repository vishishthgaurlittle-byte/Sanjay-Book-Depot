'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Field, inputBorderStyle, inputClass } from '@/components/Field';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import { register } from '@/lib/auth-client';

const schema = z
  .object({
    name: z.string().min(2, 'Tell us your name'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    setServerError(null);
    const res = await register(values.email, values.password, values.name);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    // TODO: point at /account once that page exists. It does not yet, so
    // sending a new customer there would land them on a 404.
    router.push('/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-md">
        <p className="eyebrow text-center">Join us</p>
        <h1 className="display mt-5 text-center text-[clamp(2.2rem,5vw,3.25rem)]">
          Create your account
        </h1>
        <p className="mt-6 text-center text-[13px] leading-relaxed text-ink-500">
          Track orders, save addresses and check out faster.
        </p>

        <div className="mt-10">
          <GoogleAuthButton redirectTo="/" />
        </div>

        <div className="my-8 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-ink-600">
          <span className="h-px flex-1" style={{ background: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }} />
          or
          <span className="h-px flex-1" style={{ background: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-9">
          <Field label="Full name" error={errors.name?.message}>
            <input
              autoComplete="name"
              placeholder="Your name"
              style={inputBorderStyle}
              className={inputClass}
              {...field('name')}
            />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              style={inputBorderStyle}
              className={inputClass}
              {...field('email')}
            />
          </Field>

          <Field
            label="Password"
            error={errors.password?.message}
            hint="At least six characters"
          >
            <input
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              style={inputBorderStyle}
              className={inputClass}
              {...field('password')}
            />
          </Field>

          <Field label="Confirm password" error={errors.confirm?.message}>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Repeat password"
              style={inputBorderStyle}
              className={inputClass}
              {...field('confirm')}
            />
          </Field>

          {serverError && (
            <p
              className="border-l-2 py-2 pl-4 text-[12px] leading-relaxed text-ink-200"
              style={{ borderColor: 'var(--color-saffron-600)' }}
              role="alert"
            >
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="lux-btn w-full">
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-10 text-center text-[12px] text-ink-500">
          Already registered?{' '}
          <Link href="/login" className="text-saffron-500 transition-colors hover:text-saffron-400">
            Sign in
          </Link>
        </p>

        <p
          className="mt-14 border-t pt-8 text-center text-[10px] leading-relaxed tracking-wide text-ink-600"
          style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
        >
          Accounts are managed by Insforge. We never see your password.
        </p>
      </div>
    </div>
  );
}
