/**
 * Form field with a hairline underline rather than a boxed input — the
 * quieter treatment suits the luxury palettes, and it reads the same on both
 * dark and light themes because every colour comes from a theme token.
 */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-500">
        {label}
      </span>
      <div className="mt-2.5">{children}</div>
      {error ? (
        <span className="mt-2 block text-[11px] text-saffron-600">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-[11px] text-ink-600">{hint}</span>
      ) : null}
    </label>
  );
}

/** Underline input styling shared by the auth forms. */
export const inputClass =
  'w-full border-b bg-transparent py-2.5 text-[14px] text-ink-100 outline-none transition-colors duration-300 placeholder:text-ink-600 focus:border-saffron-500';

/**
 * The border colour lives in a style attribute rather than a Tailwind class so
 * it can use color-mix against the theme's own text colour — a fixed
 * `border-ink-700` would be near-invisible on the light palettes.
 */
export const inputBorderStyle: React.CSSProperties = {
  borderColor: 'color-mix(in oklab, var(--color-ink-50) 20%, transparent)',
};
