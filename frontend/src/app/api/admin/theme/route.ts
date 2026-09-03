import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin';
import { getActiveTheme, getThemeMeta, setActiveTheme } from '@/lib/settings';
import { THEMES, isThemeId } from '@/lib/themes';

export const dynamic = 'force-dynamic';

/** The full palette list plus the active id. Public — no secrets in it. */
export async function GET() {
  const active = await getActiveTheme();
  const meta = await getThemeMeta();

  return NextResponse.json({
    active: active.id,
    updatedAt: meta.updatedAt,
    updatedBy: meta.updatedBy,
    themes: THEMES.map((t) => ({
      id: t.id,
      name: t.name,
      vibe: t.vibe,
      bestFor: t.bestFor,
      mode: t.mode,
      colors: {
        bg: t.bg,
        surface: t.surface,
        text: t.text,
        muted: t.muted,
        accent: t.accent,
        accent2: t.accent2 ?? null,
      },
    })),
  });
}

/** Switch the active theme. Admin only. */
export async function PUT(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { themeId?: unknown };

  if (!isThemeId(body.themeId)) {
    return NextResponse.json(
      {
        error: 'Unknown theme',
        valid: THEMES.map((t) => t.id),
      },
      { status: 422 },
    );
  }

  await setActiveTheme(body.themeId, auth.admin.email);

  return NextResponse.json({
    ok: true,
    active: body.themeId,
    updatedBy: auth.admin.email,
  });
}
