import { createClient, type InsForgeClient } from '@insforge/sdk';

/**
 * Browser-side Insforge client. Used for the OAuth (Google) flow, which talks
 * to Insforge directly. baseUrl is the public project URL (not a secret).
 */
let client: InsForgeClient | null = null;

export function insforgeBrowser(): InsForgeClient {
  if (!client) {
    client = createClient({ baseUrl: process.env.NEXT_PUBLIC_INF_BASE_URL });
  }
  return client;
}
