// Server-only env helpers. Do not import from client components.

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

export function getEnv(name: string, fallback?: string): string | undefined {
  const v = process.env[name];
  return v ?? fallback;
}

export function envBool(name: string, defaultFalse = true): boolean {
  const raw = process.env[name];
  if (raw == null) return defaultFalse ? false : true;
  return raw !== 'false' && raw !== '0' && raw !== '';
}

export function vaultConfig(required: boolean) {
  const addr = process.env.VAULT_ADDR;
  const token = process.env.VAULT_TOKEN;
  const kvPath = process.env.VAULT_KV_PATH || '';
  if (required) {
    if (!addr) throw new Error('VAULT_ADDR missing');
    if (!token) throw new Error('VAULT_TOKEN missing');
    if (!kvPath) throw new Error('VAULT_KV_PATH missing');
  }
  return { addr, token, kvPath } as { addr?: string; token?: string; kvPath: string };
}

