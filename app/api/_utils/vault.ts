// Server-only Vault helper (dev-friendly). Do not import from client components.

import { vaultConfig } from './env';

// Simple dev-mode in-memory store fallback
const devStore: Record<string, string> = {};

export async function vaultRead(key: string): Promise<string | null> {
  const { addr, token, kvPath } = vaultConfig(false);
  if (!addr || !token) {
    // Dev fallback
    return devStore[key] ?? null;
  }
  const url = `${addr.replace(/\/$/, '')}/v1/${kvPath}/${encodeURIComponent(key)}`;
  const res = await fetch(url, { headers: { 'X-Vault-Token': token } });
  if (!res.ok) return null;
  const j: any = await res.json();
  return j?.data?.value ?? null;
}

export async function vaultWrite(key: string, value: string): Promise<boolean> {
  const { addr, token, kvPath } = vaultConfig(false);
  if (!addr || !token) {
    devStore[key] = value;
    return true;
  }
  const url = `${addr.replace(/\/$/, '')}/v1/${kvPath}/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'X-Vault-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ value })
  });
  return res.ok;
}

