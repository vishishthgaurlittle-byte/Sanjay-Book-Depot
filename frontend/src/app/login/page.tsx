'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Field, inputBorderStyle, inputClass } from '@/components/Field';
import { login } from '@/lib/auth-client';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Form) {
    setServerError(null);
    const res = await login(values.email, values.password);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    // TODO: point at /account once that page exists. It does not yet, so
    // sending a freshly signed-in customer there would land them on a 404.
    router.push('/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-md">
        <p className="eyebrow text-center">Your account</p>
        <h1 className="display mt-5 text-center text-[clamp(2.2rem,5vw,3.25rem)]">Sign in</h1>
        <p className="mt-6 text-center text-[13px] leading-relaxed text-ink-500">
          Track orders, save addresses and check out faster.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-14 space-y-9">
          <Field label="Email" error={errors.email?.message}>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              style={inputBorderStyle}
              className={inputClass}
              {...register('email')}
            />
          </Field>

          <Field label="Password" error={errors.password?.message}>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              style={inputBorderStyle}
              className={inputClass}
              {...register('password')}
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
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-10 text-center text-[12px] text-ink-500">
          New here?{' '}
          <Link href="/register" className="text-saffron-500 transition-colors hover:text-saffron-400">
            Create an account
          </Link>
        </p>

        <p
          className="mt-14 border-t pt-8 text-center text-[10px] leading-relaxed tracking-wide text-ink-600"
          style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
        >
          Authentication is handled by Insforge. Your session token never leaves
          this browser except to our own server, which forwards it unchanged.
        </p>
      </div>
    </div>
  );
}
