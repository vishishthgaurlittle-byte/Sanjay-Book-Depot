'use client';

import { useCallback, useEffect, useState } from 'react';

import AdminNav from '@/components/AdminNav';

import { currentUser, getToken } from '@/lib/auth-client';
import { THEMES, themeCss, type Theme } from '@/lib/themes';

interface ThemeMeta {
  active: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

/**
 * Live preview: write the selected theme's tokens straight onto :root so the
 * whole site re-skins instantly, before anything is saved. Removing the node
 * (or reloading) restores the committed theme.
 */
const PREVIEW_ID = 'theme-live-preview';

function applyPreview(theme: Theme | null) {
  let tag = document.getElementById(PREVIEW_ID) as HTMLStyleElement | null;
  if (!theme) {
    tag?.remove();
    return;
  }
  if (!tag) {
    tag = document.createElement('style');
    tag.id = PREVIEW_ID;
    document.body.appendChild(tag);
  }
  tag.textContent = themeCss(theme);
  document.documentElement.dataset.themeMode = theme.mode;
}

export default function AdminSettingsPage() {
  const [meta, setMeta] = useState<ThemeMeta | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/theme', { cache: 'no-store' });
        if (!res.ok) throw new Error('Could not load themes');
        const data = (await res.json()) as ThemeMeta;
        if (!cancelled) {
          setMeta(data);
          setPreviewId(data.active);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    currentUser()
      .then((u) => !cancelled && setSignedIn(Boolean(u)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-skin the page as the admin moves between options.
  useEffect(() => {
    const theme = THEMES.find((t) => t.id === previewId) ?? null;
    applyPreview(theme);
    return () => applyPreview(null);
  }, [previewId]);

  const save = useCallback(async () => {
    if (!previewId) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({ themeId: previewId }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMeta((m) => (m ? { ...m, active: previewId } : m));
      setMessage(`“${THEMES.find((t) => t.id === previewId)?.name}” is now live.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [previewId]);

  const selected = THEMES.find((t) => t.id === previewId);
  const committed = meta?.active ?? null;
  const dirty = previewId !== null && previewId !== committed;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6 lg:px-10">
      <AdminNav />
      <header className="max-w-2xl">
        <p className="eyebrow">Admin · Appearance</p>
        <h1 className="display mt-4 text-[clamp(2.2rem,5vw,3.75rem)]">Storefront theme</h1>
        <p className="mt-6 text-[15px] leading-[1.8] text-ink-400">
          Ten hand-tuned palettes. Selecting one previews it across the entire
          site immediately; the change only becomes permanent once you apply it.
          Only signed-in administrators can apply.
        </p>
      </header>

      {/* Status strip */}
      <div
        className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4 border-y py-6 text-[11px] uppercase tracking-[0.16em]"
        style={{ borderColor: 'color-mix(in oklab, var(--color-ink-50) 10%, transparent)' }}
      >
        <span className="text-ink-500">
          Live theme ·{' '}
          <span className="text-saffron-500">
            {loading ? '—' : (THEMES.find((t) => t.id === committed)?.name ?? committed ?? '—')}
          </span>
        </span>
        {meta?.updatedBy && (
          <span className="text-ink-500">
            Last set by <span className="text-ink-300">{meta.updatedBy}</span>
          </span>
        )}
        {meta?.updatedAt && (
          <span className="text-ink-500">
            <span className="text-ink-300">{meta.updatedAt} UTC</span>
          </span>
        )}
        <span className={signedIn ? 'text-saffron-600' : 'text-ink-500'}>
          {signedIn ? 'Signed in' : 'Not signed in'}
        </span>
      </div>

      {!signedIn && (
        <div
          className="mt-8 border px-6 py-5 text-[13px] leading-relaxed text-ink-300"
          style={{ borderColor: 'color-mix(in oklab, var(--color-saffron-500) 40%, transparent)' }}
        >
          You are browsing as a visitor. You can preview any theme, but applying
          one requires an administrator account —{' '}
          <a href="/login" className="text-saffron-500 underline underline-offset-4">
            sign in
          </a>{' '}
          with the owner address.
        </div>
      )}

      {error && (
        <div
          className="mt-8 border px-6 py-5 text-[13px] text-ink-200"
          style={{ borderColor: '#B3453B' }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="mt-8 border px-6 py-5 text-[13px] text-ink-200"
          style={{ borderColor: 'color-mix(in oklab, var(--color-saffron-500) 50%, transparent)' }}
        >
          {message}
        </div>
      )}

      {/* Theme grid */}
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((t) => {
          const isActive = t.id === previewId;
          const isCommitted = t.id === committed;
          return (
            <button
              key={t.id}
              onClick={() => setPreviewId(t.id)}
              className="lux-card group text-left"
              style={
                isActive
                  ? { borderColor: 'color-mix(in oklab, var(--color-saffron-500) 60%, transparent)' }
                  : undefined
              }
            >
              {/* Swatch preview — an actual miniature of the theme. */}
              <div
                className="relative aspect-[16/10] w-full overflow-hidden"
                style={{ background: t.bg }}
              >
                <div
                  className="absolute inset-x-4 bottom-4 top-10"
                  style={{ background: t.surface, border: `1px solid ${t.muted}33` }}
                />
                <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                  <span
                    className="text-[8px] font-medium uppercase tracking-[0.22em]"
                    style={{ color: t.accent }}
                  >
                    {t.mode}
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.22em]" style={{ color: t.muted }}>
                    {t.id}
                  </span>
                </div>
                <div className="absolute inset-x-7 bottom-7 top-14 flex flex-col justify-between">
                  <div>
                    <div className="h-2 w-2/3" style={{ background: t.text }} />
                    <div className="mt-2 h-1.5 w-1/2" style={{ background: t.muted }} />
                  </div>
                  <div className="flex gap-2">
                    <span className="h-5 w-16" style={{ background: t.accent }} />
                    {t.accent2 && (
                      <span className="h-5 w-8" style={{ background: t.accent2 }} />
                    )}
                    <span
                      className="h-5 flex-1"
                      style={{ border: `1px solid ${t.muted}66` }}
                    />
                  </div>
                </div>

                {isCommitted && (
                  <span
                    className="absolute right-3 top-3 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.16em]"
                    style={{ background: t.accent, color: t.bg }}
                  >
                    Live
                  </span>
                )}
              </div>

              <div className="px-5 py-5">
                <h3 className="text-[15px] font-medium text-ink-100">{t.name}</h3>
                <p className="mt-2 text-[12px] leading-relaxed text-ink-400">{t.vibe}</p>
                <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
                  Best for {t.bestFor.toLowerCase()}.
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {[t.bg, t.surface, t.text, t.muted, t.accent, t.accent2]
                    .filter(Boolean)
                    .map((c) => (
                      <span
                        key={c as string}
                        title={c as string}
                        className="h-4 w-4 rounded-full"
                        style={{
                          background: c as string,
                          border: '1px solid color-mix(in oklab, var(--color-ink-50) 18%, transparent)',
                        }}
                      />
                    ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Apply bar */}
      <div
        className="sticky bottom-0 mt-14 flex flex-wrap items-center justify-between gap-4 border-t py-6 backdrop-blur-xl"
        style={{
          borderColor: 'color-mix(in oklab, var(--color-ink-50) 12%, transparent)',
          backgroundColor: 'color-mix(in oklab, var(--color-ink-950) 85%, transparent)',
        }}
      >
        <p className="text-[12px] tracking-wide text-ink-400">
          {dirty
            ? `Previewing “${selected?.name}” — not yet applied.`
            : 'No pending changes.'}
        </p>
        <div className="flex gap-3">
          {dirty && (
            <button
              onClick={() => setPreviewId(committed)}
              className="lux-btn-ghost hover:border-saffron-500 hover:text-saffron-500"
            >
              Discard
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="lux-btn min-w-[180px]"
          >
            {saving ? 'Applying…' : 'Apply theme'}
          </button>
        </div>
      </div>
    </div>
  );
}
